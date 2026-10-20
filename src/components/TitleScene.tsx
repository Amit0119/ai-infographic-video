import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import type { TitleSceneProps } from "../types";
import { GlassCard } from "./GlassCard";

/**
 * TitleScene — Premium corporate title with geometric accents.
 *
 * Animations:
 * - Corner accent marks animate in with spring
 * - Category tag slides down
 * - Title slides up with spring physics
 * - Accent line scales in from center with glow
 * - Subtitle fades in with delay
 */
export const TitleScene: React.FC<TitleSceneProps> = ({
  title,
  subtitle,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Spring Animations ──────────────────────────────────────

  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 80, mass: 0.8 },
  });

  const subtitleSpring = spring({
    frame: frame - 12,
    fps,
    config: { damping: 16, stiffness: 70, mass: 0.8 },
  });

  const accentSpring = spring({
    frame: frame - 8,
    fps,
    config: { damping: 20, stiffness: 100, mass: 0.5 },
  });

  const cornerSpring = spring({
    frame: frame - 4,
    fps,
    config: { damping: 18, stiffness: 90, mass: 0.6 },
  });

  // ── Derived Values ─────────────────────────────────────────

  const titleTranslateY = interpolate(titleSpring, [0, 1], [60, 0]);
  const titleOpacity = titleSpring;
  const subtitleTranslateY = interpolate(subtitleSpring, [0, 1], [40, 0]);
  const subtitleOpacity = Math.max(0, subtitleSpring);
  const accentScaleX = Math.max(0, accentSpring);
  const cornerOpacity = Math.max(0, cornerSpring);

  const bgOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  // ── Corner Accent Component ────────────────────────────────

  const CornerAccent = ({ position }: { position: "tl" | "tr" | "bl" | "br" }) => {
    const isTop = position.includes("t");
    const isLeft = position.includes("l");
    const size = 40;
    const thickness = 3;
    return (
      <div
        style={{
          position: "absolute",
          top: isTop ? 0 : undefined,
          bottom: !isTop ? 0 : undefined,
          left: isLeft ? 0 : undefined,
          right: !isLeft ? 0 : undefined,
          width: size,
          height: size,
          opacity: cornerOpacity,
        }}
      >
        <div
          style={{
            position: "absolute",
            [isTop ? "top" : "bottom"]: 0,
            [isLeft ? "left" : "right"]: 0,
            width: size,
            height: thickness,
            background: `linear-gradient(${isLeft ? "90deg" : "270deg"}, ${style.primaryColor}, transparent)`,
            borderRadius: thickness / 2,
          }}
        />
        <div
          style={{
            position: "absolute",
            [isTop ? "top" : "bottom"]: 0,
            [isLeft ? "left" : "right"]: 0,
            width: thickness,
            height: size,
            background: `linear-gradient(${isTop ? "180deg" : "0deg"}, ${style.primaryColor}, transparent)`,
            borderRadius: thickness / 2,
          }}
        />
      </div>
    );
  };

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
      <GlassCard style={style} width="80%" height="auto" opacity={1}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {/* Corner accent marks */}
          <CornerAccent position="tl" />
          <CornerAccent position="tr" />
          <CornerAccent position="bl" />
          <CornerAccent position="br" />

          {/* Subtle radial gradient overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(ellipse at 50% 40%, ${style.primaryColor}15 0%, transparent 70%)`,
              pointerEvents: "none",
            }}
          />

          {/* Category tag */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 20px",
              borderRadius: 20,
              border: `1px solid ${style.primaryColor}40`,
              backgroundColor: `${style.primaryColor}12`,
              marginBottom: 32,
              opacity: cornerOpacity,
              transform: `translateY(${interpolate(Math.max(0, cornerSpring), [0, 1], [-20, 0])}px)`,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: style.primaryColor,
              }}
            />
            <span
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: style.primaryColor,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
              }}
            >
              Corporate Infographic
            </span>
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: style.textColor,
              textAlign: "center",
              margin: 0,
              padding: "0 80px",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              transform: `translateY(${titleTranslateY}px)`,
              opacity: titleOpacity,
              textShadow: "0 4px 24px rgba(0,0,0,0.4)",
            }}
          >
            {title}
          </h1>

          {/* Accent Line with glow */}
          <div style={{ position: "relative", margin: "36px 0" }}>
            <div
              style={{
                width: 180,
                height: 4,
                borderRadius: 2,
                background: `linear-gradient(90deg, transparent, ${style.primaryColor}, ${style.secondaryColor}, transparent)`,
                transform: `scaleX(${accentScaleX})`,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: -4,
                left: "50%",
                transform: `translateX(-50%) scaleX(${accentScaleX})`,
                width: 120,
                height: 12,
                background: `${style.primaryColor}40`,
                borderRadius: 6,
                filter: "blur(8px)",
              }}
            />
          </div>

          {/* Subtitle */}
          {subtitle && (
            <p
              style={{
                fontSize: 30,
                fontWeight: 400,
                color: style.subtextColor,
                textAlign: "center",
                margin: 0,
                padding: "0 160px",
                lineHeight: 1.5,
                letterSpacing: "0.02em",
                transform: `translateY(${subtitleTranslateY}px)`,
                opacity: subtitleOpacity,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </GlassCard>
    </AbsoluteFill>
  );
};
