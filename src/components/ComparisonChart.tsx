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
 * ComparisonChart — Dual-mode: numeric bar chart OR text-based card layout.
 *
 * Detects whether actual/target values are numeric or text:
 * - Numeric: Renders horizontal grouped bars with animated draw
 * - Text: Renders a professional card-based comparison grid
 *
 * This prevents broken layouts when comparison data uses category
 * labels like "OPEX" / "CAPEX" instead of numbers.
 */

const CHART_PADDING = { top: 140, right: 200, bottom: 80, left: 220 };
const ROW_GAP = 24;
const BAR_HEIGHT = 36;
const BAR_PAIR_HEIGHT = BAR_HEIGHT * 2 + 8;
const STAGGER_FRAMES = 8;
const BAR_BORDER_RADIUS = 6;

export const ComparisonChart: React.FC<ComparisonSceneProps & { data_points?: string[] }> = ({
  title,
  items,
  style,
  data_points,
}) => {
  const actualTitle = title || (data_points && data_points[0]) || "Comparison";
  const safeItems = items?.length ? items : (data_points || []).map(dp => ({ name: String(dp).substring(0, 15), actual: 80, target: 100 }));
  const frame = useCurrentFrame();
  const { fps, width: videoWidth, height: videoHeight } = useVideoConfig();

  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 80, mass: 0.8 },
  });
  const titleOpacity = titleSpring;
  const titleTranslateY = interpolate(titleSpring, [0, 1], [-30, 0]);

  const bgOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  // ── Detect data mode ───────────────────────────────────────

  const isNumeric =
    safeItems.length > 0 &&
    safeItems.every(
      (i) =>
        typeof i.actual === "number" && typeof i.target === "number"
    );

  // ── Numeric Mode: Horizontal grouped bars ──────────────────

  if (isNumeric) {
    const chartWidth =
      videoWidth - CHART_PADDING.left - CHART_PADDING.right;
    const totalRowHeight =
      safeItems.length * BAR_PAIR_HEIGHT + (safeItems.length - 1) * ROW_GAP;
    const startY =
      CHART_PADDING.top +
      (videoHeight -
        CHART_PADDING.top -
        CHART_PADDING.bottom -
        totalRowHeight) /
        2;
    const maxValue = Math.max(
      ...safeItems.map((i) =>
        Math.max(Number(i.actual), Number(i.target))
      ),
      1
    );

    return (
      <AbsoluteFill
        style={{
          backgroundColor: "transparent",
          opacity: bgOpacity,
          fontFamily: style.fontFamily,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <GlassCard
          style={style}
          width="90%"
          height="80%"
          opacity={Math.min(1, Math.max(0, titleOpacity))}
          transform={`translateY(${titleTranslateY}px)`}
        >
          <h2
            style={{
              textAlign: "center",
              fontSize: 44,
              fontWeight: 700,
              color: style.textColor || "#FFFFFF",
              margin: 0,
              letterSpacing: "-0.01em",
            }}
          >
            {actualTitle}
          </h2>
          <div style={{ flex: 1, position: "relative" }}>
            <svg
              width="100%"
              height="100%"
              viewBox={`0 0 ${videoWidth} ${videoHeight}`}
              style={{ position: "absolute", top: -80, left: 0 }}
            >
              {safeItems.map((item, index) => {
                const rowY =
                  startY + index * (BAR_PAIR_HEIGHT + ROW_GAP);
                const rowSpring = spring({
                  frame: frame - 12 - index * STAGGER_FRAMES,
                  fps,
                  config: { damping: 18, stiffness: 60, mass: 0.9 },
                });
                const clampedRow = Math.max(
                  0,
                  Math.min(1, rowSpring)
                );
                const targetBarWidth =
                  (Number(item.target) / maxValue) * chartWidth;
                const actualBarWidth =
                  (Number(item.actual) / maxValue) * chartWidth;
                const isAboveTarget =
                  Number(item.actual) >= Number(item.target);
                const barColor = isAboveTarget
                  ? style.accentColor
                  : "#F59E0B";
                const labelOpacity = interpolate(
                  clampedRow,
                  [0.7, 1],
                  [0, 1],
                  {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }
                );
                const nameOpacity = interpolate(
                  clampedRow,
                  [0, 0.3],
                  [0, 1],
                  {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }
                );

                return (
                  <g key={item.name}>
                    {/* Row label */}
                    <text
                      x={CHART_PADDING.left - 20}
                      y={rowY + BAR_PAIR_HEIGHT / 2 + 6}
                      textAnchor="end"
                      fill={style.textColor || "#FFFFFF"}
                      fontSize={24}
                      fontWeight={600}
                      fontFamily={style.fontFamily}
                      opacity={Math.min(1, Math.max(0, nameOpacity))}
                    >
                      {item.name}
                    </text>

                    {/* Target bar (muted) */}
                    <rect
                      x={CHART_PADDING.left}
                      y={rowY}
                      width={targetBarWidth * clampedRow}
                      height={BAR_HEIGHT}
                      rx={BAR_BORDER_RADIUS}
                      ry={BAR_BORDER_RADIUS}
                      fill={`${style.subtextColor}30`}
                    />
                    <text
                      x={
                        CHART_PADDING.left +
                        targetBarWidth * clampedRow +
                        12
                      }
                      y={rowY + BAR_HEIGHT / 2 + 6}
                      fill={style.subtextColor}
                      fontSize={18}
                      fontWeight={500}
                      fontFamily={style.fontFamily}
                      opacity={labelOpacity}
                    >
                      {Number(item.target).toFixed(1)}
                    </text>

                    {/* Actual bar (vibrant) */}
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
                    {/* Bar glow */}
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
                    <text
                      x={
                        CHART_PADDING.left +
                        actualBarWidth * clampedRow +
                        12
                      }
                      y={
                        rowY +
                        BAR_HEIGHT +
                        8 +
                        BAR_HEIGHT / 2 +
                        6
                      }
                      fill={barColor}
                      fontSize={18}
                      fontWeight={700}
                      fontFamily={style.fontFamily}
                      opacity={labelOpacity}
                    >
                      {Number(item.actual).toFixed(1)}
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
                  {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }
                );
                return (
                  <g opacity={legendOpacity}>
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
  }

  // ── Text Mode: Card-based comparison grid ──────────────────

  const CARD_COLORS = [
    style.primaryColor,
    style.accentColor,
    style.secondaryColor,
    "#F59E0B",
    "#8B5CF6",
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "transparent",
        opacity: bgOpacity,
        fontFamily: style.fontFamily,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <GlassCard
        style={style}
        width="90%"
        height="80%"
        opacity={Math.min(1, Math.max(0, titleOpacity))}
        transform={`translateY(${titleTranslateY}px)`}
      >
        <h2
          style={{
            textAlign: "center",
            fontSize: 44,
            fontWeight: 700,
            color: style.textColor || "#FFFFFF",
            margin: 0,
            marginBottom: 50,
            letterSpacing: "-0.01em",
          }}
        >
          {actualTitle}
        </h2>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 28,
            justifyContent: "center",
          }}
        >
          {safeItems.map((item, index) => {
            const cardSpring = spring({
              frame: frame - 12 - index * STAGGER_FRAMES,
              fps,
              config: { damping: 16, stiffness: 70, mass: 0.8 },
            });
            const clamped = Math.max(0, Math.min(1, cardSpring));
            const cardColor =
              CARD_COLORS[index % CARD_COLORS.length];

            return (
              <div
                key={item.name}
                style={{
                  display: "flex",
                  alignItems: "stretch",
                  gap: 0,
                  opacity: clamped,
                  transform: `translateY(${interpolate(Math.max(0, cardSpring), [0, 1], [30, 0])}px)`,
                  borderRadius: 20,
                  overflow: "hidden",
                  border: `1px solid ${cardColor}25`,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
                }}
              >
                {/* Left: Category name */}
                <div
                  style={{
                    padding: "24px 32px",
                    background: `linear-gradient(135deg, ${cardColor}18, ${cardColor}08)`,
                    borderRight: `2px solid ${cardColor}20`,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    minWidth: 200,
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: cardColor,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      marginBottom: 6,
                    }}
                  >
                    Category
                  </span>
                  <span
                    style={{
                      fontSize: 28,
                      fontWeight: 700,
                      color: style.textColor || "#FFFFFF",
                    }}
                  >
                    {item.name}
                  </span>
                </div>

                {/* Center: Actual value */}
                <div
                  style={{
                    flex: 1,
                    padding: "24px 32px",
                    background: `${style.primaryColor}06`,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: style.subtextColor,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      marginBottom: 6,
                    }}
                  >
                    Actual
                  </span>
                  <span
                    style={{
                      fontSize: 32,
                      fontWeight: 700,
                      color: style.textColor || "#FFFFFF",
                    }}
                  >
                    {String(item.actual)}
                  </span>
                </div>

                {/* Right: Target value */}
                <div
                  style={{
                    flex: 1,
                    padding: "24px 32px",
                    background: `${style.accentColor}08`,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: style.subtextColor,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      marginBottom: 6,
                    }}
                  >
                    Target
                  </span>
                  <span
                    style={{
                      fontSize: 32,
                      fontWeight: 700,
                      color: style.accentColor,
                    }}
                  >
                    {String(item.target)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </AbsoluteFill>
  );
};
