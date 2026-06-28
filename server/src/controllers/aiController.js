import { asyncHandler } from '../middlewares/asyncHandler.js';
import { runGrokTask, generateGrokImage } from '../services/grok.js';

/**
 * POST /api/ai/grok  (staff)
 * Runs a Grok AI text task (translate, writing, content).
 */
export const grokText = asyncHandler(async (req, res) => {
  const result = await runGrokTask(req.body);
  res.json(result);
});

/**
 * POST /api/ai/grok/image  (staff)
 * Generates an image via Grok's image model.
 */
export const grokImage = asyncHandler(async (req, res) => {
  const result = await generateGrokImage(req.body);
  res.json(result);
});
