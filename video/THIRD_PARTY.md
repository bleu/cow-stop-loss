# Third-party audio

The moo is the unchanged default success sound from [CoW Swap](https://github.com/cowprotocol/cowswap). Its sound configuration maps `SUCCESS` and `orderExecuted` to `/audio/success.mp3`. The video plays it after the parachute opens, rather than presenting it as a completed order.

- Source: [success.mp3 at commit d0bf6060e0fcf1f48c37c7c5af42430f851bafb5](https://github.com/cowprotocol/cowswap/blob/d0bf6060e0fcf1f48c37c7c5af42430f851bafb5/apps/cowswap-frontend/public/audio/success.mp3)
- Upstream project: CoW Protocol contributors.
- Repository license: [GNU GPL version 3](https://github.com/cowprotocol/cowswap/blob/d0bf6060e0fcf1f48c37c7c5af42430f851bafb5/LICENSE). A copy is in `licenses/cowswap-GPL-3.0.txt`.
- SHA-256: `fb1bc32dcba9ba7996d150bef795cbfdde15eb75aab914332ef2d36ab3bdb032`.
- Local path: `public/audio/cowswap-moo.mp3`, ignored by Git.

`scripts/fetch-moo.mjs` downloads and verifies the original bytes. Playback uses the full clip at normal speed, with its level reduced in the mix. The original score, danger cue, falling whistle, parachute pop, and UI click are generated separately by `scripts/audio.py`.

Keep the source and license information with the project. Check the applicable license terms or separate permission from CoW Protocol before publishing a video that includes this recording.
