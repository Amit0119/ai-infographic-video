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
 * KPIAnimation — Metric display with smooth number-counting animation.
 *
 * Animations:
 * - Label fades in and slides up
 * - Number counts from 0 → value using spring interpolation
 * - Unit text fades in beside the number
 * - Growth badge scales in with a bounce after the number finishes
 */
export const KPIAnimation: React.FC<KPISceneProps> = ({
  metric,
  value,
  unit,
  prefix = "",
  growth,
  growthLabel = "YoY",
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Spring Animations ──────────────────────────────────────

  // Label enters first
  const labelSpring = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 80, mass: 0.7 },
  });

  // Number counts up (slightly delayed)
  const numberSpring = spring({
    frame: frame - 8,
    fps,
    config: { damping: 28, stiffness: 40, mass: 1.2 },
  });

  // Growth badge enters after number settles
  const growthSpring = spring({
    frame: frame - 30,
    fps,
    config: { damping: 12, stiffness: 100, mass: 0.6 },
  });

  // ── Derived Values ─────────────────────────────────────────

  // Label animation
  const labelOpacity = labelSpring;
  const labelTranslateY = interpolate(labelSpring, [0, 1], [30, 0]);

  // Safe parsing
  const numericValue = typeof value === 'number' ? value : parseFloat(value as any);
  const isNumeric = !isNaN(numericValue);

  // Number counting animation (only if numeric)
  const clampedNumberSpring = Math.max(0, Math.min(1, numberSpring));
  
  let formattedNumber: string | number = value || "";
  if (isNumeric) {
    const displayValue = clampedNumberSpring * numericValue;
    const isInteger = Number.isInteger(numericValue);
    formattedNumber = isInteger
      ? Math.round(displayValue).toLocaleString("en-IN")
      : displayValue.toFixed(1);
  }

  // Number opacity
  const numberOpacity = interpolate(
    Math.max(0, numberSpring),
    [0, 0.3],
    [0, 1],
    { extrapolateRight: "clamp" }
  );

  // Growth badge animation
  const clampedGrowthSpring = Math.max(0, growthSpring);
  const growthScale = clampedGrowthSpring;
  const growthOpacity = clampedGrowthSpring;

  const isPositiveGrowth = typeof growth === 'number' ? growth >= 0 : true;
  const growthColor = isPositiveGrowth ? "#10B981" : "#EF4444";
  const growthArrow = isPositiveGrowth ? "↑" : "↓";
  const displayGrowth = typeof growth === 'number' ? `${Math.abs(growth)}%` : growth;

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
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: style.fontFamily,
      }}
    >
      <GlassCard style={style} width="70%" height="auto" opacity={1}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative"
        }}>
      {/* Subtle gradient glow behind the number */}
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${style.primaryColor}18 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* Metric Label */}
      <p
        style={{
          fontSize: 28,
          fontWeight: 500,
          color: style.subtextColor,
          textTransform: "uppercase",
          letterSpacing: "0.15em",
          margin: 0,
          marginBottom: 24,
          opacity: labelOpacity,
          transform: `translateY(${labelTranslateY}px)`,
        }}
      >
        {metric}
      </p>

      {/* Number + Unit */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 12,
          opacity: numberOpacity,
        }}
      >
        <span
          style={{
            fontSize: 120,
            fontWeight: 800,
            color: style.textColor,
            lineHeight: 1,
            letterSpacing: "-0.03em",
            fontVariantNumeric: "tabular-nums",
            textShadow: "0px 10px 30px rgba(0,0,0,0.6)"
          }}
        >
          {prefix}
          {formattedNumber}
        </span>
        {unit && (
          <span
            style={{
              fontSize: 48,
              fontWeight: 600,
              color: style.subtextColor,
              lineHeight: 1,
            }}
          >
            {unit}
          </span>
        )}
      </div>

      {/* Growth Badge — only shown when growthLabel is non-empty */}
      {growthLabel ? (
        <div
          style={{
            marginTop: 32,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 28px",
            borderRadius: 40,
            backgroundColor: `${growthColor}18`,
            border: `2px solid ${growthColor}40`,
            opacity: growthOpacity,
            transform: `scale(${growthScale})`,
            boxShadow: "0px 10px 30px rgba(0,0,0,0.3)"
          }}
        >
          <span style={{ fontSize: 28, color: growthColor }}>{growthArrow}</span>
          <span
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: growthColor,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {displayGrowth}
          </span>
          <span
            style={{
              fontSize: 20,
              fontWeight: 400,
              color: style.subtextColor,
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
