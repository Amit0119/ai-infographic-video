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
import storyboard from "./data/storyboard.json";
import type { Storyboard, StoryboardScene } from "./types";

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
    <AbsoluteFill
      style={{
        backgroundColor: style.backgroundColor,
      }}
      from={-228}
    >
      <Series>
        {scenes.map((scene) => {
        const durationInFrames = scene.durationInSeconds * fps;

        switch (scene.type) {
          case "title":
            return (
              <Series.Sequence key={scene.id} durationInFrames={durationInFrames}>
                {scene.narration && <Audio src={staticFile(`scene_${scene.id}.mp3`)} />}
                <TitleScene
                  title={scene.title}
                  subtitle={scene.subtitle}
                  style={style}
                />
              </Series.Sequence>
            );

          case "kpi":
            return (
              <Series.Sequence
                key={scene.id}
                durationInFrames={durationInFrames}
              >
                {scene.narration && <Audio src={staticFile(`scene_${scene.id}.mp3`)} />}
                <KPIAnimation
                  metric={scene.metric}
                  value={scene.value}
                  unit={scene.unit}
                  prefix={scene.prefix}
                  growth={scene.growth}
                  growthLabel={scene.growthLabel}
                  style={style}
                />
              </Series.Sequence>
            );

          case "bar_chart":
            return (
              <Series.Sequence
                key={scene.id}
                durationInFrames={durationInFrames}
              >
                {scene.narration && <Audio src={staticFile(`scene_${scene.id}.mp3`)} />}
                <BarChart
                  title={scene.title}
                  chart_data={scene.chart_data!}
                  color={scene.color}
                  style={style}
                />
              </Series.Sequence>
            );

          case "pie_chart":
            return (
              <Series.Sequence
                key={scene.id}
                durationInFrames={durationInFrames}
              >
                {scene.narration && <Audio src={staticFile(`scene_${scene.id}.mp3`)} />}
                <PieChartScene
                  title={scene.title}
                  chart_data={scene.chart_data!}
                  style={style}
                />
              </Series.Sequence>
            );

          case "timeline":
            return (
              <Series.Sequence
                key={scene.id}
                durationInFrames={durationInFrames}
              >
                {scene.narration && <Audio src={staticFile(`scene_${scene.id}.mp3`)} />}
                <TimelineScene
                  title={scene.title}
                  chart_data={scene.chart_data!}
                  style={style}
                />
              </Series.Sequence>
            );

          case "line_chart":
            return (
              <Series.Sequence
                key={scene.id}
                durationInFrames={durationInFrames}
              >
                {scene.narration && <Audio src={staticFile(`scene_${scene.id}.mp3`)} />}
                <LineChart
                  title={scene.title}
                  chart_data={scene.chart_data!}
                  targetItems={scene.targetItems}
                  color={scene.color}
                  style={style}
                />
              </Series.Sequence>
            );

          case "highlight":
            return (
              <Series.Sequence
                key={scene.id}
                durationInFrames={durationInFrames}
              >
                {scene.narration && <Audio src={staticFile(`scene_${scene.id}.mp3`)} />}
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
              </Series.Sequence>
            );

          case "comparison":
            return (
              <Series.Sequence
                key={scene.id}
                durationInFrames={durationInFrames}
              >
                {scene.narration && <Audio src={staticFile(`scene_${scene.id}.mp3`)} />}
                <ComparisonChart
                  title={scene.title}
                  items={scene.items}
                  style={style}
                />
              </Series.Sequence>
            );

          case "bullet_points":
            return (
              <Series.Sequence
                key={scene.id}
                durationInFrames={durationInFrames}
              >
                {scene.narration && <Audio src={staticFile(`scene_${scene.id}.mp3`)} />}
                <BulletPointsScene
                  heading={scene.heading}
                  content_points={scene.content_points}
                  style={style}
                />
              </Series.Sequence>
            );

          case "numbered_steps":
            return (
              <Series.Sequence
                key={scene.id}
                durationInFrames={durationInFrames}
              >
                {scene.narration && <Audio src={staticFile(`scene_${scene.id}.mp3`)} />}
                <NumberedStepsScene
                  heading={scene.heading}
                  content_points={scene.content_points}
                  style={style}
                />
              </Series.Sequence>
            );

          default:
            return null;
        }
      })}
      </Series>
      {style.companyWatermark && (
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            right: 60,
            color: style.textColor,
            fontSize: 32,
            fontWeight: 'bold',
            opacity: 0.2,
            fontFamily: style.fontFamily,
            zIndex: 1000,
          }}
        >
          {style.companyWatermark}
        </div>
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