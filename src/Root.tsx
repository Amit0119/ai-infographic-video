import { Composition, Series, Audio, staticFile, AbsoluteFill } from "remotion";
import { TitleScene } from "./components/TitleScene";
import { KPIAnimation } from "./components/KPIAnimation";
import { BarChart } from "./components/BarChart";
import { LineChart } from "./components/LineChart";
import { HighlightCard } from "./components/HighlightCard";
import { ComparisonChart } from "./components/ComparisonChart";
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

  // Map backend JSON style keys to expected React props for dark theme
  const resolvedStyle = {
    ...style,
    textColor: (style as any).textPrimary || '#ffffff',
    subtextColor: (style as any).textSecondary || '#e2e8f0',
    primaryColor: (style as any).primary || '#38bdf8',
    secondaryColor: (style as any).secondary || '#34d399',
    accentColor: (style as any).accentColor || '#facc15',
    backgroundColor: (style as any).backgroundColor || (style as any).background || '#0f172a',
    companyWatermark: (style as any).companyWatermark || '',
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor: resolvedStyle.backgroundColor,
      }}
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
                  style={resolvedStyle}
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
                  style={resolvedStyle}
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
                  items={scene.items}
                  color={scene.color}
                  style={resolvedStyle}
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
                  items={scene.items}
                  targetItems={scene.targetItems}
                  color={scene.color}
                  style={resolvedStyle}
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
                  style={resolvedStyle}
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
                  style={resolvedStyle}
                />
              </Series.Sequence>
            );

          default:
            return null;
        }
      })}
      </Series>
      {resolvedStyle.companyWatermark && (
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            right: 60,
            color: resolvedStyle.textColor,
            fontSize: 32,
            fontWeight: 'bold',
            opacity: 0.2,
            fontFamily: (resolvedStyle as any).fontFamily || 'Inter',
            zIndex: 1000
          }}
        >
          {resolvedStyle.companyWatermark}
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