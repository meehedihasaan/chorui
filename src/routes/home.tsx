import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence } from "framer-motion";
import { useWindow } from "@lib/context/window-context";
import { useInfiniteScroll } from "@lib/hooks/useInfiniteScroll";
import { tweetsCollection } from "@lib/firebase/collections";
import { HomeLayout, ProtectedLayout } from "@components/layout/common-layout";
import { MainLayout } from "@components/layout/main-layout";
import { MainContainer } from "@components/home/main-container";
import { Input } from "@components/input/input";
import { UpdateUsername } from "@components/home/update-username";
import { MainHeader } from "@components/home/main-header";
import { Tweet } from "@components/tweet/tweet";
import { Loading } from "@components/ui/loading";
import { Error } from "@components/ui/error";

export const Route = createFileRoute("/home")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Home / Twitter" },
      { name: "description", content: "Your home timeline." },
      { property: "og:title", content: "Home / Twitter" },
      { property: "og:description", content: "Your home timeline." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { isMobile } = useWindow();

  const { data, loading, LoadMore } = useInfiniteScroll(
    tweetsCollection,
    [{ type: "where", field: "parent_id", op: "==", value: null }],
    { includeUser: true, allowNull: true, preserve: true }
  );

  return (
    <ProtectedLayout>
      <MainLayout>
        <HomeLayout>
          <MainContainer>
            <MainHeader
              useMobileSidebar
              title="Home"
              className="flex items-center justify-between"
            >
              <UpdateUsername />
            </MainHeader>
            {!isMobile && <Input />}
            <section className="mt-0.5 xs:mt-0">
              {loading ? (
                <Loading className="mt-5" />
              ) : !data ? (
                <Error message="Something went wrong" />
              ) : (
                <>
                  <AnimatePresence mode="popLayout">
                    {data.map((tweet) => (
                      <Tweet {...tweet} key={tweet.id} />
                    ))}
                  </AnimatePresence>
                  <LoadMore />
                </>
              )}
            </section>
          </MainContainer>
        </HomeLayout>
      </MainLayout>
    </ProtectedLayout>
  );
}
