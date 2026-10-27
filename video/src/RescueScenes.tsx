import type { CSSProperties, ReactNode } from "react";
import {
  AbsoluteFill,
  CanvasImage,
  Easing,
  interpolate,
  interpolateColors,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { brand } from "./brand";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const BrandMark = ({ dark = true }: { dark?: boolean }) => (
  <div
    style={{
      position: "absolute",
      left: 86,
      top: 66,
      display: "flex",
      alignItems: "center",
      gap: 17,
      color: dark ? brand.foreground : brand.ink,
      fontSize: 30,
      fontWeight: 600,
      letterSpacing: -0.5,
    }}
  >
    <CanvasImage
      src={staticFile("brand/face-dark.svg")}
      style={{ width: 52, height: 52, imageRendering: "pixelated" }}
    />
    <span>CoW Air Rescue</span>
  </div>
);

export const Landscape = ({
  night = 1,
  quiet = false,
}: {
  night?: number;
  quiet?: boolean;
}) => (
  <AbsoluteFill
    style={{
      backgroundColor: interpolateColors(
        night,
        [0, 1],
        [brand.day, brand.night],
      ),
      overflow: "hidden",
    }}
  >
    <CanvasImage
      src={staticFile("brand/sky-mobile-light.svg")}
      style={{
        position: "absolute",
        width: 1080,
        height: 900,
        top: 300,
        opacity: (1 - night) * (quiet ? 0.25 : 1),
        imageRendering: "pixelated",
      }}
    />
    <CanvasImage
      src={staticFile("brand/sky-mobile-dark.svg")}
      style={{
        position: "absolute",
        width: 1080,
        height: 900,
        top: 300,
        opacity: night * (quiet ? 0.3 : 1),
        imageRendering: "pixelated",
      }}
    />
    <CanvasImage
      src={staticFile("brand/moon.svg")}
      style={{
        position: "absolute",
        left: 840,
        top: 510,
        width: 100,
        height: 100,
        opacity: night * (quiet ? 0.25 : 1),
        imageRendering: "pixelated",
      }}
    />
    <CanvasImage
      src={staticFile("brand/ground-mobile-light.svg")}
      style={{
        position: "absolute",
        width: 1080,
        height: 675,
        bottom: -390,
        opacity: (1 - night) * (quiet ? 0.5 : 1),
        imageRendering: "pixelated",
      }}
    />
    <CanvasImage
      src={staticFile("brand/ground-mobile-dark.svg")}
      style={{
        position: "absolute",
        width: 1080,
        height: 675,
        bottom: -390,
        opacity: night * (quiet ? 0.5 : 1),
        imageRendering: "pixelated",
      }}
    />
  </AbsoluteFill>
);

export const ParachutingCow = ({
  width = 540,
  left = 270,
  top = 330,
  opening = 1,
  rotate = 0,
  opacity = 1,
}: {
  width?: number;
  left?: number;
  top?: number;
  opening?: number;
  rotate?: number;
  opacity?: number;
}) => (
  <div
    style={{
      position: "absolute",
      left,
      top,
      width,
      height: width * 1.2,
      rotate: `${rotate}deg`,
      opacity,
      transformOrigin: "50% 75%",
    }}
  >
    <CanvasImage
      src={staticFile("brand/parachute-dark.svg")}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width,
        height: (width * 50) / 60,
        scale: `1 ${Math.max(0.001, opening)}`,
        opacity: opening > 0.01 ? 1 : 0,
        transformOrigin: "50% 96%",
        imageRendering: "pixelated",
      }}
    />
    <CanvasImage
      src={staticFile("brand/cow-dark.svg")}
      style={{
        position: "absolute",
        left: (width * 8) / 60,
        top: (width * 44) / 60,
        width: (width * 44) / 60,
        height: (width * 28) / 60,
        imageRendering: "pixelated",
      }}
    />
  </div>
);

export const Headline = ({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <h1
      style={{
        position: "absolute",
        left: 86,
        right: 86,
        top: 165,
        margin: 0,
        fontSize: 94,
        fontWeight: 600,
        lineHeight: 1.08,
        letterSpacing: -3.6,
        opacity: interpolate(frame, [0, 0.25 * fps], [0, 1], clamp),
        translate: `0px ${interpolate(frame, [0, 0.4 * fps], [16, 0], { ...clamp, easing: Easing.out(Easing.cubic) })}px`,
        ...style,
      }}
    >
      {children}
    </h1>
  );
};

