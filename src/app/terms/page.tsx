import type { ReactNode } from "react";

import { TERMS_LAST_UPDATED } from "#/lib/terms";

export default function TermsPage() {
  return (
    <main id="main-content" className="air-rescue-page">
      <article className="mx-auto max-w-4xl space-y-8 text-sm leading-relaxed [&_a]:underline [&_a]:underline-offset-4 [&_ol]:list-decimal [&_ol]:space-y-3 [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:space-y-3 [&_ul]:pl-5">
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold sm:text-4xl">Terms of use</h1>
          <p className="text-muted-foreground">
            Last updated:{" "}
            <time dateTime={TERMS_LAST_UPDATED}>{TERMS_LAST_UPDATED}</time>
          </p>
        </header>
        <section
          id="summary"
          aria-labelledby="summary-title"
          className="rescue-panel space-y-4 p-6 sm:p-8"
        >
          <h2 id="summary-title" className="text-xl font-semibold">
            Summary (TL;DR)
          </h2>
          <ul className="list-disc space-y-3 pl-5">
            <li>
              Beta software. CoW Air Rescue is experimental and provided
              &quot;as is&quot;, without warranty. It may contain bugs, change,
              or be paused.
            </li>
            <li>
              You stay in control. The interface is non-custodial. We never hold
              your funds or private keys. Orders are created from your own
              wallet.
            </li>
            <li>
              No guarantee of protection. A stop-loss can fail to execute,
              execute later than expected, fill partially, fill at any price
              down to your minimum, or expire unfilled.
            </li>
            <li>
              Separate parties. bleu builds this interface. CoW Protocol,
              governed by CoW DAO, matches and settles trades. Oracle providers
              supply price feeds. We do not control CoW Protocol or oracle
              providers.
            </li>
            <li>
              Limits. This interface limits new orders to USD 10k, based on the
              oracle price at creation. Only tokens and networks in the current
              catalog are supported.
            </li>
            <li>
              Fees. This interface charges no fee today. Network gas and CoW
              Protocol fees apply.
            </li>
            <li>
              Not financial advice. Default values in the app are not
              recommendations.
            </li>
          </ul>
          <p>
            By using the interface, you agree to these Terms. If you do not
            agree, do not use it.
          </p>
        </section>
        <nav aria-label="Terms sections" className="flex flex-wrap gap-x-6">
          <a href="#summary" className="inline-flex min-h-11 items-center">
            Summary
          </a>
          <a href="#risks" className="inline-flex min-h-11 items-center">
            Risks
          </a>
          <a href="#fees" className="inline-flex min-h-11 items-center">
            Fees
          </a>
          <a href="#privacy" className="inline-flex min-h-11 items-center">
            Privacy
          </a>
          <a href="#contact" className="inline-flex min-h-11 items-center">
            Contact
          </a>
        </nav>
        <TermsSection id="about" title="1. About these Terms">
          <p>
            These Terms govern your use of the website at{" "}
            <a href="https://cow.airrescue.bleu.builders">
              https://cow.airrescue.bleu.builders
            </a>{" "}
            (the &quot;Interface&quot;), provided by BLEU LTDA.
            (&quot;bleu&quot;, &quot;we&quot;, &quot;us&quot;). They form an
            agreement between you and us.
          </p>
        </TermsSection>
        <TermsSection
          id="interface"
          title="2. What the Interface does, and what it does not do"
        >
          <p>
            The Interface helps you create, view, and cancel conditional
            stop-loss orders on CoW Protocol. When you place an order, your
            wallet signs transactions that set up the order through Composable
            CoW, CowShed, and a Poller schedule. Once the oracle condition is
            met, CoW Protocol&apos;s independent solvers may match and settle
            the trade.
          </p>
          <p>
            We do not execute, route, or settle trades. We do not hold,
            transfer, or manage your assets. We do not create accounts for you.
            The Interface is one way to access these smart contracts, not the
            only one.
          </p>
        </TermsSection>
        <TermsSection id="beta" title="3. Beta status">
          <p>
            The Interface is in public beta. Features, supported tokens,
            networks, and limits can change without notice. During the beta:
          </p>
          <ul>
            <li>
              This interface limits new orders to USD 10k, based on the oracle
              price at creation. This is an interface check on the sell amount,
              not a protocol limit or a cap on execution value or total open
              orders.
            </li>
            <li>
              Only tokens with an approved oracle price feed route are
              supported. See the{" "}
              <a href="https://github.com/bleu/cow-stop-loss/blob/main/docs/token-catalog.md">
                token catalog
              </a>
              .
            </li>
            <li>
              We may pause or discontinue the Interface. Orders already on-chain
              remain on-chain, and you can manage them from the smart contracts
              directly.
            </li>
          </ul>
        </TermsSection>
        <TermsSection id="eligibility" title="4. Eligibility">
          <p>You may use the Interface only if:</p>
          <ul>
            <li>
              You are at least 18 years old, or the age of majority where you
              live.
            </li>
            <li>
              You are not located in, or a resident or national of, a country or
              region under comprehensive sanctions (including those of the UN,
              EU, UK, and US), and you are not on any sanctions list.
            </li>
            <li>Using the Interface is legal where you are.</li>
          </ul>
        </TermsSection>
        <TermsSection id="orders" title="5. How stop-loss orders work">
          <ul>
            <li>
              Trigger price: the oracle price that makes your order eligible to
              execute. It is not your sale price.
            </li>
            <li>
              Minimum receive / limit price: the lowest amount you agree to
              receive. Your order can fill at any price at or above this limit.
            </li>
            <li>
              Market price in the Interface: an oracle reference, not a firm
              quote.
            </li>
            <li>
              If the price falls below your limit before execution, the order
              waits until the price recovers to at least the limit, while the
              oracle price stays below the trigger.
            </li>
            <li>
              Placed orders cannot be edited. To change terms, cancel the order
              and create a new one.
            </li>
          </ul>
        </TermsSection>
        <TermsSection id="risks" title="6. Risks">
          <p>
            Using the Interface involves risks that can lead to the loss of some
            or all of the assets in an order. You accept these risks, including:
          </p>
          <ol>
            <li>
              Execution risk. There is no guarantee that an order executes.
              Solvers may not find a solution, liquidity may be insufficient, or
              network conditions may prevent settlement.
            </li>
            <li>
              Price and slippage risk. A fast market can move past your trigger.
              Your order may fill well below the trigger price, down to your
              minimum. Higher slippage raises the chance of a fill and lowers
              the price you may receive.
            </li>
            <li>
              Fee risk. Network and protocol fees can be a large share of small
              orders.
            </li>
            <li>
              Oracle risk. Price feeds can be wrong, delayed, stale, or
              manipulated, and can trigger an order unexpectedly or fail to
              trigger it. Freshness checks do not prove a feed is correct.
            </li>
            <li>
              Token risk. Tokens can depeg, lose liquidity, or be affected by
              issues in their own contracts, including wrapped assets.
            </li>
            <li>
              Smart contract risk. The Interface relies on smart contracts,
              including Composable CoW, CowShed, and CoW Protocol settlement
              contracts. They can contain bugs or be exploited. CoW Protocol
              contracts have undergone audits. See the{" "}
              <a href="https://github.com/cowprotocol/contracts/tree/main/audits">
                CoW Protocol
              </a>{" "}
              and{" "}
              <a href="https://github.com/cowprotocol/composable-cow/tree/main/audits">
                Composable CoW
              </a>{" "}
              audit reports. Audits reduce risk but do not remove it.
            </li>
            <li>
              Approval risk. Setup can require token allowances, including
              unlimited ones. Allowances remain after you cancel an order.
              Review and revoke them in your wallet when you no longer need
              them.
            </li>
            <li>
              Cancellation risk. An order can still execute before your
              cancellation transaction confirms. Completed fills cannot be
              undone.
            </li>
            <li>
              Partial fill and expiry. Orders can fill partially if allowed, or
              expire unfilled. You are responsible for monitoring them.
            </li>
            <li>
              Infrastructure risk. The Interface, RPC providers, or indexers can
              be unavailable or show outdated status. Order status in the
              Interface is not a fresh on-chain check.
            </li>
            <li>
              Governance and upgrade risk. CoW DAO and third-party contract
              owners can change protocol rules, fees, or contracts without
              notice from us.
            </li>
            <li>
              Phishing. We will never ask for your seed phrase or private key.
              Only use the Interface at{" "}
              <a href="https://cow.airrescue.bleu.builders">
                https://cow.airrescue.bleu.builders
              </a>
              .
            </li>
            <li>
              Regulatory and tax risk. Laws on digital assets are changing and
              can affect your use of the Interface. You are responsible for your
              own taxes.
            </li>
            <li>
              Receiver risk. You can send the proceeds of an order to a
              different address. If that address is wrong or not under your
              control, the assets may be lost permanently. Check the receiver
              before signing.
            </li>
          </ol>
        </TermsSection>
        <TermsSection id="fees" title="7. Fees">
          <ul>
            <li>
              The Interface charges no fee today. If this changes, we will show
              the fee before you sign.
            </li>
            <li>
              Approval, setup, and cancellation transactions cost network gas,
              paid from your wallet.
            </li>
            <li>
              CoW Protocol execution costs and protocol fees apply when an order
              fills. CoW DAO sets them, not us.
            </li>
            <li>
              We do not receive payments from solvers, venues, or token issuers
              based on your orders.
            </li>
          </ul>
        </TermsSection>
        <TermsSection id="defaults" title="8. No advice and default settings">
          <p>
            Nothing in the Interface is financial, investment, legal, or tax
            advice. We do not recommend any token, trigger, or strategy, and we
            do not owe you a fiduciary duty.
          </p>
          <p>The Interface pre-fills some values to make the form faster:</p>
          <ul>
            <li>
              Slippage: 10%, editable. Chosen to raise the chance of a fill in a
              falling market. It also lowers the minimum you may receive.
            </li>
            <li>Expiry: 1 year, editable from 30 minutes to 1 year.</li>
            <li>
              Maximum oracle data age: 24 hours, editable in advanced settings.
              The Interface warns you if you raise it above 24 hours.
            </li>
          </ul>
          <p>Review each value before signing.</p>
        </TermsSection>
        <TermsSection id="responsibilities" title="9. Your responsibilities">
          <ul>
            <li>Keep your wallet, private keys, and seed phrase secure.</li>
            <li>
              Review every transaction, token address, network, and amount
              before signing.
            </li>
            <li>
              Use the Interface lawfully, and not for money laundering,
              sanctions evasion, or any illegal activity.
            </li>
            <li>Do not disrupt or attack the Interface.</li>
          </ul>
        </TermsSection>
        <TermsSection id="privacy" title="10. Privacy and data">
          <ul>
            <li>
              Blockchain data: orders and transactions are public and permanent
              on the blockchain. We cannot delete or change them.
            </li>
            <li>
              Analytics: Analytics is enabled by default when configured. We use
              PostHog (hosted in the US) to understand how the Interface is
              used. We collect pages viewed, order parameters at review
              (network, tokens, amounts, prices, expiry), and your wallet
              address once connected. We do not collect keystrokes, signatures,
              or screen recordings. You can opt out or re-enable analytics at
              any time in the footer (Analytics preferences). Opting out stops
              future collection; it does not delete data already sent.
            </li>
            <li>
              Local storage: the Interface stores preferences and draft orders
              in your browser.
            </li>
            <li>
              Your rights: you can ask us about, correct, or delete the
              off-chain data linked to your wallet at{" "}
              <a href="mailto:contact@bleu.studio">contact@bleu.studio</a>.
            </li>
          </ul>
        </TermsSection>
        <TermsSection id="third-parties" title="11. Third-party services">
          <p>
            The Interface depends on services we do not control, including CoW
            Protocol, oracle providers, wallet providers, and RPC providers.
            Their own terms apply, and we are not responsible for their
            performance or failures.
          </p>
        </TermsSection>
        <TermsSection id="source" title="12. Open source">
          <p>
            The Interface source code is available at{" "}
            <a href="https://github.com/bleu/cow-stop-loss">
              https://github.com/bleu/cow-stop-loss
            </a>{" "}
            under the{" "}
            <a href="https://github.com/bleu/cow-stop-loss/blob/main/LICENSE">
              MIT license
            </a>
            .
          </p>
        </TermsSection>
        <TermsSection id="warranties" title="13. Disclaimer of warranties">
          <p>
            The Interface is provided &quot;as is&quot; and &quot;as
            available&quot;. To the extent permitted by law, we disclaim all
            warranties, express or implied, including fitness for a particular
            purpose. We do not warrant that the Interface will be error-free or
            uninterrupted, or that any order will execute at a specific price or
            time.
          </p>
        </TermsSection>
        <TermsSection id="liability" title="14. Limitation of liability">
          <p>
            To the extent permitted by applicable law, bleu is not liable for
            losses arising from market movements, oracle failures, smart
            contract failures, third-party services, network conditions, or your
            use of the Interface. Nothing in these Terms limits liability that
            cannot be limited under applicable law, including consumer
            protection law in your country.
          </p>
        </TermsSection>
        <TermsSection id="changes" title="15. Changes">
          <p>
            We may update these Terms. The &quot;Last updated&quot; date at the
            top shows the current version. Continued use after an update means
            you accept the new Terms.
          </p>
        </TermsSection>
        <TermsSection id="contact" title="16. Contact">
          <p>
            Questions, issues, or data requests:{" "}
            <a href="mailto:contact@bleu.studio">contact@bleu.studio</a>. Bug
            reports:{" "}
            <a href="https://github.com/bleu/cow-stop-loss/issues/new?template=problem-report.yml">
              GitHub issues
            </a>
            .
          </p>
        </TermsSection>
      </article>
    </main>
  );
}

function TermsSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-6 space-y-4"
    >
      <h2 id={`${id}-title`} className="text-xl font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}
