import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence } from "framer-motion";
import { query, where, orderBy } from "@lib/firebase/db";
import { useCollection } from "@lib/hooks/useCollection";
import { tweetsCollection } from "@lib/firebase/collections";
import { useUser } from "@lib/context/user-context";
import { UserHomeLayout } from "@components/layout/user-home-layout";
import { Tweet } from "@components/tweet/tweet";
import { Loading } from "@components/ui/loading";
import { StatsEmpty } from "@components/tweet/stats-empty";

export const Route = createFileRoute("/user/$id/likes")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Likes / Twitter" },
      { name: "description", content: "Tweets liked by this profile." },
      { property: "og:title", content: "Likes / Twitter" },
      { property: "og:description", content: "Tweets liked by this profile." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UserLikesPage,
});

function UserLikesPage() {
  const { user } = useUser();

  const { id, username } = user ?? {};

  const { data, loading } = useCollection(
    query(
      tweetsCollection,
      where("userLikes", "array-contains", id),
      orderBy("createdAt", "desc")
    ),
    { includeUser: true, allowNull: true }
  );

  return (
    <UserHomeLayout>
      <section>
        {loading ? (
          <Loading className="mt-5" />
        ) : !data ? (
          <StatsEmpty
            title={`@${username as string} hasn't liked any Tweets`}
            description="When they do, those Tweets will show up here."
          />
        ) : (
          <AnimatePresence mode="popLayout">
            {data.map((tweet) => (
              <Tweet {...tweet} key={tweet.id} />
            ))}
          </AnimatePresence>
        )}
      </section>
    </UserHomeLayout>
  );
}
