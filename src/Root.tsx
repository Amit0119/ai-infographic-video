import React from "react";
import { Composition, Audio, staticFile, AbsoluteFill } from "remotion";
import { getAudioDurationInSeconds } from "@remotion/media-utils";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
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
import { HeatMap } from "./components/HeatMap";
import { HierarchyPyramid } from "./components/HierarchyPyramid";
import { SplitScreen } from "./components/SplitScreen";
import { DashboardUI } from "./components/DashboardUI";
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
      from={-394}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at center, transparent 30%, ${style.backgroundColor} 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

// ── Cast the imported JSON to our typed Storyboard ───────────
const data = storyboard as unknown as Storyboard;

/**
 * Calculates the total video duration in frames from all scenes.
 */
const getTotalDurationInFrames = (scenes: StoryboardScene[], fps: number) => {
  const transitionFrames = Math.round(fps * 1.5); // 1.5s transition overlap
  const total = scenes.reduce(
    (total, scene) => total + ((scene as any).dynamicDuration || scene.durationInSeconds * fps),
    0
  );
  // Subtract the overlapping frames so the total duration is correct
  const overlaps = Math.max(0, scenes.length - 1) * transitionFrames;
  return total - overlaps;
};

/**
 * InfographicVideo — Sequentially composes all storyboard scenes
 * using Remotion's <TransitionSeries> component.
 */
