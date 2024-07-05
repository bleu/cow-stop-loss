"use client";

import { Button, Card, CardContent, CardTitle } from "@bleu/ui";
import { GearIcon } from "@radix-ui/react-icons";

import { useSwapCardContext } from "#/contexts/swapCardContext";

export function SwapCardIntroduction() {
  const { setFirstAccess } = useSwapCardContext();
  return (
    <Card className="bg-foreground  w-full p-5 rounded-lg overflow-auto">
      <CardTitle className="w-full flex flex-col items-center">
        <span className="text-lg">Start creating</span>
        <span className="text-4xl text-primary">stop-loss orders</span>
      </CardTitle>
      <CardContent className="flex flex-col gap-4 py-5 px-0">
        <span className="text-sm">
          Execute effective investment strategies in a few steps:
        </span>
        <div className="grid grid-cols-2 gap-4">
          <StepBulletPoint
            icon={<span className="text-lg text-success font-bold">1.</span>}
            description="Choose the tokens you want to swap"
          />
          <StepBulletPoint
            icon={<span className="text-lg text-success font-bold">2.</span>}
            description="Define the token amount to sell or buy"
          />
          <StepBulletPoint
            icon={<span className="text-lg text-success font-bold">3.</span>}
            description="Set up a trigger and limit price to condition your order"
          />
          <StepBulletPoint
            icon={<span className="text-lg text-success font-bold">4.</span>}
            description="Review the order and you are ready to go or..."
          />
        </div>
        <span className="text-sm mt-2">If you fell confident:</span>
        <div className="grid grid-cols-2 gap-4">
          <StepBulletPoint
            icon={<GearIcon className="size-5" />}
            description="Change order to be partially fillable"
          />
          <StepBulletPoint
            icon={<GearIcon className="size-5" />}
            description="Choose a different receiver"
          />
          <StepBulletPoint
            icon={<GearIcon className="size-5" />}
            description="Select different oracles for both tokens"
          />
          <StepBulletPoint
            icon={<GearIcon className="size-5" />}
            description="Change oracles maximum time since last update"
          />
        </div>
        <Button
          className="mt-2"
          onClick={() => {
            setFirstAccess(false);
          }}
        >
          Get started with stop-loss orders
        </Button>
      </CardContent>
    </Card>
  );
}

function StepBulletPoint({
  icon,
  description,
}: {
  icon: React.ReactNode;
  description: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-[20px]">{icon}</div>
      <span className="text-wrap text-xs w-full">{description}</span>
    </div>
  );
}
