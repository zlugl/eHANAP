import express from 'express';
import { handleHealthCheck, handleResumeParsing } from './controllers/resumeController';

export interface AppOptions {
  jsonLimit?: string;
}

/**
 * Creates and configures the Express application with API routes and middleware.
 * Decoupled from HTTP listener to enable isolated unit and integration testing.
 */
export function createApp(options?: AppOptions): express.Express {
  const app = express();
  const limit = options?.jsonLimit || '15mb';

  app.use(express.json({ limit }));

  // API Routes
  app.get('/api/health', handleHealthCheck);
  app.post('/api/parse-resume', handleResumeParsing);
  app.post('/api/extract-resume', handleResumeParsing);

  return app;
}
