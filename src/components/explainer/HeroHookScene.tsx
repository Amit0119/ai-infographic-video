import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { HeroHookSceneProps } from "../../types";
import { ExplainerIcon } from "./ExplainerIcon";

export const HeroHookScene: React.FC<HeroHookSceneProps> = ({
  badge = "POLICY UPDATE",
  headline,
  tagline,
  icon = "calendar-check",
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const primary = style.primaryColor || "#2563EB";
  const secondary = style.secondaryColor || "#0EA5E9";
  const textColor = style.textColor || "#0F172A";
  const subtextColor = style.subtextColor || "#475569";
  const fontFamily = style.fontFamily || "Inter, sans-serif";

  const iconSpring = spring({ frame, fps, config: { damping: 12, stiffness: 120 } });
  const badgeSpring = spring({ frame: Math.max(0, frame - 8), fps, config: { damping: 14, stiffness: 140 } });
  const titleSpring = spring({ frame: Math.max(0, frame - 14), fps, config: { damping: 14, stiffness: 110 } });
  const barSpring = spring({ frame: Math.max(0, frame - 24), fps, config: { damping: 16, stiffness: 100 } });
  const taglineSpring = spring({ frame: Math.max(0, frame - 28), fps, config: { damping: 16, stiffness: 100 } });

  const floatY = Math.sin(frame / 16) * 7;
  const pulseCycle = (frame % 75) / 75;
  const ringScale = interpolate(pulseCycle, [0, 1], [1, 1.48]);
  const ringOpacity = interpolate(pulseCycle, [0, 0.2, 1], [0, 0.32, 0]);

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 140px",
        fontFamily,
        textAlign: "center",
      }}
    >
      {/* Animated Icon Medallion */}
      <div
        style={{
          position: "relative",
          marginBottom: 42,
          transform: `translateY(${floatY}px) scale(${iconSpring})`,
          opacity: iconSpring,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: -14,
            borderRadius: 44,
            border: `3px solid ${primary}`,
            transform: `scale(${ringScale})`,
            opacity: ringOpacity,
          }}
        />
        <div
          style={{
            width: 144,
            height: 144,
            borderRadius: 36,
            background: `linear-gradient(135deg, ${primary}, ${secondary})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 24px 54px ${primary}38`,
          }}
        >
          <ExplainerIcon name={icon} size={72} color="#FFFFFF" strokeWidth={2.2} />
        </div>
      </div>

      {/* Uppercase Pill Badge */}
      {badge && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "10px 26px",
            borderRadius: 999,
            backgroundColor: `${primary}16`,
            border: `1.5px solid ${primary}33`,
            color: primary,
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            marginBottom: 28,
            transform: `translateY(${interpolate(badgeSpring, [0, 1], [20, 0])}px)`,
            opacity: badgeSpring,
          }}
        >
          {badge}
        </div>
      )}

      {/* Bold Headline */}
      <h1
        style={{
          margin: 0,
          maxWidth: 1380,
          fontSize: 88,
          fontWeight: 900,
          lineHeight: 1.08,
          letterSpacing: "-0.035em",
          color: textColor,
          transform: `translateY(${interpolate(titleSpring, [0, 1], [36, 0])}px)`,
          opacity: titleSpring,
        }}
      >
        {headline}
      </h1>

      {/* Accent Bar */}
      <div
        style={{
          width: interpolate(barSpring, [0, 1], [0, 140]),
          height: 8,
          borderRadius: 999,
          background: `linear-gradient(90deg, ${primary}, ${secondary})`,
          marginTop: 32,
          marginBottom: 32,
          opacity: barSpring,
        }}
      />

      {/* Crisp Tagline */}
      {tagline && (
        <p
          style={{
            margin: 0,
            maxWidth: 1050,
            fontSize: 38,
            fontWeight: 500,
            lineHeight: 1.35,
            color: subtextColor,
            transform: `translateY(${interpolate(taglineSpring, [0, 1], [24, 0])}px)`,
            opacity: taglineSpring,
          }}
        >
          {tagline}
        </p>
      )}
    </AbsoluteFill>
  );
};