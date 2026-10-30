import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence } from "framer-motion";
import { query, where } from "@lib/firebase/db";
import { useCollection } from "@lib/hooks/useCollection";
import { tweetsCollection } from "@lib/firebase/collections";
import { useUser } from "@lib/context/user-context";
import { mergeData } from "@lib/merge";
import { UserHomeLayout } from "@components/layout/user-home-layout";
import { Tweet } from "@components/tweet/tweet";
import { Loading } from "@components/ui/loading";
import { StatsEmpty } from "@components/tweet/stats-empty";

export const Route = createFileRoute("/user/$id/media")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Media / Chorui" },
      { name: "description", content: "Media posts by this profile." },
      { property: "og:title", content: "Media / Chorui" },
      { property: "og:description", content: "Media posts by this profile." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UserMediaPage,
});

function UserMediaPage() {
  const { user } = useUser();

  const { id, username } = user ?? {};

  const { data, loading } = useCollection(
    query(
      tweetsCollection,
      where("createdBy", "==", id),
      where("images", "!=", null)
    ),
    { includeUser: true, allowNull: true }
  );

  const sortedTweets = mergeData(true, data);

  return (
    <UserHomeLayout>
      <section>
        {loading ? (
          <Loading className="mt-5" />
        ) : !sortedTweets ? (
          <StatsEmpty
            title={`@${username as string} hasn't posted media`}
            description="Once they do, those Posts will show up here."
            imageData={{ src: "/assets/no-media.png", alt: "No media" }}
          />
        ) : (
          <AnimatePresence mode="popLayout">
            {sortedTweets.map((tweet) => (
              <Tweet {...tweet} key={tweet.id} />
            ))}
          </AnimatePresence>
        )}
      </section>
    </UserHomeLayout>
  );
}
