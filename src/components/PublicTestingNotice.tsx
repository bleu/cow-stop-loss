export function PublicTestingNotice() {
  return (
    <p
      role="note"
      aria-label="Public testing"
      className="shrink-0 bg-yellow-300 px-4 py-2 text-center font-serif text-xs leading-relaxed text-yellow-950"
    >
      This experimental software is provided &apos;as is&apos;, use it at your
      own risk, without warranty. We can’t cover losses, and trades are capped
      at $10k for now. Report problems on{" "}
      <a
        href="https://github.com/bleu/cow-stop-loss/issues/new"
        target="_blank"
        rel="noreferrer noopener"
        className="underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        GitHub issues
      </a>
      .
    </p>
  );
}
