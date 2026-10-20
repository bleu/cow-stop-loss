import Link from "next/link";

import { PixelIcon } from "#/components/ui/pixel-icon";

export function Footer({
  githubLink,
  discordLink,
  scenePaused = false,
  onToggleScene,
}: {
  githubLink: string;
  discordLink: string;
  scenePaused?: boolean;
  onToggleScene?: () => void;
}) {
  return (
    <footer className="rescue-footer flex w-full shrink-0 items-center justify-between bg-transparent text-foreground">
      <div className="rescue-footer-copy flex min-w-0 flex-1 flex-wrap items-center gap-x-5 gap-y-1 text-xs">
        <span>
          A little peace of mind, built by&nbsp;
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://bleu.builders/"
            className="font-bold hover:underline"
          >
            bleu
          </a>
        </span>
        <Link
          href="/#faq"
          className="inline-flex min-h-11 items-center hover:underline"
        >
          FAQ
        </Link>
        <a
          href="https://cow.fi/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 hover:underline"
        >
          Powered by CoW Protocol
          <PixelIcon name="external-link" className="size-4" />
        </a>
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-3">
        {onToggleScene && (
          <button
            type="button"
            className="rescue-motion-toggle"
            onClick={onToggleScene}
            aria-label={
              scenePaused
                ? "Resume scenery animation"
                : "Pause scenery animation"
            }
            aria-pressed={scenePaused}
            title={
              scenePaused
                ? "Resume scenery animation"
                : "Pause scenery animation"
            }
          >
            {scenePaused ? (
              <PixelIcon name="play" className="size-4" />
            ) : (
              <PixelIcon name="pause" className="size-4" />
            )}
          </button>
        )}
        {githubLink && (
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={githubLink}
            className="flex size-11 items-center justify-center hover:text-primary"
            aria-label="GitHub repository"
          >
            <PixelIcon name="github" className="size-6" />
          </a>
        )}
        {discordLink && (
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={discordLink}
            className="flex size-11 items-center justify-center hover:text-primary"
            aria-label="CoW Protocol Discord"
          >
            <PixelIcon name="discord" className="size-6" />
          </a>
        )}
      </div>
    </footer>
  );
}
