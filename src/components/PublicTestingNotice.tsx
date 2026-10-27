export function PublicTestingNotice() {
  return (
    <p
      role="note"
      aria-label="Public testing"
      className="shrink-0 bg-yellow-300 px-4 py-2 text-center font-serif text-xs leading-relaxed text-yellow-950"
    >
      All trades are executed through CoW Protocol. CoW Air Rescue is
      experimental software provided ‘as is’, without warranty. Execution is not
      guaranteed, and we cannot cover any losses. Trades are currently capped at
      $10k. Report issues on{" "}
      <a
        href="https://github.com/bleu/cow-stop-loss/issues/new?template=problem-report.yml"
        target="_blank"
        rel="noreferrer noopener"
        className="underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        GitHub
      </a>
      .
    </p>
  );
}
