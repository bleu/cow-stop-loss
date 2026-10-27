import {
  AbsoluteFill,
  CanvasImage,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import captures from "../public/captures/conclusions.json";
import { brand } from "./brand";
import { BrandMark, Headline, Landscape } from "./RescueScenes";

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

export const ConclusionScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Landscape quiet />
      <BrandMark />
      <Headline style={{ fontSize: 86, whiteSpace: "nowrap" }}>
        Your stop-loss <span style={{ color: brand.primary }}>is set.</span>
      </Headline>
      <OrderShot
        file="open-order.png"
        opacity={interpolate(frame, [0, 0.2 * fps], [0, 1], clamp)}
      />
    </AbsoluteFill>
  );
};
