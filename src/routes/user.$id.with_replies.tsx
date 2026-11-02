import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence } from "framer-motion";
import { doc, query, where, orderBy } from "@lib/firebase/db";
import { useCollection } from "@lib/hooks/useCollection";
import { useDocument } from "@lib/hooks/useDocument";
import { tweetsCollection } from "@lib/firebase/collections";
import { useUser } from "@lib/context/user-context";
import { UserHomeLayout } from "@components/layout/user-home-layout";
import { Tweet } from "@components/tweet/tweet";
import { Loading } from "@components/ui/loading";
import { StatsEmpty } from "@components/tweet/stats-empty";
import { TweetWithParent } from "@components/tweet/tweet-with-parent";

export const Route = createFileRoute("/user/$id/with_replies")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "With replies / Chorui" },
      { name: "description", content: "Posts and replies by this profile." },
      { property: "og:title", content: "With replies / Chorui" },
      {
        property: "og:description",
        content: "Posts and replies by this profile."
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UserWithRepliesPage,
});

function UserWithRepliesPage() {
  const { user } = useUser();

  const { id, username, pinnedTweet } = user ?? {};

  const { data: pinnedData } = useDocument(
    doc(tweetsCollection, pinnedTweet ?? "null"),
    {
      disabled: !pinnedTweet,
      allowNull: true,
      includeUser: true
    }
  );

  const { data, loading } = useCollection(
    query(
      tweetsCollection,
      where("createdBy", "==", id),
      orderBy("createdAt", "desc")
    ),
    { includeUser: true, allowNull: true, disabled: !id }
  );

  return (
    <UserHomeLayout>
      <section>
        {loading || !id ? (
          <Loading className="mt-5" />
        ) : !data ? (
          <StatsEmpty
            title={`@${username as string} hasn't posted`}
            description="When they do, their Posts will show up here."
          />
        ) : (
          <AnimatePresence mode="popLayout">
            {pinnedData && (
              <Tweet pinned {...pinnedData} key={`pinned-${pinnedData.id}`} />
            )}
            {data.map((tweet) =>
              tweet.parent ? (
                <TweetWithParent data={[tweet]} key={tweet.id} />
              ) : (
                <Tweet {...tweet} profile={user} key={tweet.id} />
              )
            )}
          </AnimatePresence>
        )}
      </section>
    </UserHomeLayout>
  );
}