const InfographicVideo: React.FC<{ data: Storyboard }> = ({ data: compData }) => {
  const { fps } = compData.video;
  const { style, scenes } = compData;
  const frame = useCurrentFrame();
  const totalFrames = getTotalDurationInFrames(scenes, fps);

  // Pillar 3: Continuous Cinematic Panning over the entire video duration
  const globalScale = interpolate(frame, [0, totalFrames], [1.0, 1.05], { extrapolateRight: "clamp" });
  const globalX = interpolate(frame, [0, totalFrames], [0, -30], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        transform: `scale(${globalScale}) translateX(${globalX}px)`,
        transformOrigin: "center center",
      }}
    >
      <Background style={style} />

      {/* Background Music with ducked volume so it doesn't overpower TTS */}
      <Audio src={staticFile("bgm.mp3")} volume={0.12} loop />

      <TransitionSeries>
        {scenes.flatMap((scene, index) => {
          // dynamicDuration added via calculateMetadata, fallback to static
          const durationInFrames = (scene as any).dynamicDuration || scene.durationInSeconds * fps;

          switch (scene.type) {
            case "title":
              return [
                index > 0 ? (
                  <TransitionSeries.Transition
                    key={`trans-${scene.id}`}
                    presentation={slide()}
                    timing={linearTiming({ durationInFrames: Math.round(fps * 1.5) })}
                  />
                ) : null,
                <TransitionSeries.Sequence key={scene.id} durationInFrames={durationInFrames}>
                  {scene.narration && <Audio src={staticFile(`scene_${scene.id}.mp3`)} />}
                  {scene.brollUrl && <BRollBackground src={scene.brollUrl} style={style} />}
                  <TitleScene title={scene.title} subtitle={scene.subtitle} style={style} />
                  <Captions captions={scene.captions} style={style} />
                </TransitionSeries.Sequence>,
              ];

            case "kpi":
              return [
                index > 0 ? (
                  <TransitionSeries.Transition
                    key={`trans-${scene.id}`}
                    presentation={slide()}
                    timing={linearTiming({ durationInFrames: Math.round(fps * 1.5) })}
                  />
                ) : null,
                <TransitionSeries.Sequence key={scene.id} durationInFrames={durationInFrames}>
                  {scene.narration && <Audio src={staticFile(`scene_${scene.id}.mp3`)} />}
                  {scene.brollUrl && <BRollBackground src={scene.brollUrl} style={style} />}
                  <KPIAnimation
                    metric={scene.metric}
                    value={scene.value}
                    unit={scene.unit}
                    prefix={scene.prefix}
                    growth={scene.growth}
                    growthLabel={scene.growthLabel}
                    data_points={(scene as any).data_points}
                    style={style}
                  />
                  <Captions captions={scene.captions} style={style} />
                </TransitionSeries.Sequence>,
              ];

            case "bar_chart":
              return [
                index > 0 ? (
                  <TransitionSeries.Transition
                    key={`trans-${scene.id}`}
                    presentation={slide()}
                    timing={linearTiming({ durationInFrames: Math.round(fps * 1.5) })}
                  />
                ) : null,
                <TransitionSeries.Sequence key={scene.id} durationInFrames={durationInFrames}>
                  {scene.narration && <Audio src={staticFile(`scene_${scene.id}.mp3`)} />}
                  {scene.brollUrl && <BRollBackground src={scene.brollUrl} style={style} />}
                  <BarChart
                    title={scene.title}
                    chart_data={scene.chart_data!}
                    color={scene.color}
                    style={style}
                  />
                  <Captions captions={scene.captions} style={style} />
                </TransitionSeries.Sequence>,
              ];

            case "pie_chart":
              return [
                index > 0 ? (
                  <TransitionSeries.Transition
                    key={`trans-${scene.id}`}
                    presentation={slide()}
                    timing={linearTiming({ durationInFrames: Math.round(fps * 1.5) })}
                  />
                ) : null,
                <TransitionSeries.Sequence key={scene.id} durationInFrames={durationInFrames}>
                  {scene.narration && <Audio src={staticFile(`scene_${scene.id}.mp3`)} />}
                  {scene.brollUrl && <BRollBackground src={scene.brollUrl} style={style} />}
                  <PieChartScene title={scene.title} chart_data={scene.chart_data!} style={style} />
                  <Captions captions={scene.captions} style={style} />
                </TransitionSeries.Sequence>,
              ];

            case "timeline":
              return [
                index > 0 ? (
                  <TransitionSeries.Transition
                    key={`trans-${scene.id}`}
                    presentation={slide()}
                    timing={linearTiming({ durationInFrames: Math.round(fps * 1.5) })}
                  />
                ) : null,
                <TransitionSeries.Sequence key={scene.id} durationInFrames={durationInFrames}>
                  {scene.narration && <Audio src={staticFile(`scene_${scene.id}.mp3`)} />}
                  {scene.brollUrl && <BRollBackground src={scene.brollUrl} style={style} />}
                  <TimelineScene title={scene.title} chart_data={scene.chart_data!} style={style} />
                  <Captions captions={scene.captions} style={style} />
                </TransitionSeries.Sequence>,
              ];

            case "line_chart":
              return [
                index > 0 ? (
                  <TransitionSeries.Transition
                    key={`trans-${scene.id}`}
                    presentation={slide()}
                    timing={linearTiming({ durationInFrames: Math.round(fps * 1.5) })}
                  />
                ) : null,
                <TransitionSeries.Sequence key={scene.id} durationInFrames={durationInFrames}>
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
                </TransitionSeries.Sequence>,
              ];

            case "highlight":
              return [
                index > 0 ? (
                  <TransitionSeries.Transition
                    key={`trans-${scene.id}`}
                    presentation={slide()}
                    timing={linearTiming({ durationInFrames: Math.round(fps * 1.5) })}
                  />
                ) : null,
                <TransitionSeries.Sequence key={scene.id} durationInFrames={durationInFrames}>
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
                </TransitionSeries.Sequence>,
              ];

            case "comparison":
              return [
                index > 0 ? (
                  <TransitionSeries.Transition
                    key={`trans-${scene.id}`}
                    presentation={slide()}
                    timing={linearTiming({ durationInFrames: Math.round(fps * 1.5) })}
                  />
                ) : null,
                <TransitionSeries.Sequence key={scene.id} durationInFrames={durationInFrames}>
                  {scene.narration && <Audio src={staticFile(`scene_${scene.id}.mp3`)} />}
                  {scene.brollUrl && <BRollBackground src={scene.brollUrl} style={style} />}
                  <ComparisonChart
                    title={scene.title}
                    items={scene.items}
                    data_points={(scene as any).data_points}
                    style={style}
                  />
                  <Captions captions={scene.captions} style={style} />
                </TransitionSeries.Sequence>,
              ];

            case "bullet_points":
              return [
                index > 0 ? (
                  <TransitionSeries.Transition
                    key={`trans-${scene.id}`}
                    presentation={slide()}
                    timing={linearTiming({ durationInFrames: Math.round(fps * 1.5) })}
                  />
                ) : null,
                <TransitionSeries.Sequence key={scene.id} durationInFrames={durationInFrames}>
                  {scene.narration && <Audio src={staticFile(`scene_${scene.id}.mp3`)} />}
                  {scene.brollUrl && <BRollBackground src={scene.brollUrl} style={style} />}
                  <BulletPointsScene
                    heading={scene.heading}
                    content_points={scene.content_points}
                    style={style}
                  />
                  <Captions captions={scene.captions} style={style} />
                </TransitionSeries.Sequence>,
              ];

            case "numbered_steps":
              return [
                index > 0 ? (
                  <TransitionSeries.Transition
                    key={`trans-${scene.id}`}
                    presentation={slide()}
                    timing={linearTiming({ durationInFrames: Math.round(fps * 1.5) })}
                  />
                ) : null,
                <TransitionSeries.Sequence key={scene.id} durationInFrames={durationInFrames}>
                  {scene.narration && <Audio src={staticFile(`scene_${scene.id}.mp3`)} />}
                  {scene.brollUrl && <BRollBackground src={scene.brollUrl} style={style} />}
                  <NumberedStepsScene
                    heading={scene.heading}
                    content_points={scene.content_points}
                    style={style}
                  />
                  <Captions captions={scene.captions} style={style} />
                </TransitionSeries.Sequence>,
              ];

            case "heat_map":
              return [
                index > 0 ? (
                  <TransitionSeries.Transition
                    key={`trans-${scene.id}`}
                    presentation={slide()}
                    timing={linearTiming({ durationInFrames: Math.round(fps * 1.5) })}
                  />
                ) : null,
                <TransitionSeries.Sequence key={scene.id} durationInFrames={durationInFrames}>
                  {scene.narration && <Audio src={staticFile(`scene_${scene.id}.mp3`)} />}
                  {scene.brollUrl && <BRollBackground src={scene.brollUrl} style={style} />}
                  <HeatMap
                    heading={(scene as any).heading}
                    chart_data={scene.chart_data as any}
                    data_points={(scene as any).data_points}
                    style={style}
                  />
                  <Captions captions={scene.captions} style={style} />
                </TransitionSeries.Sequence>,
              ];

            case "hierarchy_pyramid":
              return [
                index > 0 ? (
                  <TransitionSeries.Transition
                    key={`trans-${scene.id}`}
                    presentation={slide()}
                    timing={linearTiming({ durationInFrames: Math.round(fps * 1.5) })}
                  />
                ) : null,
                <TransitionSeries.Sequence key={scene.id} durationInFrames={durationInFrames}>
                  {scene.narration && <Audio src={staticFile(`scene_${scene.id}.mp3`)} />}
                  {scene.brollUrl && <BRollBackground src={scene.brollUrl} style={style} />}
                  <HierarchyPyramid
                    heading={(scene as any).heading}
                    content_points={(scene as any).content_points}
                    data_points={(scene as any).data_points}
                    style={style}
                  />
                  <Captions captions={scene.captions} style={style} />
                </TransitionSeries.Sequence>,
              ];

            case "split_screen":
              return [
                index > 0 ? (
                  <TransitionSeries.Transition
                    key={`trans-${scene.id}`}
                    presentation={slide()}
                    timing={linearTiming({ durationInFrames: Math.round(fps * 1.5) })}
                  />
                ) : null,
                <TransitionSeries.Sequence key={scene.id} durationInFrames={durationInFrames}>
                  {scene.narration && <Audio src={staticFile(`scene_${scene.id}.mp3`)} />}
                  {scene.brollUrl && <BRollBackground src={scene.brollUrl} style={style} />}
                  <SplitScreen
                    title={(scene as any).title}
                    left_content={scene.left_content as any}
                    right_content={scene.right_content as any}
                    data_points={(scene as any).data_points}
                    style={style}
                  />
                  <Captions captions={scene.captions} style={style} />
                </TransitionSeries.Sequence>,
              ];

            case "dashboard_ui":
              return [
                index > 0 ? (
                  <TransitionSeries.Transition
                    key={`trans-${scene.id}`}
                    presentation={slide()}
                    timing={linearTiming({ durationInFrames: Math.round(fps * 1.5) })}
                  />
                ) : null,
                <TransitionSeries.Sequence key={scene.id} durationInFrames={durationInFrames}>
                  {scene.narration && <Audio src={staticFile(`scene_${scene.id}.mp3`)} />}
                  {scene.brollUrl && <BRollBackground src={scene.brollUrl} style={style} />}
                  <DashboardUI
                    title={(scene as any).title || (scene as any).section_header}
                    section_header={(scene as any).section_header}
                    chart_data={scene.chart_data as any}
                    top_kpi_controls={(scene as any).top_kpi_controls}
                    main_chart={(scene as any).main_chart}
                    side_insight_panel={(scene as any).side_insight_panel}
                    data_points={(scene as any).data_points}
                    style={style}
                  />
                  <Captions captions={scene.captions} style={style} />
                </TransitionSeries.Sequence>,
              ];

            default:
              return null;
          }
        })}
      </TransitionSeries>

      {style.companyWatermark ? (
        <div
          style={{
            position: "absolute",
            top: 40,
            right: 60,
            color: style.textColor,
            fontSize: 28,
            fontWeight: "bold",
            opacity: 0.5,
            fontFamily: style.fontFamily,
            zIndex: 1000,
            textShadow: "0px 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          {style.companyWatermark}
        </div>
      ) : (
        <img
          src={staticFile("logo.png")}
          style={{
            position: "absolute",
            bottom: 24,
            right: 40,
            height: 60,
            opacity: 0.8,
            zIndex: 1000,
            filter: "drop-shadow(0px 8px 16px rgba(0,0,0,0.5))",
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
  const defaultTotalFrames = getTotalDurationInFrames(data.scenes, fps);

  return (
    <>
      <Composition
        id="AI-Infographic"
        component={InfographicVideo}
        durationInFrames={defaultTotalFrames}
        fps={fps}
        width={width}
        height={height}
        defaultProps={{ data: data }}
        calculateMetadata={async ({ props }) => {
          const clonedData = JSON.parse(JSON.stringify(props.data));
          const currentFps = clonedData.video.fps || 30;
          for (const scene of clonedData.scenes) {
            let dynamicDuration = scene.durationInSeconds * currentFps;
            if (scene.narration) {
              try {
                const url = staticFile(`scene_${scene.id}.mp3`);
                const audioDuration = await getAudioDurationInSeconds(url);
                dynamicDuration = Math.ceil(audioDuration * currentFps) + 15;
              } catch (e) {
                console.error(`Failed to get duration for scene ${scene.id}`, e);
              }
            }
            scene.dynamicDuration = dynamicDuration;
          }
          return {
            durationInFrames: getTotalDurationInFrames(clonedData.scenes, currentFps),
            props: { ...props, data: clonedData },
          };
        }}
      />
    </>
  );
};