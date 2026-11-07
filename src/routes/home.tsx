import { MobileSidebar } from "@components/sidebar/mobile-sidebar";
import { ChoruiLogo } from "@components/ui/chorui-logo";
import cn from "clsx";
import { Fragment, useEffect, useState } from "react";
import { FeedWhoToFollow } from "@components/home/feed-who-to-follow";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence } from "framer-motion";
import { useWindow } from "@lib/context/window-context";
import { useAuth } from "@lib/context/auth-context";
import { useInfiniteScroll } from "@lib/hooks/useInfiniteScroll";
import { tweetsCollection } from "@lib/firebase/collections";
import { orderBy, where } from "@lib/firebase/db";
import { HomeLayout, ProtectedLayout } from "@components/layout/common-layout";
import { MainLayout } from "@components/layout/main-layout";
import { MainContainer } from "@components/home/main-container";
import { UpdateUsername } from "@components/home/update-username";
import { HeaderSearch } from "@components/home/header-search";
import { FeedTabs } from "@components/home/feed-tabs";
import { ComposeEntry } from '@components/home/compose-entry';
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
// Height of the top header row (logo / search); the tab bar stays pinned
// while this row slides away on scroll down.
const HEADER_ROW_HEIGHT = 52;

function HomeFeed() {
  const { user } = useAuth();
  const { tab } = Route.useSearch() as { tab?: string };

  const [headerHidden, setHeaderHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = (): void => {
      const y = window.scrollY;
      if (y > 80 && y > lastY + 4) setHeaderHidden(true);
      else if (y < lastY - 4 || y <= 80) setHeaderHidden(false);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const followingTab = tab === "following";

  const { data, loading, LoadMore } = useInfiniteScroll(
    tweetsCollection,
    [
      { type: "where", field: "parent_id", op: "==", value: null },
      orderBy("createdAt", "desc"),
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
      <header
        className={cn(
          "hover-animation sticky top-0 z-10 border-b border-light-border bg-main-background/60 backdrop-blur-md transition-transform duration-300 dark:border-dark-border"
        )}
        style={headerHidden ? { transform: `translateY(-${HEADER_ROW_HEIGHT}px)` } : undefined}
      >
        <div
          className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 xs:flex xs:justify-between"
          style={{ height: HEADER_ROW_HEIGHT }}
        >
          <div className="xs:hidden"><MobileSidebar /></div>
          <h2 className="hidden text-xl font-bold xs:block">Home</h2>
          <ChoruiLogo className="h-7 w-7 xs:hidden" />
          <div className="flex justify-end">
            <HeaderSearch />
            <UpdateUsername hideTrigger />
          </div>
        </div>
        <div className="px-4">
          <FeedTabs />
        </div>
      </header>
      <ComposeEntry />
      <section className="mt-0.5 xs:mt-0">
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
              {data.map((tweet, index) => (
                <Fragment key={tweet.id}>
                  <Tweet {...tweet} showFollow={!followingTab} />
                  {!followingTab && index === Math.min(2, data.length - 1) && (
                    <FeedWhoToFollow />
                  )}
                </Fragment>
              ))}
            </AnimatePresence>
            <LoadMore />
          </>
        )}
      </section>
    </MainContainer>
  );
}
