import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import type { HighlightSceneProps } from "../types";

/**
 * HighlightCard — Full-screen spotlight for a single metric.
 *
 * Used for "Regional Leader" / "Product Leader" / "Underperforming" scenes.
 *
 * Animations:
 * - Badge slides in from above with spring
 * - Metric name fades in
 * - Big number counts up from 0
 * - Achievement pill scales in with bounce
 * - Variance indicator fades in last
 * - Glassmorphism card with glow effect
 */
export const HighlightCard: React.FC<HighlightSceneProps> = ({
  metric,
  value,
  unit,
  prefix = "",
  badge,
  achievement,
  variance,
  sentiment,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Color Scheme ───────────────────────────────────────────

  const isPositive = sentiment === "positive";
  const accentColor = isPositive ? "#10B981" : "#F59E0B";
  const glowColor = isPositive ? style.primaryColor : "#F59E0B";
  const badgeIcon = isPositive ? "🏆" : "⚠️";
  const varianceSign = variance >= 0 ? "+" : "";
  const achievementColor =
    achievement >= 100 ? "#10B981" : achievement >= 95 ? "#F59E0B" : "#EF4444";

  // ── Spring Animations ──────────────────────────────────────

  // Badge enters first
  const badgeSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 80, mass: 0.7 },
  });

  // Metric label
  const labelSpring = spring({
    frame: frame - 6,
    fps,
    config: { damping: 16, stiffness: 70, mass: 0.8 },
  });

  // Number counts up
  const numberSpring = spring({
    frame: frame - 12,
    fps,
    config: { damping: 28, stiffness: 40, mass: 1.2 },
  });

  // Achievement pill
  const achievementSpring = spring({
    frame: frame - 28,
    fps,
    config: { damping: 12, stiffness: 100, mass: 0.6 },
  });

  // Variance text
  const varianceSpring = spring({
    frame: frame - 36,
    fps,
    config: { damping: 16, stiffness: 80, mass: 0.7 },
  });

  // ── Derived Values ─────────────────────────────────────────

  const badgeOpacity = badgeSpring;
  const badgeTranslateY = interpolate(badgeSpring, [0, 1], [-40, 0]);

  const labelOpacity = Math.max(0, labelSpring);
  const labelTranslateY = interpolate(
    Math.max(0, labelSpring),
    [0, 1],
    [20, 0]
  );

  const clampedNumber = Math.max(0, Math.min(1, numberSpring));
  const displayValue = clampedNumber * value;
  const isInteger = Number.isInteger(value);
  const formattedNumber = isInteger
    ? Math.round(displayValue).toLocaleString("en-IN")
    : displayValue.toFixed(1);
  const numberOpacity = interpolate(
    Math.max(0, numberSpring),
    [0, 0.3],
    [0, 1],
    { extrapolateRight: "clamp" }
  );

  const clampedAchievement = Math.max(0, achievementSpring);
  const clampedVariance = Math.max(0, varianceSpring);

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
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: style.fontFamily,
      }}
    >
      {/* Radial glow behind the card */}
      <div
        style={{
          position: "absolute",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${glowColor}12 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* Glassmorphism Card */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "60px 100px",
          borderRadius: 32,
          background: `linear-gradient(135deg, ${style.backgroundColor}CC, ${style.backgroundColor}99)`,
          border: `1px solid ${glowColor}25`,
          boxShadow: `0 0 80px ${glowColor}10, 0 4px 32px rgba(0,0,0,0.3)`,
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 24px",
            borderRadius: 24,
            backgroundColor: `${accentColor}18`,
            border: `1px solid ${accentColor}35`,
            marginBottom: 24,
            opacity: badgeOpacity,
            transform: `translateY(${badgeTranslateY}px)`,
          }}
        >
          <span style={{ fontSize: 24 }}>{badgeIcon}</span>
          <span
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: accentColor,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            {badge}
          </span>
        </div>

        {/* Metric Name */}
        <p
          style={{
            fontSize: 32,
            fontWeight: 500,
            color: style.subtextColor,
            margin: 0,
            marginBottom: 20,
            letterSpacing: "0.05em",
            opacity: labelOpacity,
            transform: `translateY(${labelTranslateY}px)`,
          }}
        >
          {metric}
        </p>

        {/* Big Number + Unit */}
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
              fontSize: 110,
              fontWeight: 800,
              color: style.textColor,
              lineHeight: 1,
              letterSpacing: "-0.03em",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {prefix}
            {formattedNumber}
          </span>
          {unit && (
            <span
              style={{
                fontSize: 44,
                fontWeight: 600,
                color: style.subtextColor,
                lineHeight: 1,
              }}
            >
              {unit}
            </span>
          )}
        </div>

        {/* Achievement + Variance Row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            marginTop: 32,
          }}
        >
          {/* Achievement Pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 24px",
              borderRadius: 40,
              backgroundColor: `${achievementColor}15`,
              border: `2px solid ${achievementColor}40`,
              opacity: clampedAchievement,
              transform: `scale(${clampedAchievement})`,
            }}
          >
            <span
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: achievementColor,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {achievement.toFixed(1)}%
            </span>
            <span
              style={{
                fontSize: 18,
                fontWeight: 400,
                color: style.subtextColor,
              }}
            >
              Achievement
            </span>
          </div>

          {/* Variance */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              opacity: clampedVariance,
            }}
          >
            <span
              style={{
                fontSize: 24,
                fontWeight: 600,
                color: variance >= 0 ? "#10B981" : "#EF4444",
                fontVariantNumeric: "tabular-nums",
              }}
            >
            {varianceSign}{style.currencySymbol ?? ""}{Math.abs(variance).toFixed(1)} Cr
            </span>
            <span
              style={{
                fontSize: 16,
                color: style.subtextColor,
              }}
            >
              variance
            </span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
