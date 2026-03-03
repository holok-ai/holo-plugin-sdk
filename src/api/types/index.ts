import {Request} from 'express';
import type {Auth} from "@holokai/types/api";

export type HoloApiRequest = Request & {
    auth?: Auth,
    appSlug?: string
}
