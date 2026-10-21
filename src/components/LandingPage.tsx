"use client";

import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "#/components/ui/accordion";
import { PixelIcon } from "#/components/ui/pixel-icon";

type StepScene = "plan" | "review" | "execution";

const steps = [
  {
    scene: "plan",
    title: "Set your plan",
    description:
      "Connect your wallet, choose a supported token and amount, and set your stop-loss trigger. Check the minimum buy amount and expiry.",
  },
  {
    scene: "review",
    title: "Check before signing",
    description:
      "Verify both oracle feeds and your order terms. Approve token spending if needed, then confirm the setup transaction in your wallet.",
  },
  {
    scene: "execution",
    title: "Execution through CoW",
    description:
      "The oracle condition determines when the order can become executable. CoW Protocol handles execution if the order can be filled within its terms.",
  },
] satisfies { scene: StepScene; title: string; description: string }[];

const questions = [
  {
    id: "what-is-it",
    question: "What is CoW Air Rescue?",
    answer:
      "CoW Air Rescue is an interface for creating and managing conditional stop-loss orders. You set an oracle-based trigger to sell a supported token for the configured buy token. The app creates the order; CoW Protocol handles matching and settlement. A stop-loss order does not guarantee that you will avoid a loss.",
  },
  {
    id: "execution",
    question: "Who executes my order?",
    answer:
      "CoW Protocol's execution infrastructure handles the trade. This app sets up the conditional order through Composable CoW, CowShed, and a Poller schedule. The interface does not execute the swap itself or guarantee that CoW Protocol will fill it. Valid oracle data, sufficient funds and allowances, available liquidity, the order's limit, and expiry all affect execution.",
  },
  {
    id: "trigger-price",
    question: "Is the trigger price my sale price?",
    answer:
      "No. The trigger price is checked against the configured oracle prices. It is separate from the minimum buy amount, which also depends on your slippage setting. The displayed market price is an oracle-derived reference, not a firm execution quote. A price drop can trigger an order while leaving no trade available within its limit. An order can remain unfilled, fill partially if allowed, or expire.",
  },
  {
    id: "oracles",
    question: "Which oracles are used, and what should I check?",
    answer:
      "The app uses a configured ETH or USD price-feed route and divides the sell price by the buy price. It uses ETH feeds when both configured tokens have them; otherwise it uses USD feeds. Sepolia uses fixed USD test feeds. Review both feed contract addresses, the network, underlying assets, quote currency, price direction, decimals, and maximum data age before signing. There is no custom-feed picker. Freshness checks do not prove a feed is correct or will remain accurate.",
  },
  {
    id: "networks",
    question: "Which tokens and networks can I use?",
    answer:
      "The app supports Ethereum, Gnosis, Arbitrum, Base, Polygon, Avalanche, BNB Chain, Linea, Plasma, and Sepolia. The supported sell tokens, fixed buy token, and approved oracle routes depend on the network and current catalog. Sepolia uses WETH and test USDC. New-order availability can be limited while a network has no approved route. The creation form follows your connected wallet's network. Always check token contract addresses and the network in your order review.",
  },
  {
    id: "approvals",
    question: "What do token approvals allow?",
    answer:
      "Setup can require spending allowances for the Poller and the CoW vault relayer through your CowShed. Review each spender and amount in your wallet, especially unlimited approvals. An approval does not reserve tokens for an order. Insufficient funds or allowances can prevent execution. Cancelling an order does not revoke its token approvals.",
  },
  {
    id: "cancel",
    question: "Can I cancel an order?",
    answer:
      "You can request cancellation of a supported open or partially filled order from its details page. Connect the order's wallet on the order's network and confirm the cancellation transaction. The order may still execute before that transaction is confirmed. Completed fills cannot be undone.",
  },
  {
    id: "fees-expiry",
    question: "Are there fees, and when does an order expire?",
    answer:
      "Approval, setup, and cancellation transactions can cost network gas. CoW Protocol execution fees can also apply. Review the transaction and order terms rather than assuming the trade is free. You choose an expiry during setup; the current choices range from 30 minutes to 1 year, with 1 year selected by default. An order that expires before a fill will not complete that trade.",
  },
  {
    id: "risks",
    question: "Does a stop-loss order guarantee protection?",
    answer:
      "No. Oracle faults or delays, sharp price changes, a token depeg, low liquidity, network failures, and smart-contract faults can cause unexpected triggers, failed execution, or losses. This interface and CoW Protocol are separate parts of the process. Assess whether the order and its dependencies are suitable for you.",
  },
];

function LandingStepScene({
  scene,
  number,
}: {
  scene: StepScene;
  number: number;
}) {
  return (
    <div
      className={`landing-step-scene landing-step-scene-${scene}`}
      aria-hidden="true"
    >
      <span className="landing-step-number">0{number}</span>
    </div>
  );
}

