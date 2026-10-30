import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useAuth } from "@lib/context/auth-context";
import { usersCollection } from "@lib/firebase/collections";
import { useInfiniteScroll } from "@lib/hooks/useInfiniteScroll";
import {
  PeopleLayout,
  ProtectedLayout
} from "@components/layout/common-layout";
import { MainLayout } from "@components/layout/main-layout";
import { MainHeader } from "@components/home/main-header";
import { MainContainer } from "@components/home/main-container";
import { UserCard } from "@components/user/user-card";
import { Loading } from "@components/ui/loading";
import { Error } from "@components/ui/error";
import { variants } from "@components/aside/aside-trends";

export const Route = createFileRoute("/people")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "People / Twitter" },
      { name: "description", content: "Discover people to follow." },
      { property: "og:title", content: "People / Twitter" },
      { property: "og:description", content: "Discover people to follow." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PeoplePage,
});

function PeoplePage() {
  const { user } = useAuth();

  const { data, loading, LoadMore } = useInfiniteScroll(
    usersCollection,
    [{ type: "where", field: "id", op: "!=", value: user?.id }],
    { allowNull: true, preserve: true },
    { marginBottom: 500 }
  );

  const { back } = useBack();

  return (
    <ProtectedLayout>
      <MainLayout>
        <PeopleLayout>
          <MainContainer>
            <MainHeader useActionButton title="People" action={back} />
            <section>
              {loading ? (
                <Loading className="mt-5" />
              ) : !data ? (
                <Error message="Something went wrong" />
              ) : (
                <>
                  <motion.div className="mt-0.5" {...variants}>
                    {data?.map((userData) => (
                      <UserCard {...userData} key={userData.id} />
                    ))}
                  </motion.div>
                  <LoadMore />
                </>
              )}
            </section>
          </MainContainer>
        </PeopleLayout>
      </MainLayout>
    </ProtectedLayout>
  );
}

import { useRouter } from "@lib/router";

function useBack(): { back: () => void } {
  const { back } = useRouter();
  return { back };
}
