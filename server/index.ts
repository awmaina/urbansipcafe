import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

async function startServer() {
  // Bulletproof static path resolution for both local development and Vercel production
  const staticPath = process.env.NODE_ENV === "production"
    ? path.resolve(__dirname, "public")
    : path.resolve(__dirname, "..", "dist", "public");

  // Serve static assets from the frontend build
  app.use(express.static(staticPath));

  // Single Page Application (SPA) routing fallback
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  // Dynamic port assignment for Vercel environment
  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

// Only run the standalone server listener if this file is executed directly
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  startServer().catch(console.error);
}

// Export the Express application instance for Vercel's serverless pipeline
export default app;