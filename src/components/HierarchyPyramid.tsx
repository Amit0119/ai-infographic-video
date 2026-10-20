import React from "react";
import { AbsoluteFill, useVideoConfig, useCurrentFrame, spring, interpolate } from "remotion";
import { GlassCard } from "./GlassCard";
import type { HierarchyPyramidSceneProps } from "../types";

export const HierarchyPyramid: React.FC<HierarchyPyramidSceneProps & { data_points?: string[] }> = ({ heading, content_points, style, data_points }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const titleSpring = spring({ frame, fps, config: { damping: 14, stiffness: 80, mass: 0.8 } });
  const titleTranslateY = interpolate(titleSpring, [0, 1], [-30, 0]);
  const bgOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });

  const safePoints = content_points?.length ? content_points : (data_points || []);
  const numPoints = safePoints.length;

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

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          {safePoints.map((point, i) => {
            const delay = (numPoints - i) * 6;
            const itemSpring = spring({
              frame: frame - delay,
              fps,
              config: { damping: 14, stiffness: 80, mass: 0.8 },
            });
            const scale = interpolate(itemSpring, [0, 1], [0.8, 1]);
            
            // Pyramid width calculation: top is smaller, bottom is larger
            const widthPercent = 40 + (i / Math.max(numPoints - 1, 1)) * 60;
            const isTop = i === 0;

            return (
              <div
                key={i}
                style={{
                  opacity: Math.min(1, Math.max(0, itemSpring)),
                  transform: `scale(${scale})`,
                  width: `${widthPercent}%`,
                  background: `linear-gradient(90deg, ${style.primaryColor || "#38bdf8"}30, ${style.primaryColor || "#38bdf8"}60)`,
                  border: `1px solid ${style.primaryColor || "#38bdf8"}80`,
                  borderTopLeftRadius: isTop ? 20 : 8,
                  borderTopRightRadius: isTop ? 20 : 8,
                  borderBottomLeftRadius: 8,
                  borderBottomRightRadius: 8,
                  padding: "20px",
                  textAlign: "center",
                  position: "relative",
                  zIndex: 10,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
                }}
              >
                <div style={{ color: style.textColor || "#FFFFFF", fontSize: 28, fontWeight: 700, textShadow: "0px 2px 4px rgba(0,0,0,0.5)", position: "relative", zIndex: 20 }}>{point}</div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </AbsoluteFill>
  );
};
