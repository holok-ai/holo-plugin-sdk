// Configure dotenv FIRST, before any other imports that depend on environment variables
// This ensures .env file is loaded before env.ts module executes
import dotenv from 'dotenv';
dotenv.config();

import 'reflect-metadata';
import {BaseServer} from "./base.server";
import {GraderService} from "../services/grader.service";
import {withDB} from "./mixins";
import {container, injectable} from "tsyringe";

@injectable()
export class GraderServer extends withDB(BaseServer) {

    constructor(
        private graderService: GraderService) {
        super('grader.server');
    }

    async onInit(): Promise<void> {
        await super.onInit();
        await this.graderService.runGrader();
        // After the grader has run, we can stop the server.
        process.exit(0);
    }

    async onShutdown(): Promise<void> {
        await super.onShutdown();
    }

    async onError(error: Error): Promise<void> {
        await super.onError(error);
        process.exit(1);
    }
}

const graderServer = container.resolve(GraderServer);
graderServer.start();
