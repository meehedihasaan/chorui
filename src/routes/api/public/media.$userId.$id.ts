import { createFileRoute } from "@tanstack/react-router";

/**
 * Serves user-uploaded tweet images from the private `images` storage
 * bucket. The bucket itself stays private: only this server route reads
 * objects, using the service-role client loaded inside the handler.
 */
export const Route = createFileRoute("/api/public/media/$userId/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { userId, id } = params;
        const valid =
          /^[0-9a-f-]{8,36}$/i.test(userId) && /^[0-9a-f-]{8,36}$/i.test(id);
        if (!valid) return new Response("Not found", { status: 404 });

        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );

        const { data, error } = await supabaseAdmin.storage
          .from("images")
          .download(`${userId}/${id}`);

        if (error || !data) return new Response("Not found", { status: 404 });

        return new Response(data, {
          headers: {
            "Content-Type": data.type || "application/octet-stream",
            "Cache-Control": "public, max-age=31536000, immutable"
          }
        });
      }
    }
  }
});
