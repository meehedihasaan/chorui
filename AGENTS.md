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
