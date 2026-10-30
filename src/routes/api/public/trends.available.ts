import { createFileRoute } from "@tanstack/react-router";
import { AVAILABLE_PLACES } from "@lib/trends-data";

export const Route = createFileRoute("/api/public/trends/available")({
  server: {
    handlers: {
      GET: () => Response.json(AVAILABLE_PLACES)
    }
  }
});
