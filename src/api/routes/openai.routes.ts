import 'reflect-metadata';
import express from "express";
import {container} from "tsyringe";
import {OpenAIController} from "../controllers/openai.controller";

const openAIRouter = express.Router();
const openAIController: OpenAIController = container.resolve('OpenAIController');

openAIRouter.post('/chat/completions', openAIController.chatCompletions);
openAIRouter.post('/models', openAIController.models);

export {openAIRouter};
