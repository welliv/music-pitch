import * as React from "react";
/**
 * Relume Layout 506 (slug: section_layout506) — dark Apple-token adaptation.
 * Vertical tabs + feature panel. Buttons optional (omitted for pitch steps).
 */
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type Feature = {
  heading: string;
  description: string;
  icon?: LucideIcon;
  meta?: string;
};

type Tab = {
  value: string;
  trigger: string;
  content: Feature;
};

type Props = {
  tagline: string;
  heading: string;
  description?: string;
  tabs: Tab[];
  defaultTabValue: string;
  className?: string;
};

export type Layout506Props = React.ComponentPropsWithoutRef<"section"> & Partial<Props>;

export function Layout506(props: Layout506Props) {
  const { tagline, heading, description, tabs, defaultTabValue, className, id, ...rest } = {
    ...Layout506Defaults,
    ...props,
  };

  return (
    <section
      id={id}
      className={cn(
        "section-pad scroll-mt-20 border-t border-white/[0.06]",
        className,
      )}
      {...rest}
    >
      <div className="mx-auto max-w-content">
        <div className="mb-12 max-w-2xl md:mb-16 lg:mb-18">
          <p className="section-label">{tagline}</p>
          <h2 className="display-title text-[2rem] md:text-h2 lg:text-[3rem]">
            {heading}
          </h2>
          {description ? (
            <p className="body-lg mt-6 max-w-prose">{description}</p>
          ) : null}
        </div>

        <Card className="overflow-hidden">
          <Tabs
            defaultValue={defaultTabValue}
            orientation="vertical"
            className="relative grid auto-cols-fr grid-cols-1 md:grid-cols-[1.55fr_1fr]"
          >
            {tabs.map((tab) => (
              <TabsContent
                key={tab.value}
                value={tab.value}
                className="data-[state=active]:animate-tabs"
              >
                <FeatureCard tab={tab} />
              </TabsContent>
            ))}
            <TabsList className="relative grid h-full auto-cols-fr grid-cols-1 border-t border-scheme-border md:border-l md:border-t-0">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="items-start justify-start rounded-none border-0 border-b border-scheme-border p-5 text-left text-h6 font-medium last-of-type:border-0 data-[state=active]:bg-ink-raised data-[state=active]:text-mist data-[state=inactive]:bg-transparent data-[state=inactive]:text-mist-dim md:px-7 md:py-6"
                >
                  {tab.trigger}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </Card>
      </div>
    </section>
  );
}

function FeatureCard({ tab }: { tab: Tab }) {
  const Icon = tab.content.icon;
  return (
    <div className="flex h-full min-h-[16rem] flex-col justify-center p-6 md:p-10 lg:p-14">
      {tab.content.meta ? (
        <span className="mb-4 font-mono text-micro font-medium text-accent">
          {tab.content.meta}
        </span>
      ) : null}
      {Icon ? (
        <div className="mb-5 flex size-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-ink shadow-soft md:mb-6">
          <Icon className="size-5 text-mist" strokeWidth={1.4} />
        </div>
      ) : null}
      <h3 className="display-title mb-4 text-h4 text-mist md:mb-5 md:text-h3">
        {tab.content.heading}
      </h3>
      <p className="body-md max-w-prose text-[1.0625rem] leading-relaxed">
        {tab.content.description}
      </p>
    </div>
  );
}

export const Layout506Defaults: Props = {
  tagline: "Tagline",
  heading: "Short heading goes here",
  defaultTabValue: "tab-1",
  tabs: [],
};
