import { resolve } from 'node:path';

// Keep reusable validation commands independent of dated investigation notes.
// A review can direct all artifacts into its own evidence folder through this env.
export const validationDirectory = resolve(process.env.FEEDGARDEN_VALIDATION_DIR ?? '.local/validation');
