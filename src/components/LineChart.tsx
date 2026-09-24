import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import type { LineChartSceneProps } from "../types";

/**
 * LineChart — Animated SVG line chart with gradient area fill.
 *
 * Animations:
 * - Title slides down from above
 * - Line draws progressively from left to right
 * - Dots appear at each data point as the line reaches them
 * - Value labels fade in above dots
 * - Optional dashed target line draws simultaneously
 * - Gradient area fill fades in beneath the actual line
 */

// ── Layout Constants ─────────────────────────────────────────

const CHART_PADDING = { top: 140, right: 100, bottom: 100, left: 100 };

export const LineChart: React.FC<LineChartSceneProps> = ({
  title,
  chart_data,
  targetItems,
  color,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps, width: videoWidth, height: videoHeight } = useVideoConfig();

  // ── Chart Dimensions ───────────────────────────────────────

  const chartWidth = videoWidth - CHART_PADDING.left - CHART_PADDING.right;
  const chartHeight = videoHeight - CHART_PADDING.top - CHART_PADDING.bottom;

  // Merge all values to find Y-axis range
  const allValues = [
    ...chart_data.map((i) => i.value),
    ...(targetItems || []).map((i) => i.value),
  ];
  const minValue = Math.min(...allValues) * 0.85;
  const maxValue = Math.max(...allValues) * 1.1;
  const valueRange = maxValue - minValue;

  const lineColor = color || style.primaryColor;
  const targetColor = style.subtextColor;

  // ── Helper: Map data to SVG coordinates ────────────────────

  const getX = (index: number) =>
    CHART_PADDING.left + (index / (chart_data.length - 1)) * chartWidth;

  const getY = (value: number) =>
    CHART_PADDING.top +
    chartHeight -
    ((value - minValue) / valueRange) * chartHeight;

  // ── Build SVG path strings ─────────────────────────────────

  const buildLinePath = (data: typeof chart_data) =>
    data
      .map((item, i) => {
        const x = getX(i);
        const y = getY(item.value);
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");

  const buildAreaPath = (data: typeof chart_data) => {
    const linePath = buildLinePath(data);
    const lastX = getX(data.length - 1);
    const firstX = getX(0);
    const bottomY = CHART_PADDING.top + chartHeight;
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  const actualPath = buildLinePath(chart_data);
  const areaPath = buildAreaPath(chart_data);
  const targetPath = targetItems ? buildLinePath(targetItems) : "";

  // ── Animation: Progressive line draw ───────────────────────

  // Calculate approximate total path length for stroke animation
  let totalPathLength = 0;
  for (let i = 1; i < chart_data.length; i++) {
    const dx = getX(i) - getX(i - 1);
    const dy = getY(chart_data[i].value) - getY(chart_data[i - 1].value);
    totalPathLength += Math.sqrt(dx * dx + dy * dy);
  }

  // Line draws over frames 15 → end-30 (leave time for labels)
  const drawProgress = spring({
    frame: frame - 15,
    fps,
    config: { damping: 40, stiffness: 20, mass: 1.5 },
  });
  const clampedDraw = Math.max(0, Math.min(1, drawProgress));

  const strokeOffset = totalPathLength * (1 - clampedDraw);

  // ── Title Animation ────────────────────────────────────────

  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 80, mass: 0.8 },
  });
  const titleOpacity = titleSpring;
  const titleTranslateY = interpolate(titleSpring, [0, 1], [-30, 0]);

  // ── Background fade ────────────────────────────────────────

  const bgOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  // ── Area fill opacity (fades in as line completes) ─────────

  const areaOpacity = interpolate(clampedDraw, [0.3, 1], [0, 0.15], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Grid lines ─────────────────────────────────────────────

  const gridLineCount = 5;
  const gridValues = Array.from({ length: gridLineCount }, (_, i) => {
    const fraction = i / (gridLineCount - 1);
    return minValue + fraction * valueRange;
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

      {/* SVG Chart */}
      <svg
        width={videoWidth}
        height={videoHeight}
        viewBox={`0 0 ${videoWidth} ${videoHeight}`}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <defs>
          {/* Area gradient */}
          <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity={0.4} />
            <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines + labels */}
        {gridValues.map((val, i) => {
          const y = getY(val);
          return (
            <g key={i}>
              <line
                x1={CHART_PADDING.left}
                y1={y}
                x2={CHART_PADDING.left + chartWidth}
                y2={y}
                stroke={`${style.subtextColor}18`}
                strokeWidth={1}
                strokeDasharray="6 4"
              />
              <text
                x={CHART_PADDING.left - 16}
                y={y + 5}
                textAnchor="end"
                fill={style.subtextColor}
                fontSize={16}
                fontFamily={style.fontFamily}
                opacity={0.6}
              >
                {val.toFixed(0)}
              </text>
            </g>
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

        {/* Target line (dashed) */}
        {targetPath && (
          <path
            d={targetPath}
            fill="none"
            stroke={targetColor}
            strokeWidth={2}
            strokeDasharray="8 6"
            strokeDashoffset={totalPathLength * (1 - clampedDraw)}
            opacity={0.5}
            style={{
              strokeDasharray: `${totalPathLength}`,
              strokeDashoffset: totalPathLength * (1 - clampedDraw),
            }}
          />
        )}

        {/* Area fill */}
        <path d={areaPath} fill="url(#area-gradient)" opacity={areaOpacity} />

        {/* Actual line */}
        <path
          d={actualPath}
          fill="none"
          stroke={lineColor}
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: totalPathLength,
            strokeDashoffset: strokeOffset,
          }}
        />

        {/* Data points + labels */}
        {chart_data.map((item, index) => {
          const x = getX(index);
          const y = getY(item.value);

          // Each dot appears when the line reaches it
          const dotProgress = interpolate(
            clampedDraw,
            [index / chart_data.length, (index + 0.5) / chart_data.length],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          // Value label appears after dot
          const labelProgress = interpolate(
            clampedDraw,
            [(index + 0.3) / chart_data.length, (index + 0.8) / chart_data.length],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          return (
            <g key={item.label}>
              {/* Dot glow */}
              <circle
                cx={x}
                cy={y}
                r={10}
                fill={lineColor}
                opacity={0.15 * dotProgress}
              />
              {/* Dot */}
              <circle
                cx={x}
                cy={y}
                r={5}
                fill={lineColor}
                stroke={style.backgroundColor}
                strokeWidth={2.5}
                opacity={dotProgress}
              />

              {/* Value label (show every other to avoid clutter if many items) */}
              {(chart_data.length <= 6 || index % 2 === 0 || index === chart_data.length - 1) && (
                <text
                  x={x}
                  y={y - 18}
                  textAnchor="middle"
                  fill={style.textColor}
                  fontSize={18}
                  fontWeight={600}
                  fontFamily={style.fontFamily}
                  opacity={labelProgress}
                >
                  {item.value.toFixed(1)}
                </text>
              )}

              {/* X-axis label */}
              <text
                x={x}
                y={CHART_PADDING.top + chartHeight + 35}
                textAnchor="middle"
                fill={style.subtextColor}
                fontSize={18}
                fontWeight={500}
                fontFamily={style.fontFamily}
                opacity={dotProgress}
              >
                {item.label}
              </text>
            </g>
          );
        })}

        {/* Legend */}
        {targetItems && (
          <g>
            {/* Actual legend */}
            <line
              x1={CHART_PADDING.left}
              y1={CHART_PADDING.top + chartHeight + 70}
              x2={CHART_PADDING.left + 30}
              y2={CHART_PADDING.top + chartHeight + 70}
              stroke={lineColor}
              strokeWidth={3}
            />
            <text
              x={CHART_PADDING.left + 40}
              y={CHART_PADDING.top + chartHeight + 75}
              fill={style.subtextColor}
              fontSize={16}
              fontFamily={style.fontFamily}
            >
              Actual
            </text>

            {/* Target legend */}
            <line
              x1={CHART_PADDING.left + 120}
              y1={CHART_PADDING.top + chartHeight + 70}
              x2={CHART_PADDING.left + 150}
              y2={CHART_PADDING.top + chartHeight + 70}
              stroke={targetColor}
              strokeWidth={2}
              strokeDasharray="6 4"
              opacity={0.6}
            />
            <text
              x={CHART_PADDING.left + 160}
              y={CHART_PADDING.top + chartHeight + 75}
              fill={style.subtextColor}
              fontSize={16}
              fontFamily={style.fontFamily}
              opacity={0.6}
            >
              Target
            </text>
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};
