import {container} from 'tsyringe';
import {ResponseService} from '../services';

container
    .registerSingleton(ResponseService);
