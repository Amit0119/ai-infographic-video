import React from "react";
import { AbsoluteFill, useVideoConfig, useCurrentFrame, spring, interpolate } from "remotion";
import { GlassCard } from "./GlassCard";
import type { SplitScreenSceneProps } from "../types";

export const SplitScreen: React.FC<SplitScreenSceneProps & { data_points?: string[] }> = ({ title, left_content, right_content, style, data_points }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const titleSpring = spring({ frame, fps, config: { damping: 14, stiffness: 80, mass: 0.8 } });
  const titleTranslateY = interpolate(titleSpring, [0, 1], [-30, 0]);
  const bgOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });

  const leftSpring = spring({ frame: frame - 5, fps, config: { damping: 14, stiffness: 80, mass: 0.8 } });
  const rightSpring = spring({ frame: frame - 15, fps, config: { damping: 14, stiffness: 80, mass: 0.8 } });
  
  const leftTranslateX = interpolate(leftSpring, [0, 1], [-50, 0]);
  const rightTranslateX = interpolate(rightSpring, [0, 1], [50, 0]);

  const actualLeft = left_content || (data_points && data_points[0]) || 'No Data';
  const actualRight = right_content || (data_points && data_points[1]) || 'No Data';

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "transparent",
        opacity: bgOpacity,
        padding: "80px 120px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: style.fontFamily,
      }}
    >
      <GlassCard style={style} width="100%" opacity={Math.min(1, Math.max(0, titleSpring))} transform={`translateY(${titleTranslateY}px)`}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 50 }}>
          <div style={{
            width: 5, height: 50, borderRadius: 3,
            background: `linear-gradient(180deg, ${style.primaryColor}, ${style.accentColor || style.secondaryColor})`,
            flexShrink: 0,
          }} />
          <h1 style={{ color: style.textColor || "#FFFFFF", fontSize: 52, fontWeight: 700, margin: 0, letterSpacing: "-0.02em", lineHeight: 1.2, position: "relative", zIndex: 10 }}>
            {title}
          </h1>
        </div>

        <div style={{ display: "flex", gap: 40 }}>
          <div style={{
            flex: 1, opacity: Math.min(1, Math.max(0, leftSpring)), transform: `translateX(${leftTranslateX}px)`,
            background: `linear-gradient(135deg, ${style.primaryColor || "#38bdf8"}20, rgba(255,255,255,0.05))`,
            border: `1px solid ${style.primaryColor || "#38bdf8"}60`,
            borderRadius: 16, padding: "40px",
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative", zIndex: 10, boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
          }}>
            <h2 style={{ color: style.textColor || "#FFFFFF", fontSize: 36, fontWeight: 600, textAlign: "center", textShadow: "0px 2px 4px rgba(0,0,0,0.4)" }}>{actualLeft}</h2>
          </div>
          <div style={{
            flex: 1, opacity: Math.min(1, Math.max(0, rightSpring)), transform: `translateX(${rightTranslateX}px)`,
            background: `linear-gradient(135deg, ${style.accentColor || style.secondaryColor || "#818cf8"}20, rgba(255,255,255,0.05))`,
            border: `1px solid ${style.accentColor || style.secondaryColor || style.primaryColor || "#818cf8"}60`,
            borderRadius: 16, padding: "40px",
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative", zIndex: 10, boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
          }}>
            <h2 style={{ color: style.textColor || "#FFFFFF", fontSize: 36, fontWeight: 600, textAlign: "center", textShadow: "0px 2px 4px rgba(0,0,0,0.4)" }}>{actualRight}</h2>
          </div>
        </div>
      </GlassCard>
    </AbsoluteFill>
  );
};
