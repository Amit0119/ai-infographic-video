import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import type { BarChartSceneProps } from "../types";

/**
 * BarChart — Fully dynamic SVG bar chart with spring animations.
 *
 * Completely replaces the old recharts-based implementation.
 * Each bar grows from 0 → actual value using Remotion's spring()
 * with staggered delays so bars cascade in from left to right.
 *
 * Animations:
 * - Title slides in from above
 * - Each bar grows upward with a staggered spring
 * - Value labels fade in above each bar after it finishes growing
 * - X-axis labels fade in below each bar
 */

// ── Layout Constants ─────────────────────────────────────────

const CHART_PADDING = { top: 140, right: 120, bottom: 100, left: 120 };
const BAR_GAP_RATIO = 0.3; // Gap between bars as a fraction of bar width
const BAR_BORDER_RADIUS = 8;
const STAGGER_FRAMES = 6; // Delay between each bar's animation start

export const BarChart: React.FC<BarChartSceneProps> = ({
  title,
  items,
  color,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps, width: videoWidth, height: videoHeight } = useVideoConfig();

  // ── Chart Dimensions ───────────────────────────────────────

  const chartWidth = videoWidth - CHART_PADDING.left - CHART_PADDING.right;
  const chartHeight = videoHeight - CHART_PADDING.top - CHART_PADDING.bottom;

  const maxValue = Math.max(...items.map((item) => item.value));
  // Add 20% headroom above the tallest bar for value labels
  const yMax = maxValue * 1.2;

  const totalBars = items.length;
  const barWidth = chartWidth / (totalBars + (totalBars - 1) * BAR_GAP_RATIO);
  const gapWidth = barWidth * BAR_GAP_RATIO;

  const barColor = color || style.primaryColor;

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
      }}
    >
      {/* Subtle gradient backdrop */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, ${style.primaryColor}08 0%, transparent 50%)`,
          pointerEvents: "none",
        }}
      />

      {/* Chart Title */}
      <h2
        style={{
          position: "absolute",
          top: 40,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 44,
          fontWeight: 700,
          color: style.textColor,
          margin: 0,
          letterSpacing: "-0.01em",
          opacity: titleOpacity,
          transform: `translateY(${titleTranslateY}px)`,
        }}
      >
        {title}
      </h2>

      {/* SVG Chart Area */}
      <svg
        width={videoWidth}
        height={videoHeight}
        viewBox={`0 0 ${videoWidth} ${videoHeight}`}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        {/* Horizontal grid lines */}
        {[0.25, 0.5, 0.75, 1.0].map((fraction) => {
          const y =
            CHART_PADDING.top + chartHeight - chartHeight * fraction;
          return (
            <line
              key={fraction}
              x1={CHART_PADDING.left}
              y1={y}
              x2={CHART_PADDING.left + chartWidth}
              y2={y}
              stroke={`${style.subtextColor}20`}
              strokeWidth={1}
              strokeDasharray="6 4"
            />
          );
        })}

        {/* X-axis baseline */}
        <line
          x1={CHART_PADDING.left}
          y1={CHART_PADDING.top + chartHeight}
          x2={CHART_PADDING.left + chartWidth}
          y2={CHART_PADDING.top + chartHeight}
          stroke={`${style.subtextColor}40`}
          strokeWidth={2}
        />

        {/* Bars + Labels */}
        {items.map((item, index) => {
          // Staggered spring for each bar
          const barSpring = spring({
            frame: frame - 10 - index * STAGGER_FRAMES,
            fps,
            config: { damping: 18, stiffness: 60, mass: 0.9 },
          });
          const clampedBarSpring = Math.max(0, Math.min(1, barSpring));

          // Bar geometry
          const x =
            CHART_PADDING.left + index * (barWidth + gapWidth);
          const fullBarHeight = (item.value / yMax) * chartHeight;
          const currentBarHeight = fullBarHeight * clampedBarSpring;
          const y =
            CHART_PADDING.top + chartHeight - currentBarHeight;

          // Value label (appears after bar is ~80% grown)
          const valueLabelOpacity = interpolate(
            clampedBarSpring,
            [0.7, 1],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          // X-axis label opacity
          const labelOpacity = interpolate(
            clampedBarSpring,
            [0, 0.3],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          // Generate a slightly lighter shade for gradient
          const gradientId = `bar-gradient-${index}`;

          return (
            <g key={item.name}>
              {/* Bar gradient definition */}
              <defs>
                <linearGradient
                  id={gradientId}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={barColor} stopOpacity={1} />
                  <stop
                    offset="100%"
                    stopColor={barColor}
                    stopOpacity={0.7}
                  />
                </linearGradient>
              </defs>

              {/* Bar body */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={currentBarHeight}
                rx={BAR_BORDER_RADIUS}
                ry={BAR_BORDER_RADIUS}
                fill={`url(#${gradientId})`}
              />

              {/* Subtle glow behind bar */}
              <rect
                x={x - 4}
                y={y - 4}
                width={barWidth + 8}
                height={currentBarHeight + 8}
                rx={BAR_BORDER_RADIUS + 4}
                ry={BAR_BORDER_RADIUS + 4}
                fill={barColor}
                opacity={0.08 * clampedBarSpring}
              />

              {/* Value label above bar */}
              <text
                x={x + barWidth / 2}
                y={y - 16}
                textAnchor="middle"
                fill={style.textColor}
                fontSize={28}
                fontWeight={700}
                fontFamily={style.fontFamily}
                opacity={valueLabelOpacity}
              >
                {(item.value * clampedBarSpring).toFixed(1)}
              </text>

              {/* X-axis label below bar */}
              <text
                x={x + barWidth / 2}
                y={CHART_PADDING.top + chartHeight + 40}
                textAnchor="middle"
                fill={style.subtextColor}
                fontSize={22}
                fontWeight={500}
                fontFamily={style.fontFamily}
                opacity={labelOpacity}
              >
                {item.name}
              </text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
