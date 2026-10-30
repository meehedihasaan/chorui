import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence } from "framer-motion";
import { doc, query, where } from "@lib/firebase/db";
import { useUser } from "@lib/context/user-context";
import { useCollection } from "@lib/hooks/useCollection";
import { useDocument } from "@lib/hooks/useDocument";
import { tweetsCollection } from "@lib/firebase/collections";
import { mergeData } from "@lib/merge";
import { UserHomeLayout } from "@components/layout/user-home-layout";
import { StatsEmpty } from "@components/tweet/stats-empty";
import { Loading } from "@components/ui/loading";
import { Tweet } from "@components/tweet/tweet";

export const Route = createFileRoute("/user/$id/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Profile / Chorui" },
      { name: "description", content: "A user profile on Chorui." },
      { property: "og:title", content: "Profile / Chorui" },
      { property: "og:description", content: "A user profile on Chorui." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UserTweetsPage,
});

function UserTweetsPage() {
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

  const { data: ownerTweets, loading: ownerLoading } = useCollection(
    query(
      tweetsCollection,
      where("createdBy", "==", id),
      where("parent_id", "==", null)
    ),
    { includeUser: true, allowNull: true }
  );

  const { data: peopleTweets, loading: peopleLoading } = useCollection(
    query(
      tweetsCollection,
      where("createdBy", "!=", id),
      where("userRetweets", "array-contains", id)
    ),
    { includeUser: true, allowNull: true }
  );

  const mergedTweets = mergeData(true, ownerTweets, peopleTweets);

  return (
    <UserHomeLayout>
      <section>
        {ownerLoading || peopleLoading ? (
          <Loading className="mt-5" />
        ) : !mergedTweets ? (
          <StatsEmpty
            title={`@${username as string} hasn't posted`}
            description="When they do, their Posts will show up here."
          />
        ) : (
          <AnimatePresence mode="popLayout">
            {pinnedData && (
              <Tweet pinned {...pinnedData} key={`pinned-${pinnedData.id}`} />
            )}
            {mergedTweets.map((tweet) => (
              <Tweet {...tweet} profile={user} key={tweet.id} />
            ))}
          </AnimatePresence>
        )}
      </section>
    </UserHomeLayout>
  );
}
