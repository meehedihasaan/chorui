import { MobileSidebar } from "@components/sidebar/mobile-sidebar";
import { ChoruiLogo } from "@components/ui/chorui-logo";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence } from "framer-motion";
import { useWindow } from "@lib/context/window-context";
import { useAuth } from "@lib/context/auth-context";
import { useInfiniteScroll } from "@lib/hooks/useInfiniteScroll";
import { tweetsCollection } from "@lib/firebase/collections";
import { where } from "@lib/firebase/db";
import { HomeLayout, ProtectedLayout } from "@components/layout/common-layout";
import { MainLayout } from "@components/layout/main-layout";
import { MainContainer } from "@components/home/main-container";
import { Input } from "@components/input/input";
import { UpdateUsername } from "@components/home/update-username";
import { HeaderSearch } from "@components/home/header-search";
import { MainHeader } from "@components/home/main-header";
import { FeedTabs } from "@components/home/feed-tabs";
import { Tweet } from "@components/tweet/tweet";
import { Loading } from "@components/ui/loading";
import { Error } from "@components/ui/error";

export const Route = createFileRoute("/home")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { tab?: string } => ({
    tab: typeof search.tab === "string" ? search.tab : undefined
  }),
  head: () => ({
    meta: [
      { title: "Home / Chorui" },
      { name: "description", content: "Your home timeline." },
      { property: "og:title", content: "Home / Chorui" },
      { property: "og:description", content: "Your home timeline." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <ProtectedLayout>
      <MainLayout>
        <HomeLayout>
          <HomeFeed />
        </HomeLayout>
      </MainLayout>
    </ProtectedLayout>
  );
}

// The window provider mounts inside MainLayout, so window-aware UI must be a
// child of it rather than read the context in the route component itself.
function HomeFeed() {
  const { isMobile } = useWindow();
  const { user } = useAuth();
  const { tab } = Route.useSearch() as { tab?: string };

  const followingTab = tab === "following";

  const { data, loading, LoadMore } = useInfiniteScroll(
    tweetsCollection,
    [
      { type: "where", field: "parent_id", op: "==", value: null },
      ...(followingTab && user
        ? [
            {
              type: "where" as const,
              field: "createdBy",
              op: "in" as const,
              value: [...(user.following ?? []), user.id]
            }
          ]
        : [])
    ],
    { includeUser: true, allowNull: true, preserve: true }
  );

  return (
    <MainContainer>
      <MainHeader useMobileSidebar className="flex flex-col border-b border-light-border pb-0 dark:border-dark-border">
        <div className="flex w-full items-center justify-between gap-3">
          <div className="flex items-center gap-2 xs:hidden">
            <ChoruiLogo className="h-8 w-8" />
            <span className="text-2xl font-extrabold tracking-tight">Chorui</span>
          </div>
          <h2 className="hidden text-xl font-bold xs:block">Home</h2>
          <div className="flex items-center justify-end gap-1">
            <HeaderSearch />
            <UpdateUsername hideTrigger />
            <div className="xs:hidden"><MobileSidebar /></div>
          </div>
        </div>
        <FeedTabs />
      </MainHeader>
      {!isMobile && <Input />}
      <section className="flex flex-col gap-2 bg-main-sidebar-background px-2 py-2">
        {loading ? (
          <Loading className="mt-5" />
        ) : !data ? (
          <Error message="Something went wrong" />
        ) : data.length === 0 && followingTab ? (
          <p className="mt-10 px-4 text-center text-lg text-light-secondary dark:text-dark-secondary">
            Nothing to see here — yet
          </p>
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
  );
}
