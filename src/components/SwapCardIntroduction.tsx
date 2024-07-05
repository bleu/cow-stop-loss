import { Button, Card, CardContent, CardTitle } from "@bleu/ui";
import { GearIcon } from "@radix-ui/react-icons";

import { useSwapCardContext } from "#/contexts/swapCardContext";

const INTRODUCTION_STEPS = [
  "Choose the tokens you want to swap",
  "Define the token amount to sell or buy",
  "Set up a trigger and limit price to condition your order",
  "Review the order and you are ready to go or...",
];

const ADVANCED_OPTIONS = [
  "Change order to be partially fillable",
  "Choose a different receiver",
  "Select different oracles for both tokens",
  "Change oracles maximum time since last update",
];

const StepBulletPoint = ({
  icon,
  description,
}: {
  icon: React.ReactNode;
  description: string;
}) => (
  <div className="flex items-center gap-2">
    <div className="w-[20px]">{icon}</div>
    <span className="text-wrap text-xs w-full">{description}</span>
  </div>
);

const BulletPointList = ({
  items,
  iconGenerator,
}: {
  items: string[];
  iconGenerator: (index: number) => React.ReactNode;
}) => (
  <div className="grid grid-cols-2 gap-4">
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
  const { setFirstAccess } = useSwapCardContext();

  return (
    <Card className="bg-foreground w-full p-5 rounded-lg overflow-auto">
      <CardTitle className="w-full flex flex-col items-center">
        <span className="text-lg">Start creating</span>
        <span className="text-4xl text-primary">Stop Loss orders</span>
      </CardTitle>
      <CardContent className="flex flex-col gap-4 py-5 px-0">
        <span className="text-sm">
          Execute effective investment strategies in a few steps:
        </span>
        <BulletPointList
          items={INTRODUCTION_STEPS}
          iconGenerator={(index: number) => (
            <span className="text-lg text-success font-bold">{index + 1}.</span>
          )}
        />
        <span className="text-sm mt-2">If you feel confident:</span>
        <BulletPointList
          items={ADVANCED_OPTIONS}
          iconGenerator={() => <GearIcon className="size-4" />}
        />
        <Button className="mt-2" onClick={() => setFirstAccess(false)}>
          Get started with Stop Loss orders
        </Button>
      </CardContent>
    </Card>
  );
}
