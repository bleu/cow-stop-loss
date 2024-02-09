import { useState } from "react";
import { useReactFlow } from "reactflow";

import { nodeTypes } from "#/lib/types";

import { Dialog } from "../Dialog";
import { Button } from "../ui/button";
import { BaseNode } from ".";

// TODO: Change this to a edge type
export function AddPreHookNode() {
  const [open, setOpen] = useState(false);

  const { addNodes, addEdge, getNodes } = useReactFlow();

  const onHookSelect = (node: nodeTypes) => {
    // TODO
    setOpen(false);
  };

  return (
    <Dialog
      content={<ChooseHookDialog onHookSelect={onHookSelect} />}
      isOpen={open}
      setIsOpen={setOpen}
      title="Choose the hook to add"
    >
      <button className="opacity-25 hover:opacity-75">
        <BaseNode>
          <p className="text-slate12 text-sm font-semibold">Add Pre-Hook</p>
        </BaseNode>
      </button>
    </Dialog>
  );
}

export function ChooseHookDialog({
  onHookSelect,
}: {
  onHookSelect: (open: nodeTypes) => void;
}) {
  return (
    <div className="flex flex-row gap-2">
      <Button
        onClick={() => {
          onHookSelect("hookMultisend");
        }}
        className="bg-blue9 hover:bg-blue7 my-2"
      >
        Multisend
      </Button>
      <Button className="bg-blue9 hover:bg-blue7 my-2">Aave withdraw</Button>
    </div>
  );
}