const MarketDrop = () => {
  const { fps } = useVideoConfig();
  const openingFrame = useCurrentFrame();
  const frame = Math.max(0, openingFrame - fps);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: interpolate(frame, [2.3 * fps, 2.8 * fps], [1, 0], clamp),
      }}
    >
      <svg
        width={1080}
        height={1350}
        viewBox="0 0 1080 1350"
        style={{ position: "absolute", inset: 0 }}
        shapeRendering="crispEdges"
      >
        {openingFrame < 0.8 * fps ? (
          <path
            d="M110 860 H190 V820 H280 V790 H360 V770 H680 H720 V710 H840"
            fill="none"
            stroke="#238974"
            strokeWidth={10}
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={interpolate(
              openingFrame,
              [0, 0.8 * fps],
              [1, 0],
              { ...clamp, easing: Easing.inOut(Easing.quad) },
            )}
          />
        ) : (
          <>
            <path
              d="M110 860 H190 V820 H280 V790 H360 V770 H420 M680 770 H720 V710 H840"
              fill="none"
              stroke={frame < 0.65 * fps ? "#238974" : "#e34b64"}
              strokeWidth={10}
            />
            <path
              d="M420 770 H680"
              fill="none"
              stroke={frame < 0.65 * fps ? "#238974" : "#e34b64"}
              strokeWidth={10}
              opacity={interpolate(
                frame,
                [1.05 * fps, 1.1 * fps],
                [1, 0],
                clamp,
              )}
            />
          </>
        )}
        {[0, 1, 2, 3].map((piece) => (
          <rect
            key={piece}
            x={430 + piece * 64}
            y={
              770 +
              interpolate(
                frame,
                [1.1 * fps, 2.3 * fps],
                [0, 210 + piece * 42],
                clamp,
              )
            }
            width={42}
            height={10}
            fill="#e34b64"
            opacity={interpolate(
              frame,
              [1.05 * fps, 1.1 * fps, 1.7 * fps, 2.3 * fps],
              [0, 1, 1, 0],
              clamp,
            )}
          />
        ))}
        <g opacity={interpolate(frame, [0.55 * fps, 0.7 * fps], [0, 1], clamp)}>
          <rect
            x={846}
            y={660}
            width={8}
            height={interpolate(
              frame,
              [0.65 * fps, 1.45 * fps],
              [60, 390],
              clamp,
            )}
            fill="#e34b64"
          />
          <rect
            x={820}
            y={695}
            width={60}
            height={interpolate(
              frame,
              [0.65 * fps, 1.45 * fps],
              [40, 300],
              clamp,
            )}
            fill="#e34b64"
          />
          <path d="M816 1020 H884 L850 1060 Z" fill="#e34b64" />
        </g>
      </svg>
    </div>
  );
};

const FallingCow = () => {
  const { fps } = useVideoConfig();
  const frame = Math.max(0, useCurrentFrame() - fps);
  return (
    <>
      <ParachutingCow
        width={480}
        left={300}
        top={interpolate(
          frame,
          [0, 1.1 * fps, 3.2 * fps, 3.55 * fps, 7 * fps],
          [194, 194, 465, 400, 425],
          { ...clamp, easing: Easing.inOut(Easing.quad) },
        )}
        opening={spring({
          frame: frame - 3.2 * fps,
          fps,
          config: { damping: 12, stiffness: 260, mass: 0.55 },
        })}
        rotate={interpolate(
          frame,
          [0, 1.1 * fps, 1.6 * fps, 3.2 * fps, 3.55 * fps, 7 * fps],
          [0, 0, -10, 8, -2, 1],
          clamp,
        )}
      />
    </>
  );
};

export const RescueOpening = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Landscape night={interpolate(frame, [fps, 1.5 * fps], [0, 1], clamp)} />
      <AbsoluteFill
        style={{
          backgroundColor: "#ed3154",
          opacity: interpolate(
            frame,
            [1.65 * fps, 1.75 * fps, 1.9 * fps, 2.05 * fps],
            [0, 0.14, 0.14, 0],
            clamp,
          ),
        }}
      />
      <BrandMark dark={frame >= 1.25 * fps} />
      <MarketDrop />
      <FallingCow />
      <Sequence name="Opening message" durationInFrames={4 * fps}>
        <Headline
          style={{
            color: frame >= 1.25 * fps ? brand.foreground : brand.ink,
            opacity: interpolate(
              frame,
              [0, 8, 3.6 * fps, 3.85 * fps],
              [1, 1, 1, 0],
              clamp,
            ),
          }}
        >
          You can&apos;t watch
          <br />
          every move.
        </Headline>
      </Sequence>
      <Sequence
        name="Stop-loss message"
        from={4 * fps}
        durationInFrames={4 * fps}
      >
        <Headline style={{ color: brand.foreground, whiteSpace: "nowrap" }}>
          Set your <span style={{ color: brand.primary }}>stop-loss.</span>
        </Headline>
      </Sequence>
    </AbsoluteFill>
  );
};

export const ClosingCard = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const day = frame >= 2 * fps;
  const foreground = day ? brand.ink : brand.foreground;
  return (
    <AbsoluteFill>
      <Landscape night={interpolate(frame, [fps, 3 * fps], [1, 0], clamp)} />
      <BrandMark dark={!day} />
      <Headline
        style={{ top: 185, fontSize: 96, lineHeight: 1.08, color: foreground }}
      >
        CoW Air Rescue
      </Headline>
      <div
        style={{
          position: "absolute",
          left: 86,
          top: 330,
          color: day ? "#3154ac" : brand.primary,
          fontSize: 64,
          fontWeight: 600,
          letterSpacing: -1.7,
          opacity: interpolate(frame, [0.1 * fps, 0.35 * fps], [0, 1], clamp),
        }}
      >
        Beta is live
      </div>
      <div
        style={{
          position: "absolute",
          left: 88,
          right: 88,
          top: 440,
          color: foreground,
          fontSize: 44,
          lineHeight: 1.3,
          opacity: interpolate(frame, [0.2 * fps, 0.45 * fps], [0, 1], clamp),
        }}
      >
        Find it on
        <br />
        CoW Discord
      </div>
      <ParachutingCow
        width={354}
        left={363 + Math.sin(frame / 40) * 8}
        top={565 + Math.sin(frame / 22) * 7}
        rotate={Math.sin(frame / 25) * 1.5}
      />
      <div
        style={{
          position: "absolute",
          left: 88,
          right: 88,
          bottom: 120,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          borderTop: `2px solid ${day ? brand.ink : brand.frame}`,
          paddingTop: 24,
        }}
      >
        <div style={{ fontSize: 40, color: foreground }}>
          Built by <span style={{ fontWeight: 600 }}>bleu</span>
        </div>
        <div
          style={{
            fontSize: 28,
            lineHeight: 1.25,
            color: day ? brand.ink : brand.muted,
            textAlign: "right",
          }}
        >
          Powered by
          <br />
          CoW Protocol
        </div>
      </div>
    </AbsoluteFill>
  );
};
