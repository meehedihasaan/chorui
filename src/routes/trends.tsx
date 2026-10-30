import { createFileRoute } from "@tanstack/react-router";
import {
  TrendsLayout,
  ProtectedLayout
} from "@components/layout/common-layout";
import { MainLayout } from "@components/layout/main-layout";
import { MainHeader } from "@components/home/main-header";
import { MainContainer } from "@components/home/main-container";
import { AsideTrends } from "@components/aside/aside-trends";
import { Button } from "@components/ui/button";
import { ToolTip } from "@components/ui/tooltip";
import { HeroIcon } from "@components/ui/hero-icon";
import { useRouter } from "@lib/router";

export const Route = createFileRoute("/trends")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Trends / Chorui" },
      { name: "description", content: "What's trending right now." },
      { property: "og:title", content: "Trends / Chorui" },
      { property: "og:description", content: "What's trending right now." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TrendsPage,
});

function TrendsPage() {
  const { back } = useRouter();

  return (
    <ProtectedLayout>
      <MainLayout>
        <TrendsLayout>
          <MainContainer>
            <MainHeader useActionButton title="Trends" action={back}>
              <Button
                className="dark-bg-tab group relative ml-auto cursor-not-allowed p-2 hover:bg-light-primary/10
                     active:bg-light-primary/20 dark:hover:bg-dark-primary/10 dark:active:bg-dark-primary/20"
              >
                <HeroIcon className="h-5 w-5" iconName="Cog8ToothIcon" />
                <ToolTip tip="Settings" />
              </Button>
            </MainHeader>
            <AsideTrends inTrendsPage />
          </MainContainer>
        </TrendsLayout>
      </MainLayout>
    </ProtectedLayout>
  );
}
