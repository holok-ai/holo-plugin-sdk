import {Request} from 'express';
import {Auth} from "@holokai/sdk";

export type HoloApiRequest = Request & {
    auth?: Auth,
    appSlug?: string
}
