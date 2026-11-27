import React from "react";
import { Composition, Audio, staticFile, AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { getAudioDurationInSeconds } from "@remotion/media-utils";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { HeroHookScene } from "./components/explainer/HeroHookScene";
import { SplitCompareScene } from "./components/explainer/SplitCompareScene";
import { StepFlowScene } from "./components/explainer/StepFlowScene";
import { ChecklistOutroScene } from "./components/explainer/ChecklistOutroScene";
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

// Load Inter Font dynamically
import { loadFont } from "@remotion/google-fonts/Inter";
try {
  loadFont();
} catch (e) {
  console.log("Font already loaded or failed to load");
}

const EXPLAINER_SCENE_TYPES = new Set([
  "hero_hook",
  "split_compare",
  "step_flow",
  "checklist_outro",
]);

const isExplainerStoryboard = (scenes: StoryboardScene[]) =>
  scenes.some((s) => EXPLAINER_SCENE_TYPES.has(s.type));

const Background = ({ style, isExplainer }: { style: SceneStyle; isExplainer: boolean }) => {
  const frame = useCurrentFrame();

  if (isExplainer || style.theme === "clean_light") {
    const driftA = Math.sin(frame / 90) * 40;
    const driftB = Math.cos(frame / 110) * 45;
    const bg = style.backgroundColor || "#F8FAFC";
    const primary = style.primaryColor || "#2563EB";
    const accent = style.accentColor || "#10B981";

    return (
      <AbsoluteFill style={{ backgroundColor: bg, overflow: "hidden", zIndex: 0 }}>
        {/* Soft Ambient Top-Right Orb */}
        <div
          style={{
            position: "absolute",
            top: -180 + driftA,
            right: -140 - driftB,
            width: 680,
            height: 680,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${primary}18 0%, transparent 70%)`,
          }}
        />
        {/* Soft Ambient Bottom-Left Orb */}
        <div
          style={{
            position: "absolute",
            bottom: -220 - driftA,
            left: -160 + driftB,
            width: 720,
            height: 720,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${accent}18 0%, transparent 70%)`,
          }}
        />
        {/* Very Subtle Dot Pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(rgba(15, 23, 42, 0.055) 1.5px, transparent 1.5px)",
            backgroundSize: "38px 38px",
          }}
        />
      </AbsoluteFill>
    );
  }

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

const data = storyboard as unknown as Storyboard;

const getTotalDurationInFrames = (scenes: StoryboardScene[], fps: number) => {
  const isExplainer = isExplainerStoryboard(scenes);
  const transitionFrames = Math.round(fps * (isExplainer ? 0.5 : 1.5));
  const total = scenes.reduce(
    (sum, scene) => sum + ((scene as any).dynamicDuration || Math.round(scene.durationInSeconds * fps)),
    0
  );
  const overlaps = Math.max(0, scenes.length - 1) * transitionFrames;
  return Math.max(1, total - overlaps);
};

const InfographicVideo: React.FC<{ data: Storyboard }> = ({ data: compData }) => {
  const { fps } = compData.video;
  const { style, scenes } = compData;
  const frame = useCurrentFrame();
  const totalFrames = getTotalDurationInFrames(scenes, fps);

  const isExplainer = isExplainerStoryboard(scenes);
  const hasDashboardUI = scenes.some((s) => s.type === "dashboard_ui");
  const transitionDuration = Math.round(fps * (isExplainer ? 0.5 : 1.5));

  const globalScale =
    hasDashboardUI || isExplainer
      ? 1.0
      : interpolate(frame, [0, totalFrames], [1.0, 1.03], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        transform: `scale(${globalScale})`,
        transformOrigin: "center center",
      }}
    >
      <Background style={style} isExplainer={isExplainer} />

      <Audio src={staticFile("bgm.mp3")} volume={0.12} loop />

      <TransitionSeries>
        {scenes.flatMap((scene, index) => {
          const durationInFrames =
            (scene as any).dynamicDuration || Math.round(scene.durationInSeconds * fps);

          const transitionEl =
            index > 0 ? (
              <TransitionSeries.Transition
                key={`trans-${scene.id}`}
                presentation={slide({ direction: "from-right" })}
                timing={linearTiming({ durationInFrames: transitionDuration })}
              />
            ) : null;

          switch (scene.type) {
            case "hero_hook":
              return [
                transitionEl,
                <TransitionSeries.Sequence key={scene.id} durationInFrames={durationInFrames}>
                  {scene.narration && <Audio src={staticFile(`scene_${scene.id}.mp3`)} />}
                  <HeroHookScene
                    badge={scene.badge}
                    headline={scene.headline}
                    tagline={scene.tagline}
                    icon={scene.icon}
                    style={style}
                  />
                </TransitionSeries.Sequence>,
              ];

            case "split_compare":
              return [
                transitionEl,
                <TransitionSeries.Sequence key={scene.id} durationInFrames={durationInFrames}>
                  {scene.narration && <Audio src={staticFile(`scene_${scene.id}.mp3`)} />}
                  <SplitCompareScene
                    headline={scene.headline}
                    left={scene.left}
                    right={scene.right}
                    style={style}
                  />
                </TransitionSeries.Sequence>,
              ];

            case "step_flow":
              return [
                transitionEl,
                <TransitionSeries.Sequence key={scene.id} durationInFrames={durationInFrames}>
                  {scene.narration && <Audio src={staticFile(`scene_${scene.id}.mp3`)} />}
                  <StepFlowScene
                    headline={scene.headline}
                    steps={scene.steps}
                    style={style}
                  />
                </TransitionSeries.Sequence>,
              ];

            case "checklist_outro":
              return [
                transitionEl,
                <TransitionSeries.Sequence key={scene.id} durationInFrames={durationInFrames}>
                  {scene.narration && <Audio src={staticFile(`scene_${scene.id}.mp3`)} />}
                  <ChecklistOutroScene
                    headline={scene.headline}
                    items={scene.items}
                    cta_text={scene.cta_text}
                    icon={scene.icon}
                    style={style}
                  />
                </TransitionSeries.Sequence>,
              ];

            case "title":
              return [
                transitionEl,
                <TransitionSeries.Sequence key={scene.id} durationInFrames={durationInFrames}>
                  {scene.narration && <Audio src={staticFile(`scene_${scene.id}.mp3`)} />}
                  {scene.brollUrl && <BRollBackground src={scene.brollUrl} style={style} />}
                  <TitleScene title={scene.title} subtitle={scene.subtitle} style={style} />
                  <Captions captions={scene.captions} style={style} />
                </TransitionSeries.Sequence>,
              ];

            case "kpi":
              return [
                transitionEl,
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
                transitionEl,
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
                transitionEl,
                <TransitionSeries.Sequence key={scene.id} durationInFrames={durationInFrames}>
                  {scene.narration && <Audio src={staticFile(`scene_${scene.id}.mp3`)} />}
                  {scene.brollUrl && <BRollBackground src={scene.brollUrl} style={style} />}
                  <PieChartScene title={scene.title} chart_data={scene.chart_data!} style={style} />
                  <Captions captions={scene.captions} style={style} />
                </TransitionSeries.Sequence>,
              ];

            case "timeline":
              return [
                transitionEl,
                <TransitionSeries.Sequence key={scene.id} durationInFrames={durationInFrames}>
                  {scene.narration && <Audio src={staticFile(`scene_${scene.id}.mp3`)} />}
                  {scene.brollUrl && <BRollBackground src={scene.brollUrl} style={style} />}
                  <TimelineScene title={scene.title} chart_data={scene.chart_data!} style={style} />
                  <Captions captions={scene.captions} style={style} />
                </TransitionSeries.Sequence>,
              ];

            case "line_chart":
              return [
                transitionEl,
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
                transitionEl,
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
                transitionEl,
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
                transitionEl,
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
                transitionEl,
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
                transitionEl,
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
                transitionEl,
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
                transitionEl,
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
                transitionEl,
                <TransitionSeries.Sequence key={scene.id} durationInFrames={durationInFrames}>
                  {scene.narration && <Audio src={staticFile(`scene_${scene.id}.mp3`)} />}
                  {scene.brollUrl && <BRollBackground src={scene.brollUrl} style={style} />}
                  <DashboardUI
                    title={(scene as any).title || (scene as any).section_header}
                    section_header={(scene as any).section_header}
                    layout_mode={(scene as any).layout_mode}
                    chart_data={scene.chart_data as any}
                    top_kpi_controls={(scene as any).top_kpi_controls}
                    main_chart={(scene as any).main_chart}
                    side_insight_panel={(scene as any).side_insight_panel}
                    blueprint_meta={(scene as any).blueprint_meta}
                    blueprint_steps={(scene as any).blueprint_steps}
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

      {isExplainer && style.companyWatermark && (
        <div
          style={{
            position: "absolute",
            top: 34,
            right: 48,
            padding: "8px 20px",
            borderRadius: 999,
            backgroundColor: "rgba(255, 255, 255, 0.82)",
            border: "1px solid rgba(15, 23, 42, 0.08)",
            color: style.textColor || "#0F172A",
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: "0.02em",
            fontFamily: style.fontFamily || "Inter, sans-serif",
            zIndex: 1000,
            boxShadow: "0 4px 14px rgba(15, 23, 42, 0.06)",
          }}
        >
          {style.companyWatermark}
        </div>
      )}

      {!hasDashboardUI && !isExplainer && (
        style.companyWatermark ? (
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
        )
      )}
    </AbsoluteFill>
  );
};

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
            let dynamicDuration = Math.round(scene.durationInSeconds * currentFps);
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