function OpenAppLink() {
  return (
    <Link
      href="/app"
      className="pixel-control rescue-primary-button landing-app-link"
    >
      Open app <PixelIcon name="arrow-right" className="size-4" />
    </Link>
  );
}

export function LandingPage() {
  return (
    <main id="main-content" className="air-rescue-page rescue-landing">
      <div className="landing-content">
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-hero-copy">
            <p className="rescue-eyebrow">CoW Air Rescue / Stop-loss orders</p>
            <h1 id="landing-title">
              A plan for
              <br />
              <span>the way down.</span>
            </h1>
            <p className="landing-intro">
              Set a stop-loss before the market moves. Create conditional token
              orders with oracle-based triggers and execution through CoW
              Protocol.
            </p>
            <div className="landing-actions">
              <OpenAppLink />
              <a className="landing-text-link" href="#how-it-works">
                How it works <PixelIcon name="arrow-right" className="size-4" />
              </a>
            </div>
            <p className="landing-hero-note">
              Your trigger sets a condition. Execution and price are not
              guaranteed.
            </p>
          </div>
          <div className="landing-scene" aria-hidden="true">
            <div className="rescue-hero-cow landing-passenger" />
            <span className="landing-scene-label">
              A little planning. More peace of mind.
            </span>
          </div>
        </section>

        <section
          id="how-it-works"
          className="landing-section"
          aria-labelledby="how-it-works-title"
        >
          <div className="landing-section-heading">
            <p className="rescue-eyebrow">Before the way down</p>
            <h2 id="how-it-works-title">How it works</h2>
            <p>You choose the conditions. Check the details before you sign.</p>
          </div>
          <ol className="landing-steps">
            {steps.map((step, index) => (
              <li className="rescue-panel landing-step" key={step.title}>
                <LandingStepScene scene={step.scene} number={index + 1} />
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section
          className="rescue-panel landing-technical landing-section"
          aria-labelledby="technical-title"
        >
          <div className="landing-section-heading">
            <p className="rescue-eyebrow">Under the parachute</p>
            <h2 id="technical-title">Know what your order depends on</h2>
            <p>
              This app creates orders. CoW Protocol is responsible for
              execution. An oracle trigger alone does not guarantee a trade.
            </p>
            <a
              className="landing-text-link"
              href="https://docs.cow.fi/cow-protocol/reference/contracts/periphery/composable-cow"
              target="_blank"
              rel="noopener noreferrer"
            >
              Read the Composable CoW docs
              <PixelIcon name="external-link" className="size-4" />
            </a>
            <div className="landing-rig" aria-hidden="true">
              <span className="landing-rig-line landing-rig-line-left" />
              <span className="landing-rig-passenger" />
              <span className="landing-rig-line landing-rig-line-right" />
            </div>
          </div>
          <dl className="landing-dependencies">
            <div>
              <dt>Oracle condition</dt>
              <dd>
                The sell and buy feeds provide a reference price for the
                trigger. Check both feed addresses in the order review,
                including their network, assets, quote direction, decimals, and
                data age.
              </dd>
            </div>
            <div>
              <dt>Execution limit</dt>
              <dd>
                The minimum buy amount limits the trade you accept. A trigger
                can be reached without a fill at that limit. The oracle
                reference price is not an executable quote.
              </dd>
            </div>
            <div>
              <dt>Order setup</dt>
              <dd>
                Composable CoW, CowShed, and the Poller schedule support the
                conditional order. Funds, spending allowances, and a valid
                expiry are required for execution.
              </dd>
            </div>
          </dl>
        </section>

        <section
          id="faq"
          className="landing-section landing-faq"
          aria-labelledby="faq-title"
        >
          <div className="landing-section-heading">
            <p className="rescue-eyebrow">Before you take off</p>
            <h2 id="faq-title">Frequently asked questions</h2>
            <p>The order flow, the technical details, and the limits.</p>
          </div>
          <div className="rescue-panel landing-faq-panel">
            <Accordion type="single" collapsible>
              {questions.map(({ id, question, answer }) => (
                <AccordionItem key={id} value={id}>
                  <AccordionTrigger className="landing-faq-trigger">
                    {question}
                  </AccordionTrigger>
                  <AccordionContent className="landing-faq-answer">
                    {answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <section className="landing-closing" aria-labelledby="closing-title">
          <h2 id="closing-title">Make a plan before you need it.</h2>
          <p>
            Review your conditions. Verify your feeds. Then create your order.
          </p>
          <OpenAppLink />
        </section>
      </div>
    </main>
  );
}
