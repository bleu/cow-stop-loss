import { Composition } from "remotion";
import { BetaLaunch } from "./Composition";
import { fontsReady } from "./brand";
import timeline from "../timeline.json";

void fontsReady;

export const RemotionRoot = () => (
  <Composition
    id="BetaLaunchOpenOrder"
    component={BetaLaunch}
    durationInFrames={timeline.duration * timeline.fps}
    fps={timeline.fps}
    width={1080}
    height={1350}
  />
);
