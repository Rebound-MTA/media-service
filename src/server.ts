// File: src/server.ts
import { initializeApp } from "./app";

async function startServer() {
  try {
    const { app, container } = await initializeApp();

    // Start the server
    app.listen(container.config.port, () => {
      console.log(`Media service running on port ${container.config.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Start the server
startServer();
