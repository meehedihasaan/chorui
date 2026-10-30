import { createFileRoute } from "@tanstack/react-router";
import { Toaster } from "react-hot-toast";
import { AuthLayout } from "@components/layout/auth-layout";
import { LoginMain } from "@components/login/login-main";
import { LoginFooter } from "@components/login/login-footer";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Twitter — It's what's happening" },
      {
        name: "description",
        content:
          "From breaking news and entertainment to sports and politics, get the full story with all the live commentary.",
      },
      { property: "og:title", content: "Twitter — It's what's happening" },
      {
        property: "og:description",
        content: "Join the conversation. Sign up or sign in to continue.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <AuthLayout>
      <div className="grid min-h-screen grid-rows-[1fr,auto] bg-main-background text-light-primary dark:text-dark-primary">
      <LoginMain />
      <LoginFooter />
      <Toaster
        position="bottom-center"
        containerClassName="mb-12 xs:mb-0"
        toastOptions={{
          style: {
            color: "white",
            borderRadius: "4px",
            backgroundColor: "rgb(var(--main-accent))",
          },
          success: { duration: 4000 },
        }}
      />
    </div>
  );
}
