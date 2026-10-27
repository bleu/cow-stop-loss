import type { ReactNode } from "react";
import {
  AbsoluteFill,
  CanvasImage,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import capture from "../public/captures/metadata.json";
import timeline from "../timeline.json";
import { brand } from "./brand";
import { BrandMark, Headline, Landscape } from "./RescueScenes";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const smooth = { ...clamp, easing: Easing.inOut(Easing.cubic) };
const camera = { width: 960, height: 940, panelWidth: 840 };
type Rect = { x: number; y: number; width: number; height: number };
type Image = (typeof capture.screenshots)[number];

const bounds = (image: Image, field: string): Rect => {
  const rect = (image.fields as Partial<Record<string, Rect>>)[field];
  if (!rect)
    throw new Error(
      `Missing capture bounds for ${image.file}:${field}. Run npm run capture.`,
    );
  return rect;
};

const panelBounds = (image: Image): Rect =>
  (image.fields as Partial<Record<string, Rect>>).panel ?? {
    x: 0,
    y: 0,
    width: capture.screenshots[0].width,
    height: image.height,
  };

const union = (rects: Rect[]): Rect => {
  const x = Math.min(...rects.map((rect) => rect.x));
  const y = Math.min(...rects.map((rect) => rect.y));
  return {
    x,
    y,
    width: Math.max(...rects.map((rect) => rect.x + rect.width)) - x,
    height: Math.max(...rects.map((rect) => rect.y + rect.height)) - y,
  };
};

const baseScale = Math.min(
  camera.panelWidth /
    Math.max(...capture.screenshots.map((image) => panelBounds(image).width)),
  camera.height /
    Math.max(...capture.screenshots.map((image) => panelBounds(image).height)),
);

const FocusShot = ({
  file,
  fields,
  focus = 0,
  highlight,
}: {
  file: string;
  fields: string[];
  focus?: number;
  highlight?: string;
}) => {
  const image = capture.screenshots.find((shot) => shot.file === file);
  if (!image) throw new Error(`Missing capture ${file}. Run npm run capture.`);
  const panel = panelBounds(image);
  const target = union(fields.map((field) => bounds(image, field)));
  const focusedScale = Math.min(
    baseScale * 1.28,
    (camera.width - 44) / target.width,
    (camera.height - 80) / target.height,
  );
  const scale = baseScale + (focusedScale - baseScale) * focus;
  const baseX =
    (camera.width - panel.width * baseScale) / 2 - panel.x * baseScale;
  const baseY = -panel.y * baseScale;
  const focusX =
    camera.width / 2 - (target.x + target.width / 2) * focusedScale;
  const focusY = Math.min(
    baseY,
    camera.height * 0.46 - (target.y + target.height / 2) * focusedScale,
  );
  const mark = highlight ? bounds(image, highlight) : undefined;
  return (
    <div
      style={{
        position: "absolute",
        width: image.width,
        height: image.height,
        transformOrigin: "0 0",
        scale,
        translate: `${baseX + (focusX - baseX) * focus}px ${baseY + (focusY - baseY) * focus}px`,
      }}
    >
      <CanvasImage
        src={staticFile(`captures/${file}`)}
        style={{
          position: "absolute",
          width: image.width,
          height: image.height,
        }}
      />
      {mark && (
        <div
          style={{
            position: "absolute",
            left: mark.x - 6,
            top: mark.y - 6,
            width: mark.width + 12,
            height: mark.height + 12,
            border: `${3 / scale}px solid ${brand.peach}`,
            opacity: focus * 0.9,
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
};

const ProductFrame = ({
  title,
  children,
}: {
  title: ReactNode;
  children: ReactNode;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Landscape quiet />
      <BrandMark />
      <Headline style={{ fontSize: 74, top: 190, letterSpacing: -2 }}>
        {title}
      </Headline>
      <div
        style={{
          position: "absolute",
          left: 60,
          top: 320,
          width: camera.width,
          height: camera.height,
          overflow: "hidden",
          maskImage:
            "linear-gradient(to bottom, black 0%, black 94%, transparent 100%)",
          opacity: interpolate(frame, [0, 0.1 * fps], [0, 1], clamp),
          translate: `0px ${interpolate(frame, [0, 0.22 * fps], [16, 0], smooth)}px`,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

export const ProductSetupScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps + timeline.scenes.amount.from;
  const triggerFrame =
    (timeline.scenes.trigger.from - timeline.scenes.amount.from) * fps;
  const file =
    time < timeline.actions.tokenSelector
      ? "form-empty.png"
      : time < timeline.actions.amountEntered
        ? "token-selector.png"
        : time < timeline.actions.triggerEntered
          ? "amount-entered.png"
          : "trigger-entered.png";
  const token = file === "token-selector.png";
  return (
    <ProductFrame
      title={
        <>
          <span
            style={{
              position: "absolute",
              opacity: interpolate(
                frame,
                [triggerFrame - 4, triggerFrame],
                [1, 0],
                smooth,
              ),
              translate: `0px ${interpolate(frame, [triggerFrame - 4, triggerFrame], [0, -8], smooth)}px`,
            }}
          >
            Choose your amount.
          </span>
          <span
            style={{
              position: "absolute",
              opacity: interpolate(
                frame,
                [triggerFrame, triggerFrame + 4],
                [0, 1],
                smooth,
              ),
              translate: `0px ${interpolate(frame, [triggerFrame, triggerFrame + 4], [8, 0], smooth)}px`,
            }}
          >
            Set your trigger.
          </span>
        </>
      }
    >
      <FocusShot
        file={file}
        fields={token ? ["tokenSelector", "tokenPopover"] : ["sellGroup"]}
        focus={
          token
            ? interpolate(
                time * fps,
                [
                  timeline.actions.tokenSelector * fps,
                  (timeline.actions.tokenSelector + 0.25) * fps,
                  (timeline.actions.amountEntered - 0.3) * fps,
                  timeline.actions.amountEntered * fps,
                ],
                [0, 0.8, 0.8, 0],
                smooth,
              )
            : 0
        }
      />
    </ProductFrame>
  );
};
