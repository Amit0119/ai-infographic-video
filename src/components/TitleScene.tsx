import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import type { TitleSceneProps } from "../types";

/**
 * TitleScene — Animated corporate title and subtitle.
 *
 * Animations:
 * - Background gradient fades in
 * - Title slides up from below with spring physics + opacity fade
 * - Subtitle fades in and slides up with a delayed spring
 * - Decorative accent line scales in from center
 */
export const TitleScene: React.FC<TitleSceneProps> = ({
  title,
  subtitle,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Spring Animations ──────────────────────────────────────

  // Title enters with a smooth spring (starts immediately)
  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 80, mass: 0.8 },
  });

  // Subtitle enters with a delayed spring
  const subtitleSpring = spring({
    frame: frame - 12, // 12-frame delay after title
    fps,
    config: { damping: 16, stiffness: 70, mass: 0.8 },
  });

  // Decorative accent line scales in
  const accentSpring = spring({
    frame: frame - 8,
    fps,
    config: { damping: 20, stiffness: 100, mass: 0.5 },
  });

  // ── Derived Values ─────────────────────────────────────────

  const titleTranslateY = interpolate(titleSpring, [0, 1], [60, 0]);
  const titleOpacity = titleSpring;

  const subtitleTranslateY = interpolate(subtitleSpring, [0, 1], [40, 0]);
  const subtitleOpacity = Math.max(0, subtitleSpring);

  const accentScaleX = Math.max(0, accentSpring);

  // Background gradient opacity (quick fade-in over 15 frames)
  const bgOpacity = interpolate(frame, [0, 15], [0, 1], {
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
      {/* Subtle radial gradient overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 40%, ${style.primaryColor}22 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* Title */}
      <h1
        style={{
          fontSize: 72,
          fontWeight: 700,
          color: style.textColor,
          textAlign: "center",
          margin: 0,
          padding: "0 120px",
          lineHeight: 1.2,
          letterSpacing: "-0.02em",
          transform: `translateY(${titleTranslateY}px)`,
          opacity: titleOpacity,
        }}
      >
        {title}
      </h1>

      {/* Accent Line */}
      <div
        style={{
          width: 120,
          height: 4,
          borderRadius: 2,
          background: `linear-gradient(90deg, ${style.primaryColor}, ${style.secondaryColor})`,
          margin: "32px 0",
          transform: `scaleX(${accentScaleX})`,
        }}
      />

      {/* Subtitle */}
      {subtitle && (
        <p
          style={{
            fontSize: 32,
            fontWeight: 400,
            color: style.subtextColor,
            textAlign: "center",
            margin: 0,
            padding: "0 200px",
            lineHeight: 1.5,
            letterSpacing: "0.01em",
            transform: `translateY(${subtitleTranslateY}px)`,
            opacity: subtitleOpacity,
          }}
        >
          {subtitle}
        </p>
      )}
    </AbsoluteFill>
  );
};
