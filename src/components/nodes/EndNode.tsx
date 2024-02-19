import { Handle, Position } from "reactflow";

export function EndNode() {
  return (
    <div className="flex flex-row justify-center w-64">
      <div className="px-4 py-2 shadow-md rounded-full bg-blue3 border-2 border-slate6">
        <div className="flex flex-col">
          <span className="text-sm font-bold">End</span>
        </div>
        <Handle
          type="target"
          position={Position.Top}
          className="size-2 rounded-full bg-slate6"
        />
      </div>
    </div>
  );
}
