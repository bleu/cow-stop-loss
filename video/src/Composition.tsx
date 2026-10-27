import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Sequence,
  staticFile,
  Track,
  useVideoConfig,
} from "remotion";
import timeline from "../timeline.json";
import { brand } from "./brand";
import { ProductSetupScene } from "./ProductScenes";
import { ConclusionScene } from "./ConclusionScenes";
import { ClosingCard, RescueOpening } from "./RescueScenes";

export const BetaLaunch = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        backgroundColor: brand.night,
        color: brand.foreground,
        fontFamily: brand.font,
        fontWeight: 500,
        fontSynthesis: "none",
      }}
    >
      <Track name="Story">
        <Sequence
          name="Market drop and rescue"
          from={timeline.scenes.rescue.from * fps}
          durationInFrames={timeline.scenes.rescue.duration * fps}
        >
          <RescueOpening />
        </Sequence>
        <Sequence
          name="Amount and trigger"
          from={timeline.scenes.amount.from * fps}
          durationInFrames={
            (timeline.scenes.trigger.from +
              timeline.scenes.trigger.duration -
              timeline.scenes.amount.from) *
            fps
          }
        >
          <ProductSetupScene />
        </Sequence>
        <Sequence
          name="Open order"
          from={timeline.scenes.conclusion.from * fps}
          durationInFrames={timeline.scenes.conclusion.duration * fps}
        >
          <ConclusionScene />
        </Sequence>
        <Sequence
          name="Live beta"
          from={timeline.scenes.closing.from * fps}
          durationInFrames={timeline.scenes.closing.duration * fps}
        >
          <ClosingCard />
        </Sequence>
      </Track>
      <Track name="Music">
        <Audio
          name="Original pixel adventure"
          src={staticFile("audio/music.wav")}
          durationInFrames={timeline.duration * fps}
        />
      </Track>
      <Track name="Danger">
        <Audio
          name="Market danger"
          src={staticFile("audio/danger.wav")}
          from={Math.round(timeline.sounds.danger * fps)}
        />
      </Track>
      <Track name="Fall">
        <Audio
          name="Falling whistle"
          src={staticFile("audio/whistle.wav")}
          from={timeline.sounds.whistle * fps}
        />
      </Track>
      <Track name="Chute">
        <Audio
          name="Parachute pop"
          src={staticFile("audio/pop.wav")}
          from={timeline.sounds.pop * fps}
        />
      </Track>
      <Track name="CoW Swap moo">
        <Audio
          name="Original CoW Swap moo"
          src={staticFile("audio/cowswap-moo.mp3")}
          from={timeline.sounds.moo * fps}
          volume={4}
        />
      </Track>
      <Track name="UI clicks">
        <Audio
          name="Open token selector"
          src={staticFile("audio/click.wav")}
          from={timeline.sounds.clicks[0] * fps}
        />
        <Audio
          name="Choose amount"
          src={staticFile("audio/click.wav")}
          from={timeline.sounds.clicks[1] * fps}
        />
        <Audio
          name="Set trigger"
          src={staticFile("audio/click.wav")}
          from={Math.round(timeline.sounds.clicks[2] * fps)}
        />
        <Audio
          name="Order conclusion"
          src={staticFile("audio/click.wav")}
          from={Math.round(timeline.sounds.clicks[3] * fps)}
        />
      </Track>
    </AbsoluteFill>
  );
};
