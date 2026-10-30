import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useRequireAuth } from "@lib/hooks/useRequireAuth";
import { UserLayout } from "@components/layout/common-layout";
import { MainLayout } from "@components/layout/main-layout";
import { UserDataLayout } from "@components/layout/user-data-layout";
import { Placeholder } from "@components/common/placeholder";

export const Route = createFileRoute("/user/$id")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Profile / Twitter" },
      { name: "description", content: "A user profile on Twitter." },
      { property: "og:title", content: "Profile / Twitter" },
      { property: "og:description", content: "A user profile on Twitter." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UserLayoutRoute,
});

function UserLayoutRoute() {
  const user = useRequireAuth();

  if (!user) return <Placeholder />;

  return (
    <MainLayout>
      <UserLayout>
        <UserDataLayout>
          <Outlet />
        </UserDataLayout>
      </UserLayout>
    </MainLayout>
  );
}
