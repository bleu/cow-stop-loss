import { Handle as HandlerPrimitive, Position } from "reactflow";

export function Handle({ type }: { type: "source" | "target" }) {
  return (
    <HandlerPrimitive
      type={type}
      position={type === "source" ? Position.Bottom : Position.Top}
      className="size-0 bg-foreground/80"
    />
  );
}
