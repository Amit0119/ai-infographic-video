import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export interface GlassmorphismBadgeProps {
  label: string;
  metric: string;
  color?: string; // Accent color for the metric text
  style?: React.CSSProperties;
  frameDelay?: number;
}

export const GlassmorphismBadge: React.FC<GlassmorphismBadgeProps> = ({
  label,
  metric,
  color = "#38bdf8", // Default neon blue
  style,
  frameDelay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animation for scale-up and fade-in
  const badgeSpring = spring({
    frame: Math.max(0, frame - frameDelay),
    fps,
    config: { damping: 14, stiffness: 100, mass: 0.8 },
  });

  const opacity = interpolate(badgeSpring, [0, 1], [0, 1], { extrapolateLeft: "clamp" });
  const scale = interpolate(badgeSpring, [0, 1], [0.8, 1], { extrapolateLeft: "clamp" });

  return (
    <div
      style={{
        ...style,
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 40px",
        borderRadius: "24px",
        backgroundColor: "rgba(15, 23, 42, 0.4)", // Translucent dark background
        backdropFilter: "blur(12px)", // Backdrop blur
        border: "1px solid rgba(255, 255, 255, 0.15)", // Subtle semi-transparent white border
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.25)",
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      <span style={{ fontSize: 48, fontWeight: 800, color, marginBottom: 8, textShadow: `0 0 16px ${color}80` }}>
        {metric}
      </span>
      <span style={{ fontSize: 24, fontWeight: 500, color: "#E4E4E7", letterSpacing: "0.05em", textTransform: "uppercase" }}>
        {label}
      </span>
    </div>
  );
};
