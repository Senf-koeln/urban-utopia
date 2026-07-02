import { startServer } from "./server.js";

startServer().catch((err) => {
  console.error("[server] failed to start", err);
  process.exit(1);
});
