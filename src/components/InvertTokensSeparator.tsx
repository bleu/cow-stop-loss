import { Separator } from "@bleu/ui";
import { UpdateIcon } from "@radix-ui/react-icons";

export function InvertTokensSeparator() {
  return (
    <div className="flex w-full gap-1 items-center">
      <div className="w-2/5">
        <Separator />
      </div>
      <button className="flex justify-center w-1/5">
        <UpdateIcon className="size-6 text-accent hover:text-accent/70" />
      </button>
      <div className="w-2/5">
        <Separator />
      </div>
    </div>
  );
}
