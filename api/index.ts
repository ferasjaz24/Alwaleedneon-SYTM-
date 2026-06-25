import { app, startServer } from '../server.js';

let initialized = false;

export default async function handler(req, res) {
  if (!initialized) {
    await startServer();
    initialized = true;
  }
  return app(req, res);
}
