import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export interface GlowingDonutChartProps {
  percentage: number; // 0 to 100
  label: string;
  glowColor?: string;
  trackColor?: string;
  style?: React.CSSProperties;
  frameDelay?: number;
}

export const GlowingDonutChart: React.FC<GlowingDonutChartProps> = ({
  percentage,
  label,
  glowColor = "#10B981",
  trackColor = "rgba(255, 255, 255, 0.1)",
  style,
  frameDelay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animations
  const animatedSpring = spring({
    frame: Math.max(0, frame - frameDelay),
    fps,
    config: { damping: 14, stiffness: 80, mass: 0.8 },
  });

  const radius = 160;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;
  
  // Safe clamping for percentage
  const safePercentage = Math.max(0, Math.min(100, percentage));
  const targetOffset = circumference - (safePercentage / 100) * circumference;
  const currentOffset = interpolate(animatedSpring, [0, 1], [circumference, targetOffset]);

  // Interpolate numerical value for the center text
  const currentPercentage = Math.round(interpolate(animatedSpring, [0, 1], [0, safePercentage]));

  const labelOpacity = interpolate(animatedSpring, [0.5, 1], [0, 1], { extrapolateLeft: "clamp" });
  const labelTranslateY = interpolate(animatedSpring, [0.5, 1], [10, 0], { extrapolateLeft: "clamp" });

  return (
    <div style={{ ...style, position: "relative", width: 400, height: 400, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={400} height={400} style={{ transform: "rotate(-90deg)" }}>
        {/* Track Circle */}
        <circle
          cx={200}
          cy={200}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Glow/Progress Circle */}
        <circle
          cx={200}
          cy={200}
          r={radius}
          fill="none"
          stroke={glowColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={currentOffset}
          style={{
            filter: `drop-shadow(0px 0px 16px ${glowColor})`,
          }}
        />
      </svg>
      
      {/* Centered Content */}
      <div style={{ position: "absolute", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{
          fontSize: 64,
          fontWeight: 800,
          color: "#fff",
          textShadow: `0px 0px 12px ${glowColor}80`,
          fontVariantNumeric: "tabular-nums"
        }}>
          {currentPercentage}%
        </span>
        <span style={{
          fontSize: 20,
          fontWeight: 500,
          color: "#A1A1AA",
          marginTop: 8,
          opacity: labelOpacity,
          transform: `translateY(${labelTranslateY}px)`
        }}>
          {label}
        </span>
      </div>
    </div>
  );
};
