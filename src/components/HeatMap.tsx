import React from "react";
import { AbsoluteFill, useVideoConfig, useCurrentFrame, spring, interpolate } from "remotion";
import { GlassCard } from "./GlassCard";
import type { HeatMapSceneProps } from "../types";

export const HeatMap: React.FC<HeatMapSceneProps & { data_points?: string[] }> = ({ heading, chart_data, style, data_points }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const titleSpring = spring({ frame, fps, config: { damping: 14, stiffness: 80, mass: 0.8 } });
  const titleTranslateY = interpolate(titleSpring, [0, 1], [-30, 0]);
  const bgOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });

  const safeData = chart_data?.length ? chart_data : (data_points || []).map(dp => ({ label: String(dp).substring(0, 15), value: 75 }));
  const maxVal = Math.max(...safeData.map(d => Number(d.value) || 0), 1);

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
            {heading}
          </h1>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 20, justifyContent: "center" }}>
          {safeData.map((item, i) => {
            const delay = i * 4;
            const itemSpring = spring({
              frame: frame - delay,
              fps,
              config: { damping: 14, stiffness: 80, mass: 0.8 },
            });
            const scale = interpolate(itemSpring, [0, 1], [0.8, 1]);
            const val = Number(item.value) || 0;
            const intensity = val / maxVal;
            const bgOpacity = 0.2 + (intensity * 0.6);

            return (
              <div
                key={i}
                style={{
                  opacity: Math.min(1, Math.max(0, itemSpring)),
                  transform: `scale(${scale})`,
                  background: `rgba(56, 189, 248, ${bgOpacity})`, // using a generic primary tint
                  border: `1px solid ${style.primaryColor || "#38bdf8"}50`,
                  borderRadius: 12,
                  padding: "30px",
                  minWidth: "150px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  zIndex: 10,
                  boxShadow: "0 4px 15px rgba(0,0,0,0.2)"
                }}
              >
                <div style={{ color: style.textColor || "#FFFFFF", fontSize: 24, fontWeight: 600, marginBottom: 10, position: "relative", zIndex: 20 }}>{item.label}</div>
                <div style={{ color: style.primaryColor || "#38bdf8", fontSize: 32, fontWeight: 800, position: "relative", zIndex: 20 }}>{val}</div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </AbsoluteFill>
  );
};
