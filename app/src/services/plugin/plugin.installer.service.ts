import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {execFile} from 'child_process';
import {promisify} from 'util';
import {createHash} from 'crypto';
import {promises as fs} from 'fs';
import path from 'path';
import os from 'os';
import {ClassLogger} from '@holokai/sdk';
import {env} from '../../env';
import {RedisService} from '../redis.service';
import {PluginPackageDB, PluginPackageMeta} from '../../db/plugin.package.db';

const execFileAsync = promisify(execFile);

const REDIS_TARBALL_PREFIX = 'plugin:tarball:';
const PROVIDER_PATTERN = /^@holokai\/(?:holo-)?provider-/;

@injectable()
export class PluginInstallerService extends ClassLogger {
    private readonly pluginsDir: string;
    private readonly builtinDir: string;
    private installLock: Promise<void> = Promise.resolve();

    constructor(
        private redis: RedisService,
        private pluginPackageDB: PluginPackageDB
    ) {
        super();
        this.pluginsDir = path.resolve(env.api.hotPluginsDir);
        this.builtinDir = path.resolve(env.api.builtinPluginsDir);
    }

    async ensurePluginsDir(): Promise<void> {
        const logger = this.mlog(this.ensurePluginsDir);
        await fs.mkdir(this.pluginsDir, {recursive: true});

        const pkgPath = path.join(this.pluginsDir, 'package.json');
        try {
            await fs.access(pkgPath);
        } catch {
            logger.info(`Seeding plugins directory at ${this.pluginsDir}`);
            const seedPkg = {
                name: 'holo-plugins',
                private: true,
                type: 'module',
                dependencies: {
                    '@holokai/sdk': '*',
                    '@holokai/types': '*'
                }
            };
            await fs.writeFile(pkgPath, JSON.stringify(seedPkg, null, 2));
            await this.npmCommand(['install'], this.pluginsDir);
        }
    }

    async seedBuiltins(): Promise<PluginPackageMeta[]> {
        const logger = this.mlog(this.seedBuiltins);
        const scopePath = path.join(this.builtinDir, '@holokai');

        let entries;
        try {
            entries = await fs.readdir(scopePath, {withFileTypes: true});
        } catch {
            logger.info('No builtin plugins directory found');
            return [];
        }

        const seeded: PluginPackageMeta[] = [];
        for (const entry of entries) {
            if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;

            const pkgPath = path.join(scopePath, entry.name, 'package.json');
            let pkg;
            try {
                pkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8'));
            } catch {
                continue;
            }

            if (!PROVIDER_PATTERN.test(pkg.name)) continue;

            const hasVersion = await this.pluginPackageDB.hasVersion(pkg.name, pkg.version);
            if (hasVersion) {
                logger.info(`Builtin ${pkg.name}@${pkg.version} already seeded`);
                continue;
            }

            logger.info(`Seeding builtin ${pkg.name}@${pkg.version}`);
            const packageDir = path.join(scopePath, entry.name);
            const tarball = await this.packPlugin(packageDir);
            const sha256 = this.hash(tarball);
            const family = this.inferFamily(pkg.name);

            const meta = await this.pluginPackageDB.store(
                pkg.name, pkg.version, family, tarball, sha256, 'builtin'
            );
            await this.cacheTarball(pkg.name, pkg.version, tarball);
            seeded.push(meta);
        }

        return seeded;
    }

    async installFromRegistry(packageName: string, version?: string, installedBy?: string): Promise<PluginPackageMeta> {
        this.validatePackageName(packageName);

        return this.withLock(async () => {
            const logger = this.mlog(this.installFromRegistry);
            const spec = version ? `${packageName}@${version}` : packageName;
            logger.info(`Installing ${spec} from registry`);

            await this.npmCommand(['install', spec, '--save'], this.pluginsDir);

            const installedPkgPath = path.join(this.pluginsDir, 'node_modules', ...packageName.split('/'), 'package.json');
            const pkg = JSON.parse(await fs.readFile(installedPkgPath, 'utf-8'));
            const packageDir = path.dirname(installedPkgPath);

            const tarball = await this.packPlugin(packageDir);
            const sha256 = this.hash(tarball);
            const family = this.inferFamily(packageName);

            const meta = await this.pluginPackageDB.store(
                packageName, pkg.version, family, tarball, sha256, 'installed', installedBy
            );
            await this.cacheTarball(packageName, pkg.version, tarball);

            logger.info(`Installed ${packageName}@${pkg.version} (${tarball.length} bytes, sha256: ${sha256.slice(0, 12)}...)`);
            return meta;
        });
    }

