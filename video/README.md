# CoW Air Rescue beta-launch video

The 23-second video ends with an open order. It uses the product's pixel artwork, Chakra Petch fonts, and real application screenshots. The green price line draws from left to right, then night falls before the line breaks beneath the cow. The parachute rescue follows, and "Set your stop-loss" stays on screen through the full moo. The video is 1080 x 1350 at 30 fps, with an original 150 BPM chiptune score, the exact CoW Swap success moo, and no voiceover. The moo is mixed about 3 dB above the opening music. The story works when muted.

## Setup

Run these commands from the repository root. Use Node 24.22.1+, Python 3, and FFmpeg. The product needs pnpm 9.15.9 and read access to `@bleu/ui` through the existing npm registry configuration. Do not put credentials in this package.

```sh
corepack pnpm install --frozen-lockfile --ignore-scripts
npm --prefix video ci
npm --prefix video run browser:install
npm --prefix video run assets
```

## Capture the real application

Prepare and check the product catalog from the repository root, then start the isolated app in one terminal:

```sh
corepack pnpm prepare:catalog
corepack pnpm check:assets
corepack pnpm check:catalog
npm --prefix video run app
```

The launcher starts Next.js directly on `127.0.0.1:3157`. It stays in the foreground and sends logs to the terminal. Wait for Next.js to report that it is ready before capturing. Startup and port-binding failures return a nonzero exit code. Use `APP_PORT` to select another port between 1 and 65535; set `APP_URL` to the matching `/app` URL when capturing. The launcher does not prepare or check the catalog.

In another terminal, capture the approved flow:

```sh
npm --prefix video run capture
```

The browser uses a synthetic wallet, fixed prices and balances, and intercepted service responses. It does not use a wallet extension. Signing and transaction methods throw, and unknown service requests fail closed. The form and portfolio are captured from the real local app. The capture fixtures also retain unused execution screenshots. Open and filled orders come from read-only fixture responses; no order is placed, signed, or executed on a real service. The video does not include a simulation label.

The example sells 0.1 WETH for USDC on Ethereum, with a trigger of 3000 USDC per WETH and a one-month expiry. The app calculates the 297 USDC minimum receive amount. Prices, balances, orders, and account data are synthetic. The form is captured at 640 x 1600 CSS pixels and DPR 2; conclusion pages use 480 x 1600 for larger text. The camera zooms only during token selection. Amount and trigger share one steady form view with a short headline fade. Conclusion captures have separate metadata in `public/captures/conclusions.json`, so their dimensions cannot change the form camera.

## Preview and render

```sh
npm --prefix video run dev
```

Studio opens at `http://localhost:3158`. Select `BetaLaunchOpenOrder`. Keep Studio open while editing.

```sh
npm --prefix video run lint
npm --prefix video test
npm --prefix video run frames
npm --prefix video run render
npm --prefix video run verify:render
```

`render` exports `video/output/beta-launch-open-order.mp4` and prepares its audio and artwork. The file uses H.264, yuv420p, and AAC stereo. `verify:render` checks dimensions, frame count, duration, codecs, audio headroom, and a full decode. The execution variant is removed.

The Zod override uses the patched 4.6.6 release. Remotion 4.0.539 reports that it expects 4.5.4; keep the patched version and check the preview and render when updating dependencies.

## Timeline

| Time     | Scene                                                                                                                                        |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 0-4s     | Draw and hold the green price line, change to night, then show the red candle, break, and fall. "You can't watch every move."                |
| 4-8s     | Parachute opens. "Set your stop-loss" stays visible through the full CoW Swap moo.                                                           |
| 8-10.5s  | Real token selection with a brief zoom, then amount entry                                                                                    |
| 10.5-13s | Change the headline and enter the trigger without moving the form                                                                            |
| 13-17s   | Real order list and "Your stop-loss is set." |
| 17-23s   | Product name, live-beta call to action, and builder attribution. Return to day during 18-20s.                                                |

`timeline.json` sets the duration, scene boundaries, and sound cues. The composition and export check use the same schedule.

The video identifies bleu as the builder and CoW Protocol as the underlying protocol. It does not present the launch as a CoW core-team product announcement.

## Files and generated media

`src/` contains the Remotion composition. `scripts/prepare.py` derives artwork layers from the checked-in product SVGs and copies its fonts, including the font license. It removes SVG clock-driven animation so Remotion controls motion by frame. `scripts/audio.py` generates the original score and effects without samples or network access. `scripts/fetch-moo.mjs` downloads CoW Swap's unchanged success sound from a pinned commit and checks its SHA-256; subsequent runs use the verified local file. See [third-party audio](THIRD_PARTY.md) for its source and license. The capture scripts automate the running product without changing its production source.

Prepared brand assets, audio, screenshots, capture reports, temporary files, and renders are ignored by Git. Run preparation and capture before opening the composition on a fresh checkout. Do not add wallet secrets, live-wallet recordings, generated media, or browser profiles to Git.

Remotion's license terms still apply. Check the company-license requirements before distribution.
