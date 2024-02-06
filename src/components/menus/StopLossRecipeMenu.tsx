import { IStopLossRecipeData } from "@/lib/types";

export function StopLossRecipeMenu({ data }: { data: IStopLossRecipeData }) {
  return (
    <div>
      <span className="text-md">Preview</span>
      <div className="flex flex-col gap-y-2">
        {Object.keys(data).map((key) => (
          <div key={key}>
            {/* @ts-ignore */}
            {key}: {String(data[key])}
          </div>
        ))}
      </div>
    </div>
  );
}
