import './container/base.registry';
import './container/api.registry';
import {container} from 'tsyringe';
import {ApiServer} from './servers/api.server';

const server = container.resolve(ApiServer);
await server.start();
