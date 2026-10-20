import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import type { KPISceneProps } from "../types";
import { GlassCard } from "./GlassCard";

/**
 * KPIAnimation — Premium metric display with animated circular progress ring.
 *
 * Animations:
 * - Label fades in and slides up
 * - SVG circular progress ring draws from 0 → value
 * - Number counts from 0 → value using spring interpolation
 * - Decorative accent elements appear
 * - Growth badge scales in with bounce
 *
 * Fixes:
 * - Handles string values (e.g. "15%") intelligently
 * - Won't display duplicate unit symbols (e.g. "15% %")
 */
export const KPIAnimation: React.FC<KPISceneProps & { data_points?: string[] }> = ({
  metric,
  value,
  unit,
  prefix = "",
  growth,
  growthLabel = "YoY",
  style,
  data_points,
}) => {
  const actualMetric = metric || (data_points && data_points[0]) || "Metric";
  const actualValue = value !== undefined ? value : (data_points && parseFloat(data_points[1] as any)) || 100;
  const actualGrowth = growth !== undefined ? growth : 15;
  const actualUnit = unit || "%";
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Spring Animations ──────────────────────────────────────

  const labelSpring = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 80, mass: 0.7 },
  });

  const numberSpring = spring({
    frame: frame - 8,
    fps,
    config: { damping: 28, stiffness: 40, mass: 1.2 },
  });

  const ringSpring = spring({
    frame: frame - 4,
    fps,
    config: { damping: 30, stiffness: 30, mass: 1.5 },
  });

  const growthSpring = spring({
    frame: frame - 30,
    fps,
    config: { damping: 12, stiffness: 100, mass: 0.6 },
  });

  const accentSpring = spring({
    frame: frame - 6,
    fps,
    config: { damping: 20, stiffness: 100, mass: 0.5 },
  });

  // ── Derived Values ─────────────────────────────────────────

  const labelOpacity = labelSpring;
  const labelTranslateY = interpolate(labelSpring, [0, 1], [30, 0]);

  // Safe parsing for mixed numeric/string values
  const numericValue =
    typeof actualValue === "number" ? actualValue : parseFloat(actualValue as any);
  const isNumeric = !isNaN(numericValue);

  const clampedNumberSpring = Math.max(0, Math.min(1, numberSpring));

  // Format the display number
  let formattedNumber: string | number = actualValue || "";
  if (isNumeric) {
    const displayValue = clampedNumberSpring * numericValue;
    const isInteger = Number.isInteger(numericValue);
    formattedNumber = isInteger
      ? Math.round(displayValue).toLocaleString("en-IN")
      : Number(displayValue).toFixed(1);
  } else {
    // For string values like "15%", display as-is
    formattedNumber = String(actualValue || "");
  }

  // Prevent duplicate unit display (e.g., value="15%" + unit="%" → "15% %")
  const valueStr = String(actualValue || "");
  const shouldShowUnit =
    actualUnit && !valueStr.includes(actualUnit) && isNumeric;

  const numberOpacity = interpolate(
    Math.max(0, numberSpring),
    [0, 0.3],
    [0, 1],
    { extrapolateRight: "clamp" }
  );

  const clampedGrowthSpring = Math.max(0, growthSpring);
  const isPositiveGrowth =
    typeof actualGrowth === "number" ? actualGrowth >= 0 : true;
  const growthColor = isPositiveGrowth ? "#10B981" : "#EF4444";
  const growthArrow = isPositiveGrowth ? "↑" : "↓";
  const displayGrowth =
    typeof actualGrowth === "number" ? `${Math.abs(actualGrowth)}%` : actualGrowth;

  const bgOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  // ── Circular Progress Ring ─────────────────────────────────

  const ringRadius = 160;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringProgress = Math.max(0, Math.min(1, ringSpring));
  // Use a meaningful fraction: if unit is %, use the value; otherwise default ring
  const ringFraction =
    isNumeric && actualUnit === "%" ? Math.min(numericValue / 100, 1) : 0.75;
  const ringOffset = ringCircumference * (1 - ringFraction * ringProgress);

  // ── Render ─────────────────────────────────────────────────

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "transparent",
        opacity: bgOpacity,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: style.fontFamily,
      }}
    >
      <GlassCard style={style} width="70%" height="auto" opacity={1}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {/* Metric Label */}
          <p
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: style.textColor || "#FFFFFF",
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              margin: 0,
              marginBottom: 40,
              opacity: Math.min(1, Math.max(0, labelOpacity)),
              transform: `translateY(${labelTranslateY}px)`,
            }}
          >
            {actualMetric}
          </p>

          {/* Circular Progress Ring + Number */}
          <div
            style={{
              position: "relative",
              width: ringRadius * 2 + 40,
              height: ringRadius * 2 + 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* SVG Ring */}
            <svg
              width={ringRadius * 2 + 40}
              height={ringRadius * 2 + 40}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                transform: "rotate(-90deg)",
              }}
            >
              {/* Background track */}
              <circle
                cx={ringRadius + 20}
                cy={ringRadius + 20}
                r={ringRadius}
                fill="none"
                stroke={`${style.subtextColor}15`}
                strokeWidth={6}
              />
              {/* Progress arc */}
              <circle
                cx={ringRadius + 20}
                cy={ringRadius + 20}
                r={ringRadius}
                fill="none"
                stroke={style.primaryColor}
                strokeWidth={6}
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                style={{
                  filter: `drop-shadow(0 0 8px ${style.primaryColor}60)`,
                }}
              />
            </svg>

            {/* Number + Unit (centered inside ring) */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                opacity: numberOpacity,
                zIndex: 1,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 100,
                    fontWeight: 800,
                    color: style.textColor || "#FFFFFF",
                    lineHeight: 1,
                    letterSpacing: "-0.03em",
                    fontVariantNumeric: "tabular-nums",
                    textShadow: `0 0 30px ${style.primaryColor || "#38bdf8"}80`,
                    opacity: Math.min(1, Math.max(0, numberOpacity)),
                  }}
                >
                  {prefix}
                  {formattedNumber}
                </span>
                {shouldShowUnit && (
                  <span
                    style={{
                      fontSize: 44,
                      fontWeight: 600,
                      color: style.textColor || "#FFFFFF",
                      lineHeight: 1,
                      opacity: Math.min(1, Math.max(0, numberOpacity)),
                    }}
                  >
                    {actualUnit}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Decorative accent elements */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginTop: 32,
              opacity: Math.max(0, accentSpring),
            }}
          >
            <div
              style={{
                width: 40,
                height: 2,
                background: `linear-gradient(90deg, transparent, ${style.primaryColor}60)`,
                borderRadius: 1,
              }}
            />
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                border: `2px solid ${style.primaryColor}50`,
              }}
            />
            <div
              style={{
                width: 40,
                height: 2,
                background: `linear-gradient(270deg, transparent, ${style.primaryColor}60)`,
                borderRadius: 1,
              }}
            />
          </div>

          {/* Growth Badge */}
          {growthLabel ? (
            <div
              style={{
                marginTop: 24,
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 28px",
                borderRadius: 40,
                backgroundColor: `${growthColor}12`,
                border: `1.5px solid ${growthColor}35`,
                opacity: clampedGrowthSpring,
                transform: `scale(${clampedGrowthSpring})`,
                boxShadow: `0 4px 20px ${growthColor}15`,
              }}
            >
              <span style={{ fontSize: 24, color: growthColor }}>
                {growthArrow}
              </span>
              <span
                style={{
                  fontSize: 30,
                  fontWeight: 700,
                  color: growthColor,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {displayGrowth}
              </span>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 400,
                  color: style.textColor || "#FFFFFF",
                  marginLeft: 4,
                }}
              >
                {growthLabel}
              </span>
            </div>
          ) : null}
        </div>
      </GlassCard>
    </AbsoluteFill>
  );
};
