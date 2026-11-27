import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { SplitCompareSceneProps, SplitCompareSide } from "../../types";
import { ExplainerIcon } from "./ExplainerIcon";

export const SplitCompareScene: React.FC<SplitCompareSceneProps> = ({
  headline,
  left,
  right,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const surface = style.surfaceColor || "#FFFFFF";
  const primary = style.primaryColor || "#2563EB";
  const accentDefault = style.accentColor || "#10B981";
  const textColor = style.textColor || "#0F172A";
  const subtextColor = style.subtextColor || "#475569";
  const fontFamily = style.fontFamily || "Inter, sans-serif";

  const headSpring = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const leftSpring = spring({ frame: Math.max(0, frame - 12), fps, config: { damping: 13, stiffness: 105 } });
  const vsSpring = spring({ frame: Math.max(0, frame - 28), fps, config: { damping: 12, stiffness: 150 } });
  const rightSpring = spring({ frame: Math.max(0, frame - 34), fps, config: { damping: 13, stiffness: 105 } });

  const renderCard = (
    side: SplitCompareSide,
    anim: number,
    direction: -1 | 1,
    fallbackAccent: string,
    statDelay: number
  ) => {
    const accent = side.accent || fallbackAccent;
    const statPop = spring({
      frame: Math.max(0, frame - statDelay),
      fps,
      config: { damping: 11, stiffness: 140 },
    });

    return (
      <div
        style={{
          flex: 1,
          maxWidth: 740,
          backgroundColor: surface,
          borderRadius: 32,
          padding: "56px 52px 60px",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(15, 23, 42, 0.07), 0 4px 16px rgba(15, 23, 42, 0.04)",
          border: "1px solid rgba(15, 23, 42, 0.06)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          transform: `translateX(${interpolate(anim, [0, 1], [direction * 60, 0])}px) scale(${interpolate(anim, [0, 1], [0.94, 1])})`,
          opacity: anim,
        }}
      >
        {/* Colored Top Accent Bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 10,
            backgroundColor: accent,
          }}
        />

        {/* Soft Tinted Icon Circle */}
        <div
          style={{
            width: 116,
            height: 116,
            borderRadius: 30,
            backgroundColor: `${accent}16`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 28,
          }}
        >
          <ExplainerIcon name={side.icon} size={58} color={accent} strokeWidth={2.2} />
        </div>

        {/* Label Pill */}
        <div
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: textColor,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 20,
          }}
        >
          {side.label}
        </div>

        {/* Big Bold Stat */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
            color: accent,
            marginBottom: 22,
            transform: `scale(${interpolate(statPop, [0, 1], [0.82, 1])})`,
            opacity: statPop,
          }}
        >
          {side.stat}
        </div>

        {/* Concise Subtext */}
        <p
          style={{
            margin: 0,
            fontSize: 30,
            fontWeight: 500,
            lineHeight: 1.4,
            color: subtextColor,
            maxWidth: 560,
          }}
        >
          {side.subtext}
        </p>
      </div>
    );
  };

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "70px 100px",
        fontFamily,
      }}
    >
      {/* Scene Headline */}
      <h2
        style={{
          margin: "0 0 64px 0",
          fontSize: 62,
          fontWeight: 800,
          letterSpacing: "-0.03em",
          color: textColor,
          textAlign: "center",
          transform: `translateY(${interpolate(headSpring, [0, 1], [28, 0])}px)`,
          opacity: headSpring,
        }}
      >
        {headline}
      </h2>

      {/* Side-by-Side Comparison Row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          gap: 36,
          position: "relative",
        }}
      >
        {renderCard(left, leftSpring, -1, primary, 24)}

        {/* Center VS Badge */}
        <div
          style={{
            width: 82,
            height: 82,
            borderRadius: "50%",
            backgroundColor: textColor,
            color: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 26,
            fontWeight: 900,
            letterSpacing: "0.06em",
            flexShrink: 0,
            boxShadow: "0 14px 32px rgba(15, 23, 42, 0.22)",
            transform: `scale(${vsSpring})`,
            opacity: vsSpring,
          }}
        >
          VS
        </div>

        {renderCard(right, rightSpring, 1, accentDefault, 46)}
      </div>
    </AbsoluteFill>
  );
};