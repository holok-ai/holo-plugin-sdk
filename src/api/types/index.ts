import {Request} from 'express';
import {Auth} from "../../admin/types";

export interface HttpApiRequest extends Request {
    auth?: Auth,
    appSlug?: string
}
