import {NextFunction, Request, Response} from "express";

export const nocorsMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction): Promise<void> => {

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    next();
}
