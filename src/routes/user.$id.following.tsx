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

export const Route = createFileRoute("/user/$id/following")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Following / Chorui" },
      { name: "description", content: "People this profile follows." },
      { property: "og:title", content: "Following / Chorui" },
      { property: "og:description", content: "People this profile follows." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: followRoute("following")
});
