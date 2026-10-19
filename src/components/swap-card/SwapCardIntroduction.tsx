import { Button, Card, CardContent, CardTitle } from "@bleu/ui";

import { PixelIcon } from "#/components/ui/pixel-icon";
import { useUIStore } from "#/hooks/useUIState";

const INTRODUCTION_STEPS = [
  "Choose a supported token and enter the amount to sell",
  "Set the trigger price and order expiry",
  "Review the order details and required approvals",
  "Confirm placement in your wallet",
];

const ADVANCED_OPTIONS = [
  "Allow partial fills",
  "Set a different receiver",
  "Change the maximum oracle data age",
];

const StepBulletPoint = ({
  icon,
  description,
}: {
  icon: React.ReactNode;
  description: string;
}) => (
  <div className="pixel-inset flex min-h-14 items-center gap-3 rounded-none border border-border/60 bg-background/40 p-3">
    <div className="pixel-inset flex size-8 shrink-0 items-center justify-center rounded-none bg-primary/10 text-sm font-semibold text-primary">
      {icon}
    </div>
    <span className="w-full text-pretty text-sm leading-snug text-foreground/90">
      {description}
    </span>
  </div>
);

const BulletPointList = ({
  items,
  iconGenerator,
}: {
  items: string[];
  iconGenerator: (index: number) => React.ReactNode;
}) => (
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
    {items.map((item, index) => (
      <StepBulletPoint
        key={index}
        icon={iconGenerator(index)}
        description={item}
      />
    ))}
  </div>
);

export function SwapCardIntroduction() {
  const setFirstAccess = useUIStore((state) => state.setFirstAccess);

  return (
    <Card className="pixel-inset w-full rounded-none border-white/10 bg-gradient-to-br from-card via-card to-secondary/10 p-5 shadow-xl sm:p-7">
      <CardTitle className="flex w-full flex-col items-start">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Get started
        </span>
        <span className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Build a stop-loss order
        </span>
      </CardTitle>
      <CardContent className="flex flex-col gap-5 px-0 pb-0 pt-4">
        <span className="max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
          Choose what to sell, set a trigger, then review the order and its
          approvals before you place it.
        </span>
        <BulletPointList
          items={INTRODUCTION_STEPS}
          iconGenerator={(index: number) => (
            <span className="font-semibold tabular-nums">{index + 1}.</span>
          )}
        />
        <div className="border-t border-border/60 pt-5">
          <h3 className="mb-3 text-sm font-semibold">Advanced settings</h3>
          <BulletPointList
            items={ADVANCED_OPTIONS}
            iconGenerator={() => (
              <PixelIcon name="settings" className="size-4" />
            )}
          />
        </div>
        <Button
          className="pixel-control min-h-11 min-w-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-12 rounded-none font-semibold"
          onClick={() => setFirstAccess(false)}
        >
          Create your first order
        </Button>
      </CardContent>
    </Card>
  );
}
