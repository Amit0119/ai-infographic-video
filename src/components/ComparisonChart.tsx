import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import type { ComparisonSceneProps } from "../types";
import { GlassCard } from "./GlassCard";

/**
 * ComparisonChart — Horizontal paired bar chart (Target vs Actual).
 *
 * Each item gets two horizontal bars stacked vertically:
 * - Gray bar for Target
 * - Colored bar for Actual (green if ≥ target, amber/red if below)
 *
 * Animations:
 * - Title slides in from above
 * - Each item row fades in with staggered delay
 * - Bars grow from left to right with spring physics
 * - Achievement % labels appear after bars finish
 * - Legend fades in at bottom
 */

// ── Layout Constants ─────────────────────────────────────────

const CHART_PADDING = { top: 140, right: 200, bottom: 80, left: 220 };
const ROW_GAP = 24;
const BAR_HEIGHT = 36;
const BAR_PAIR_HEIGHT = BAR_HEIGHT * 2 + 8; // two bars + gap between them
const STAGGER_FRAMES = 8;
const BAR_BORDER_RADIUS = 6;

export const ComparisonChart: React.FC<ComparisonSceneProps> = ({
  title,
  items,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps, width: videoWidth, height: videoHeight } = useVideoConfig();

  // ── Chart Dimensions ───────────────────────────────────────

  const chartWidth = videoWidth - CHART_PADDING.left - CHART_PADDING.right;
  const totalRowHeight =
    items.length * BAR_PAIR_HEIGHT + (items.length - 1) * ROW_GAP;
  const startY =
    CHART_PADDING.top +
    (videoHeight - CHART_PADDING.top - CHART_PADDING.bottom - totalRowHeight) /
      2;

  // Find max value across all targets and actuals for scale
  const maxValue = Math.max(
    ...items.map((i) => Math.max(i.actual, i.target))
  );

  // ── Title Animation ────────────────────────────────────────

  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 80, mass: 0.8 },
  });
  const titleOpacity = titleSpring;
  const titleTranslateY = interpolate(titleSpring, [0, 1], [-30, 0]);

  // Background fade
  const bgOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  // ── Render ─────────────────────────────────────────────────

  return (
    <AbsoluteFill
      style={{
        backgroundColor: style.backgroundColor,
        opacity: bgOpacity,
        fontFamily: style.fontFamily,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <GlassCard style={style} width="90%" height="80%" opacity={titleOpacity} transform={`translateY(${titleTranslateY}px)`}>
      {/* Chart Title */}
      <h2
        style={{
          textAlign: "center",
          fontSize: 44,
          fontWeight: 700,
          color: style.textColor,
          margin: 0,
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </h2>

      {/* SVG Chart Area */}
      <div style={{ flex: 1, position: 'relative' }}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${videoWidth} ${videoHeight}`}
        style={{ position: "absolute", top: -80, left: 0 }}
      >
        {items.map((item, index) => {
          const rowY = startY + index * (BAR_PAIR_HEIGHT + ROW_GAP);

          // Staggered spring for each row
          const rowSpring = spring({
            frame: frame - 12 - index * STAGGER_FRAMES,
            fps,
            config: { damping: 18, stiffness: 60, mass: 0.9 },
          });
          const clampedRow = Math.max(0, Math.min(1, rowSpring));

          // Bar widths
          const targetBarWidth = (item.target / maxValue) * chartWidth;
          const actualBarWidth = (item.actual / maxValue) * chartWidth;

          // Achievement
          const achievementPct = (item.actual / item.target) * 100;
          const isAboveTarget = item.actual >= item.target;
          const barColor = isAboveTarget ? style.accentColor : "#F59E0B";

          // Achievement label appears after bar grows
          const labelOpacity = interpolate(
            clampedRow,
            [0.7, 1],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          // Row label opacity
          const nameOpacity = interpolate(
            clampedRow,
            [0, 0.3],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          return (
            <g key={item.name}>
              {/* Row label (region name) */}
              <text
                x={CHART_PADDING.left - 20}
                y={rowY + BAR_PAIR_HEIGHT / 2 + 6}
                textAnchor="end"
                fill={style.textColor}
                fontSize={24}
                fontWeight={600}
                fontFamily={style.fontFamily}
                opacity={nameOpacity}
              >
                {item.name}
              </text>

              {/* Target bar (top, gray) */}
              <rect
                x={CHART_PADDING.left}
                y={rowY}
                width={targetBarWidth * clampedRow}
                height={BAR_HEIGHT}
                rx={BAR_BORDER_RADIUS}
                ry={BAR_BORDER_RADIUS}
                fill={`${style.subtextColor}30`}
              />

              {/* Target value label */}
              <text
                x={CHART_PADDING.left + targetBarWidth * clampedRow + 12}
                y={rowY + BAR_HEIGHT / 2 + 6}
                fill={style.subtextColor}
                fontSize={18}
                fontWeight={500}
                fontFamily={style.fontFamily}
                opacity={labelOpacity}
              >
                {item.target.toFixed(1)}
              </text>

              {/* Actual bar (bottom, colored) */}
              <rect
                x={CHART_PADDING.left}
                y={rowY + BAR_HEIGHT + 8}
                width={actualBarWidth * clampedRow}
                height={BAR_HEIGHT}
                rx={BAR_BORDER_RADIUS}
                ry={BAR_BORDER_RADIUS}
                fill={barColor}
                opacity={0.85}
              />

              {/* Actual bar glow */}
              <rect
                x={CHART_PADDING.left - 2}
                y={rowY + BAR_HEIGHT + 6}
                width={actualBarWidth * clampedRow + 4}
                height={BAR_HEIGHT + 4}
                rx={BAR_BORDER_RADIUS + 2}
                ry={BAR_BORDER_RADIUS + 2}
                fill={barColor}
                opacity={0.06 * clampedRow}
              />

              {/* Actual value + Achievement % label */}
              <text
                x={CHART_PADDING.left + actualBarWidth * clampedRow + 12}
                y={rowY + BAR_HEIGHT + 8 + BAR_HEIGHT / 2 + 6}
                fill={barColor}
                fontSize={18}
                fontWeight={700}
                fontFamily={style.fontFamily}
                opacity={labelOpacity}
              >
                {item.actual.toFixed(1)}
                {"  "}
                <tspan fill={isAboveTarget ? "#10B981" : "#EF4444"} fontSize={16}>
                  ({achievementPct.toFixed(1)}%)
                </tspan>
              </text>
            </g>
          );
        })}

        {/* Legend */}
        {(() => {
          const legendY = startY + totalRowHeight + 40;
          const legendX = videoWidth / 2 - 120;
          const legendOpacity = interpolate(
            frame,
            [30, 45],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          return (
            <g opacity={legendOpacity}>
              {/* Target legend */}
              <rect
                x={legendX}
                y={legendY}
                width={20}
                height={14}
                rx={3}
                fill={`${style.subtextColor}30`}
              />
              <text
                x={legendX + 28}
                y={legendY + 12}
                fill={style.subtextColor}
                fontSize={16}
                fontFamily={style.fontFamily}
              >
                Target
              </text>

              {/* Actual legend */}
              <rect
                x={legendX + 110}
                y={legendY}
                width={20}
                height={14}
                rx={3}
                fill={style.accentColor}
                opacity={0.85}
              />
              <text
                x={legendX + 138}
                y={legendY + 12}
                fill={style.subtextColor}
                fontSize={16}
                fontFamily={style.fontFamily}
              >
                Actual
              </text>
            </g>
          );
        })()}
      </svg>
      </div>
      </GlassCard>
    </AbsoluteFill>
  );
};
