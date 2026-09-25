import { Composition, Series, Audio, staticFile, AbsoluteFill } from "remotion";
import { TitleScene } from "./components/TitleScene";
import { KPIAnimation } from "./components/KPIAnimation";
import { BarChart } from "./components/BarChart";
import { LineChart } from "./components/LineChart";
import { PieChartScene } from "./components/PieChartScene";
import { TimelineScene } from "./components/TimelineScene";
import { HighlightCard } from "./components/HighlightCard";
import { ComparisonChart } from "./components/ComparisonChart";
import { BulletPointsScene } from "./components/BulletPointsScene";
import { NumberedStepsScene } from "./components/NumberedStepsScene";
import { Captions } from "./components/Captions";
import { BRollBackground } from "./components/BRollBackground";
import storyboard from "./data/storyboard.json";
import type { Storyboard, StoryboardScene, SceneStyle } from "./types";
import { useCurrentFrame, interpolate } from "remotion";

// Load Inter Font dynamically
import { loadFont } from "@remotion/google-fonts/Inter";
try {
  loadFont();
} catch (e) {
  console.log("Font already loaded or failed to load");
}

const Background = ({ style }: { style: SceneStyle }) => {
  const frame = useCurrentFrame();
  // Slow pan for the grid to make it feel alive without being distracting
  const shift = interpolate(frame, [0, 900], [0, -100], { extrapolateRight: "extend" });
  return (
    <AbsoluteFill
      style={{
        backgroundColor: style.backgroundColor,
        backgroundSize: "60px 60px",
        backgroundImage: `linear-gradient(to right, ${style.primaryColor}08 1px, transparent 1px), linear-gradient(to bottom, ${style.primaryColor}08 1px, transparent 1px)`,
        backgroundPosition: `${shift}px ${shift}px`,
        zIndex: 0,
      }}
    >
       <div style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at center, transparent 30%, ${style.backgroundColor} 100%)`
       }} />
    </AbsoluteFill>
  );
};

// ── Cast the imported JSON to our typed Storyboard ───────────
const data = storyboard as Storyboard;

/**
 * Calculates the total video duration in frames from all scenes.
 */
const getTotalDurationInFrames = (scenes: StoryboardScene[], fps: number) => {
  return scenes.reduce(
    (total, scene) => total + scene.durationInSeconds * fps,
    0
  );
};

/**
 * InfographicVideo — Sequentially composes all storyboard scenes
 * using Remotion's <Series> component.
 *
 * Each scene's `type` field is mapped to its corresponding
 * visual component, and the scene data is spread as props.
 */
const InfographicVideo: React.FC = () => {
  const { fps } = data.video;
  const { style, scenes } = data;

  return (
    <AbsoluteFill from={-228}>
      <Background style={style} />
      
      {/* Background Music with ducked volume so it doesn't overpower TTS */}
      <Audio src={staticFile("bgm.mp3")} volume={0.12} loop />

      <Series>
        {scenes.map((scene) => {
        const durationInFrames = scene.durationInSeconds * fps;

        switch (scene.type) {
          case "title":
            return (
              <Series.Sequence key={scene.id} durationInFrames={durationInFrames}>
                {scene.narration && <Audio src={staticFile(`scene_${scene.id}.mp3`)} />}
                {scene.brollUrl && <BRollBackground src={scene.brollUrl} style={style} />}
                <TitleScene
                  title={scene.title}
                  subtitle={scene.subtitle}
                  style={style}
                />
                <Captions captions={scene.captions} style={style} />
              </Series.Sequence>
            );

          case "kpi":
            return (
              <Series.Sequence
                key={scene.id}
                durationInFrames={durationInFrames}
              >
                {scene.narration && <Audio src={staticFile(`scene_${scene.id}.mp3`)} />}
                {scene.brollUrl && <BRollBackground src={scene.brollUrl} style={style} />}
                <KPIAnimation
                  metric={scene.metric}
                  value={scene.value}
                  unit={scene.unit}
                  prefix={scene.prefix}
                  growth={scene.growth}
                  growthLabel={scene.growthLabel}
                  style={style}
                />
                <Captions captions={scene.captions} style={style} />
              </Series.Sequence>
            );

          case "bar_chart":
            return (
              <Series.Sequence
                key={scene.id}
                durationInFrames={durationInFrames}
              >
                {scene.narration && <Audio src={staticFile(`scene_${scene.id}.mp3`)} />}
                {scene.brollUrl && <BRollBackground src={scene.brollUrl} style={style} />}
                <BarChart
                  title={scene.title}
                  chart_data={scene.chart_data!}
                  color={scene.color}
                  style={style}
                />
                <Captions captions={scene.captions} style={style} />
              </Series.Sequence>
            );

          case "pie_chart":
            return (
              <Series.Sequence
                key={scene.id}
                durationInFrames={durationInFrames}
              >
                {scene.narration && <Audio src={staticFile(`scene_${scene.id}.mp3`)} />}
                {scene.brollUrl && <BRollBackground src={scene.brollUrl} style={style} />}
                <PieChartScene
                  title={scene.title}
                  chart_data={scene.chart_data!}
                  style={style}
                />
                <Captions captions={scene.captions} style={style} />
              </Series.Sequence>
            );

          case "timeline":
            return (
              <Series.Sequence
                key={scene.id}
                durationInFrames={durationInFrames}
              >
                {scene.narration && <Audio src={staticFile(`scene_${scene.id}.mp3`)} />}
                {scene.brollUrl && <BRollBackground src={scene.brollUrl} style={style} />}
                <TimelineScene
                  title={scene.title}
                  chart_data={scene.chart_data!}
                  style={style}
                />
                <Captions captions={scene.captions} style={style} />
              </Series.Sequence>
            );

          case "line_chart":
            return (
              <Series.Sequence
                key={scene.id}
                durationInFrames={durationInFrames}
              >
                {scene.narration && <Audio src={staticFile(`scene_${scene.id}.mp3`)} />}
                {scene.brollUrl && <BRollBackground src={scene.brollUrl} style={style} />}
                <LineChart
                  title={scene.title}
                  chart_data={scene.chart_data!}
                  targetItems={scene.targetItems}
                  color={scene.color}
                  style={style}
                />
                <Captions captions={scene.captions} style={style} />
              </Series.Sequence>
            );

          case "highlight":
            return (
              <Series.Sequence
                key={scene.id}
                durationInFrames={durationInFrames}
              >
                {scene.narration && <Audio src={staticFile(`scene_${scene.id}.mp3`)} />}
                {scene.brollUrl && <BRollBackground src={scene.brollUrl} style={style} />}
                <HighlightCard
                  metric={scene.metric}
                  value={scene.value}
                  unit={scene.unit}
                  prefix={scene.prefix}
                  badge={scene.badge}
                  achievement={scene.achievement}
                  variance={scene.variance}
                  sentiment={scene.sentiment}
                  style={style}
                />
                <Captions captions={scene.captions} style={style} />
              </Series.Sequence>
            );

          case "comparison":
            return (
              <Series.Sequence
                key={scene.id}
                durationInFrames={durationInFrames}
              >
                {scene.narration && <Audio src={staticFile(`scene_${scene.id}.mp3`)} />}
                {scene.brollUrl && <BRollBackground src={scene.brollUrl} style={style} />}
                <ComparisonChart
                  title={scene.title}
                  items={scene.items}
                  style={style}
                />
                <Captions captions={scene.captions} style={style} />
              </Series.Sequence>
            );

          case "bullet_points":
            return (
              <Series.Sequence
                key={scene.id}
                durationInFrames={durationInFrames}
              >
                {scene.narration && <Audio src={staticFile(`scene_${scene.id}.mp3`)} />}
                {scene.brollUrl && <BRollBackground src={scene.brollUrl} style={style} />}
                <BulletPointsScene
                  heading={scene.heading}
                  content_points={scene.content_points}
                  style={style}
                />
                <Captions captions={scene.captions} style={style} />
              </Series.Sequence>
            );

          case "numbered_steps":
            return (
              <Series.Sequence
                key={scene.id}
                durationInFrames={durationInFrames}
              >
                {scene.narration && <Audio src={staticFile(`scene_${scene.id}.mp3`)} />}
                {scene.brollUrl && <BRollBackground src={scene.brollUrl} style={style} />}
                <NumberedStepsScene
                  heading={scene.heading}
                  content_points={scene.content_points}
                  style={style}
                />
                <Captions captions={scene.captions} style={style} />
              </Series.Sequence>
            );

          default:
            return null;
        }
      })}
      </Series>
      {style.companyWatermark ? (
        <div
          style={{
            position: 'absolute',
            top: 40,
            right: 60,
            color: style.textColor,
            fontSize: 28,
            fontWeight: 'bold',
            opacity: 0.5,
            fontFamily: style.fontFamily,
            zIndex: 1000,
            textShadow: "0px 4px 12px rgba(0,0,0,0.3)"
          }}
        >
          {style.companyWatermark}
        </div>
      ) : (
        <img
          src={staticFile("logo.png")}
          style={{
            position: 'absolute',
            top: 40,
            right: 40,
            height: 60,
            opacity: 0.8,
            zIndex: 1000,
            filter: "drop-shadow(0px 8px 16px rgba(0,0,0,0.5))"
          }}
        />
      )}
    </AbsoluteFill>
  );
};

/**
 * RemotionRoot — Registers the main composition.
 * Duration is automatically calculated from the storyboard.
 */
export const RemotionRoot: React.FC = () => {
  const { fps, width, height } = data.video;
  const totalFrames = getTotalDurationInFrames(data.scenes, fps);

  return (
    <>
      <Composition
        id="AI-Infographic"
        component={InfographicVideo}
        durationInFrames={totalFrames}
        fps={fps}
        width={width}
        height={height}
      />
    </>
  );
};