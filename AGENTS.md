<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Migration architecture decisions
- The app is a TanStack Start port of the Firebase/Next.js Twitter clone; the source's `Link`/`useRouter` APIs are shimmed in `src/lib/router.tsx` on top of TanStack Router — keep ported components importing from `@lib/router`, not from framework packages.
- Firebase collections map to Lovable Cloud tables (`profiles`, `tweets`, `user_stats`, `bookmarks`, `follows`) with RLS; tweet-deletion cleanup runs as a Postgres trigger (replaces the normalize-stats cloud function), so don't double-decrement parent reply counts in client code.
- User-uploaded images live in the private `images` bucket and are served through the `/api/public/media/$userId/$id` server route (service-role read inside the handler); the bucket must stay private — the workspace rejects public buckets.
- Twitter trends API was not migrated; trends are served by app server routes from curated data in `src/lib/trends-data.ts`.
- Source Gmail notify-email cloud function was not migrated; if the user wants tweet notifications, use Lovable transactional email after a verified sender domain.
- Post analytics are owner-only through authenticated RPC; unique signed-in non-author views are deduplicated per post/user and start when tracking is deployed.
- Account switching keeps provider-issued sessions in tab-scoped sessionStorage only, validates through auth.setSession, and never treats saved identity metadata as authorization.
- Shared optimistic follow/reaction controls roll back failed writes; Home timelines retain deterministic createdAt ordering.
- Post link previews use shared supplemental Query metadata from a fixed external metadata provider and isolated image proxy; never fetch arbitrary post URLs directly from the app server. Transient failures must remain retryable rather than cached as successful empty metadata; keep plain-link fallbacks while unavailable.
- Post controls persist in RLS-protected tables; database triggers enforce reply/block rules on direct writes and RPCs, while muted authors are filtered from collection views. Public activity exposes aggregate reactions only; reports are private pending submissions, not automated moderation decisions.
- Profile addresses are built from the handle, so a handle change must redirect the open profile to its new URL and re-read cached data that embeds author profiles; handles stay unique without regard to case and replies keep naming their author through a database trigger.
