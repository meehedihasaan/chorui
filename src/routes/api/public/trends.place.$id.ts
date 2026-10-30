import { createFileRoute } from "@tanstack/react-router";
import { AVAILABLE_PLACES, PLACE_TRENDS, WORLDWIDE_TRENDS } from "@lib/trends-data";
import type { Trend } from "@lib/types/place";

export const Route = createFileRoute("/api/public/trends/place/$id")({
  server: {
    handlers: {
      GET: ({ request, params }) => {
        const limitParam = new URL(request.url).searchParams.get("limit");

        const place = AVAILABLE_PLACES.find(
          (candidate) => String(candidate.woeid) === params.id
        );

        if (!place)
          return Response.json(
            {
              errors: [
                { code: 34, message: "Sorry, that page does not exist" }
              ]
            },
            { status: 404 }
          );

        const source: Trend[] =
          params.id === "1"
            ? WORLDWIDE_TRENDS
            : PLACE_TRENDS[params.id] ?? WORLDWIDE_TRENDS;

        const sorted = [...source].sort(
          (a, b) => (b.tweet_volume ?? 0) - (a.tweet_volume ?? 0)
        );

        const trends =
          limitParam && Number.isFinite(parseInt(limitParam, 10))
            ? sorted.slice(0, parseInt(limitParam, 10))
            : sorted;

        return Response.json({ trends, location: place.name });
      }
    }
  }
});