    async installFromTarball(tarball: Buffer): Promise<string> {
        return this.withLock(async () => {
            const tmpFile = path.join(os.tmpdir(), `holo-plugin-${Date.now()}.tgz`);
            try {
                await fs.writeFile(tmpFile, tarball);
                await this.npmCommand(['install', tmpFile, '--save'], this.pluginsDir);
                return tmpFile;
            } finally {
                await fs.unlink(tmpFile).catch(() => {});
            }
        });
    }

    async uninstall(packageName: string): Promise<void> {
        this.validatePackageName(packageName);

        return this.withLock(async () => {
            const logger = this.mlog(this.uninstall);
            logger.info(`Uninstalling ${packageName}`);

            const pkg = await this.pluginPackageDB.getByName(packageName);
            await this.npmCommand(['uninstall', packageName], this.pluginsDir);
            await this.pluginPackageDB.remove(packageName);

            if (pkg) {
                await this.redis.del(`${REDIS_TARBALL_PREFIX}${packageName}:${pkg.version}`);
            }
        });
    }

    async ensurePlugin(packageName: string, version: string, sha256: string): Promise<string> {
        const logger = this.mlog(this.ensurePlugin);
        const packageDir = path.join(this.pluginsDir, 'node_modules', ...packageName.split('/'));

        try {
            const localPkg = JSON.parse(await fs.readFile(path.join(packageDir, 'package.json'), 'utf-8'));
            if (localPkg.version === version) {
                return packageDir;
            }
        } catch {}

        logger.info(`Plugin ${packageName}@${version} not found locally, fetching...`);

        let tarball = await this.getCachedTarball(packageName, version);
        if (!tarball) {
            logger.info(`Redis miss for ${packageName}@${version}, fetching from Postgres`);
            tarball = await this.pluginPackageDB.getTarball(packageName, version);
        }

        if (!tarball) {
            throw new Error(`Tarball not found for ${packageName}@${version}`);
        }

        const actualHash = this.hash(tarball);
        if (actualHash !== sha256) {
            throw new Error(`Integrity check failed for ${packageName}@${version}: expected ${sha256.slice(0, 12)}, got ${actualHash.slice(0, 12)}`);
        }

        await this.installFromTarball(tarball);
        return packageDir;
    }

    getPluginsDir(): string {
        return this.pluginsDir;
    }

    getPluginsScopePath(): string {
        return path.join(this.pluginsDir, 'node_modules', '@holokai');
    }

    private validatePackageName(name: string): void {
        if (!PROVIDER_PATTERN.test(name)) {
            throw new Error(`Invalid plugin package name: ${name}. Must match @holokai/*provider-*`);
        }
    }

    private inferFamily(packageName: string): string {
        return packageName.replace(/@holokai\/(?:holo-)?provider-/, '');
    }

    private hash(data: Buffer): string {
        return createHash('sha256').update(data).digest('hex');
    }

    private async packPlugin(packageDir: string): Promise<Buffer> {
        const {stdout} = await execFileAsync('npm', ['pack', '--pack-destination', os.tmpdir()], {cwd: packageDir});
        const tarballName = stdout.trim().split('\n').pop()!;
        const tarballPath = path.join(os.tmpdir(), tarballName);
        const tarball = await fs.readFile(tarballPath);
        await fs.unlink(tarballPath).catch(() => {});
        return tarball;
    }

    private async cacheTarball(packageName: string, version: string, tarball: Buffer): Promise<void> {
        const key = `${REDIS_TARBALL_PREFIX}${packageName}:${version}`;
        await this.redis.set(key, tarball.toString('base64'));
    }

    private async getCachedTarball(packageName: string, version: string): Promise<Buffer | null> {
        const key = `${REDIS_TARBALL_PREFIX}${packageName}:${version}`;
        const data = await this.redis.get<string>(key);
        return data ? Buffer.from(data, 'base64') : null;
    }

    private async npmCommand(args: string[], cwd: string): Promise<string> {
        const {stdout, stderr} = await execFileAsync('npm', args, {cwd, timeout: 120000});
        if (stderr && !stderr.includes('npm warn')) {
            this.log.warn(`npm stderr: ${stderr.slice(0, 500)}`);
        }
        return stdout;
    }

    private withLock<T>(fn: () => Promise<T>): Promise<T> {
        const prev = this.installLock;
        let resolve: () => void;
        this.installLock = new Promise<void>(r => resolve = r);
        return prev.then(fn).finally(() => resolve!());
    }
}
