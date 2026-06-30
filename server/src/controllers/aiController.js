import { asyncHandler } from '../middlewares/asyncHandler.js';
import { runGroqTask, generateGroqImage } from '../services/groq.js';

/**
 * POST /api/ai/groq  (staff)
 * Runs a Groq AI text task (translate, writing, content).
 */
export const groqText = asyncHandler(async (req, res) => {
  const result = await runGroqTask(req.body);
  res.json(result);
});

/**
 * POST /api/ai/groq/image  (staff)
 * Generates an image via Groq's image model.
 */
export const groqImage = asyncHandler(async (req, res) => {
  const result = await generateGroqImage(req.body);
  res.json(result);
});
