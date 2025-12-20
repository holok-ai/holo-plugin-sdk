import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {ClassLogger} from "@holokai/sdk";
import {ResponseService} from "./response.service";

@injectable()
export class WorkerService extends ClassLogger {

    constructor(
        protected responseService: ResponseService,
    ) {
        super();
    }


}