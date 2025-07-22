import {openAIRouter} from "./openai.routes";
import express from "express";
import {apiRouter} from "./llm.routes";

const router = express.Router();
router.use('/api', apiRouter);
router.use('/api/openai/v1', openAIRouter);
export default router;
