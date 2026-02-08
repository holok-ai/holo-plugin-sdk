import {Request} from 'express';
import {Auth} from "../../admin/types";

export type HoloApiRequest = Request & {
    auth: Auth,
    appSlug?: string
}
