import { DiscordLogoIcon, GitHubLogoIcon } from "@radix-ui/react-icons";

export function Footer({
  githubLink,
  discordLink,
}: {
  githubLink: string;
  discordLink: string;
}) {
  return (
    <footer className="flex min-h-[112px] w-full shrink-0 items-end sm:min-h-0 sm:items-center flex-nowrap justify-between gap-x-5 gap-y-2 bg-transparent px-4 py-3 text-foreground sm:px-8 lg:px-10">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-5 gap-y-2 text-xs">
        <span>
          A little peace of mind, built by&nbsp;
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://bleu.builders/"
            className="font-bold text-foreground"
          >
            bleu
          </a>
        </span>
        <a
          href="https://cow.fi/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground transition-colors hover:text-primary"
        >
          Powered by CoW Protocol ↗
        </a>
      </div>
      <div className="flex shrink-0 flex-row items-center space-x-4">
        {githubLink && (
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={githubLink}
            className="/90"
          >
            <GitHubLogoIcon width={20} height={20} />
            <span className="sr-only">GitHub account</span>
          </a>
        )}
        {discordLink && (
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={discordLink}
            className="/90"
          >
            <DiscordLogoIcon width={20} height={20} />
            <span className="sr-only">Discord account</span>
          </a>
        )}
      </div>
    </footer>
  );
}
