import { createFileRoute } from "@tanstack/react-router";
import { UserFollowLayout } from "@components/layout/user-follow-layout";
import { UserFollow } from "@components/user/user-follow";

function followRoute(type: "followers" | "following") {
  return function UserFollowPage(): JSX.Element {
    return (
      <UserFollowLayout>
        <UserFollow type={type} />
      </UserFollowLayout>
    );
  };
}

export const Route = createFileRoute("/user/$id/followers")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Followers / Twitter" },
      { name: "description", content: "People following this profile." },
      { property: "og:title", content: "Followers / Twitter" },
      { property: "og:description", content: "People following this profile." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: followRoute("followers")
});
