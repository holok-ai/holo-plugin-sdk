import express from "express";
import {container} from "tsyringe";
import {NotificationController} from "../controllers/notification.controller";

export function createNotificationRoutes(): express.Router {
    const apiRouter = express.Router();
    const notificationController = container.resolve(NotificationController);
    apiRouter.get('/stream', notificationController.stream);
    return apiRouter;
}
