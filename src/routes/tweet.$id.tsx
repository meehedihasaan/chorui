import { createFileRoute } from "@tanstack/react-router";
import { useParams } from "@tanstack/react-router";
import { useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { tweetsCollection } from "@lib/firebase/collections";
import { useCollection } from "@lib/hooks/useCollection";
import { useDocument } from "@lib/hooks/useDocument";
import { isPlural } from "@lib/utils";
import { HomeLayout, ProtectedLayout } from "@components/layout/common-layout";
import { MainLayout } from "@components/layout/main-layout";
import { MainContainer } from "@components/home/main-container";
import { MainHeader } from "@components/home/main-header";
import { Tweet } from "@components/tweet/tweet";
import { ViewTweet } from "@components/view/view-tweet";
import { Loading } from "@components/ui/loading";
import { Error } from "@components/ui/error";
import { ViewParentTweet } from "@components/view/view-parent-tweet";

export const Route = createFileRoute("/tweet/$id")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Tweet / Twitter" },
      { name: "description", content: "A tweet thread." },
      { property: "og:title", content: "Tweet / Twitter" },
      { property: "og:description", content: "A tweet thread." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TweetIdPage,
});

function TweetIdPage() {
  const { id } = useParams({ strict: false }) as { id?: string };
  const { back } = useRouterBack();

  const { data: tweetData, loading: tweetLoading } = useDocument(
    { __ref: "document", table: "tweets", id: id as string },
    { includeUser: true, allowNull: true }
  );

  const viewTweetRef = useRef<HTMLElement>(null);

  const { data: repliesData, loading: repliesLoading } = useCollection(
    tweetsCollection.withReplies?.(id) ?? tweetsCollection,
    { includeUser: true, allowNull: true }
  );

  const { text, images } = tweetData ?? {};

  const imagesLength = images?.length ?? 0;
  const parentId = tweetData?.parent?.id;

  return (
    <ProtectedLayout>
      <MainLayout>
        <HomeLayout>
          <MainContainer className="!pb-[1280px]">
            <MainHeader
              useActionButton
              title={parentId ? "Thread" : "Tweet"}
              action={back}
            />
            <section>
              {tweetLoading ? (
                <Loading className="mt-5" />
              ) : !tweetData ? (
                <>
                  <Error message="Tweet not found" />
                </>
              ) : (
                <>
                  {parentId && (
                    <ViewParentTweet
                      parentId={parentId}
                      viewTweetRef={viewTweetRef}
                    />
                  )}
                  <ViewTweet viewTweetRef={viewTweetRef} {...tweetData} />
                  {tweetData &&
                    (repliesLoading ? (
                      <Loading className="mt-5" />
                    ) : !repliesData ? (
                      <p className='mt-4 mb-10 px-4 text-xl font-bold'>No replies yet</p>
                    ) : (
                      <AnimatePresence mode="popLayout">
                        {repliesData.map((replyData) => (
                          <Tweet {...replyData} key={replyData.id} />
                        ))}
                      </AnimatePresence>
                    ))}
                </>
              )}
            </section>
          </MainContainer>
        </HomeLayout>
      </MainLayout>
    </ProtectedLayout>
  );
}

import { query, where, orderBy } from "@lib/firebase/db";
import { useRouter } from "@lib/router";

declare module "@lib/firebase/db" {
  interface CollectionRefAugmentation {}
}

function useRouterBack(): { back: () => void } {
  const { back } = useRouter();
  return { back };
}
