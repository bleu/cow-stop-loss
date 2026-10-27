import {
  AbsoluteFill,
  CanvasImage,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import captures from "../public/captures/conclusions.json";
import timeline from "../timeline.json";
import { brand } from "./brand";
import { BrandMark, Headline, Landscape } from "./RescueScenes";

export type ConclusionVariant = "open-order" | "execution";

type Capture = { file: string; width: number; height: number };
const shots: Capture[] = captures.screenshots;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const OrderShot = ({
  file,
  opacity = 1,
}: {
  file: string;
  opacity?: number;
}) => {
  const image = shots.find((shot) => shot.file === file);
  if (!image) throw new Error(`Missing ${file}. Run npm run capture.`);
  const scale = Math.min(900 / image.width, 850 / image.height);
  return (
    <CanvasImage
      src={staticFile(`captures/${file}`)}
      style={{
        position: "absolute",
        left: (1080 - image.width * scale) / 2,
        top: 410 + Math.max(0, (580 - image.height * scale) / 2),
        width: image.width * scale,
        height: image.height * scale,
        opacity,
      }}
    />
  );
};

export const ConclusionScene = ({
  variant,
}: {
  variant: ConclusionVariant;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const executionFrame =
    (timeline.actions.executionVisible - timeline.scenes.conclusion.from) * fps;
  const filled = interpolate(
    frame,
    [executionFrame - 3, executionFrame + 3],
    [0, 1],
    { ...clamp, easing: Easing.inOut(Easing.cubic) },
  );
  return (
    <AbsoluteFill>
      <Landscape quiet />
      <BrandMark />
      {variant === "open-order" ? (
        <>
          <Headline style={{ fontSize: 86 }}>
            Your stop-loss
            <br />
            <span style={{ color: brand.primary }}>is set.</span>
          </Headline>
          <OrderShot
            file="open-order.png"
            opacity={interpolate(frame, [0, 0.2 * fps], [0, 1], clamp)}
          />
        </>
      ) : (
        <>
          <Headline
            style={{
              fontSize: 86,
              opacity: interpolate(
                frame,
                [executionFrame - 4, executionFrame],
                [1, 0],
                clamp,
              ),
            }}
          >
            Trigger reached.
          </Headline>
          <Headline
            style={{
              fontSize: 86,
              opacity: interpolate(
                frame,
                [executionFrame, executionFrame + 4],
                [0, 1],
                clamp,
              ),
            }}
          >
            Order <span style={{ color: brand.primary }}>filled.</span>
          </Headline>
          <div
            style={{
              position: "absolute",
              left: 88,
              top: 300,
              fontSize: 42,
              color: brand.muted,
              opacity: 1 - filled,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            Market: 3,000 USDC / WETH
          </div>
          <OrderShot file="trigger-reached.png" opacity={1 - filled} />
          <OrderShot file="execution-detail.png" opacity={filled} />
        </>
      )}
    </AbsoluteFill>
  );
};
