import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ArrowRight, Check } from "lucide-react";
import type { ChecklistOutroSceneProps } from "../../types";
import { ExplainerIcon } from "./ExplainerIcon";

export const ChecklistOutroScene: React.FC<ChecklistOutroSceneProps> = ({
  headline,
  items,
  cta_text,
  icon = "shield-check",
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const surface = style.surfaceColor || "#FFFFFF";
  const primary = style.primaryColor || "#2563EB";
  const secondary = style.secondaryColor || "#0EA5E9";
  const accent = style.accentColor || "#10B981";
  const textColor = style.textColor || "#0F172A";
  const fontFamily = style.fontFamily || "Inter, sans-serif";

  const headSpring = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const visibleItems = (items || []).slice(0, 4);
  const ctaDelay = 20 + visibleItems.length * 24 + 8;
  const ctaSpring = spring({
    frame: Math.max(0, frame - ctaDelay),
    fps,
    config: { damping: 12, stiffness: 115 },
  });

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "70px 150px",
        fontFamily,
      }}
    >
      {/* Header with Icon */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 22,
          marginBottom: 48,
          transform: `translateY(${interpolate(headSpring, [0, 1], [28, 0])}px)`,
          opacity: headSpring,
        }}
      >
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: 22,
            backgroundColor: `${accent}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ExplainerIcon name={icon} size={42} color={accent} strokeWidth={2.3} />
        </div>
        <h2
          style={{
            margin: 0,
            fontSize: 60,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: textColor,
          }}
        >
          {headline}
        </h2>
      </div>

      {/* Animated Checklist Rows */}
      <div
        style={{
          width: "100%",
          maxWidth: 1240,
          display: "flex",
          flexDirection: "column",
          gap: 24,
          marginBottom: cta_text ? 50 : 0,
        }}
      >
        {visibleItems.map((rule, idx) => {
          const rowDelay = 16 + idx * 24;
          const rowSpring = spring({
            frame: Math.max(0, frame - rowDelay),
            fps,
            config: { damping: 14, stiffness: 115 },
          });
          const checkPop = spring({
            frame: Math.max(0, frame - (rowDelay + 6)),
            fps,
            config: { damping: 10, stiffness: 180 },
          });

          return (
            <div
              key={idx}
              style={{
                backgroundColor: surface,
                borderRadius: 24,
                padding: "30px 40px",
                display: "flex",
                alignItems: "center",
                gap: 28,
                boxShadow: "0 18px 44px rgba(15, 23, 42, 0.06), 0 4px 12px rgba(15, 23, 42, 0.03)",
                border: "1px solid rgba(15, 23, 42, 0.06)",
                transform: `translateX(${interpolate(rowSpring, [0, 1], [-48, 0])}px)`,
                opacity: rowSpring,
              }}
            >
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: "50%",
                  backgroundColor: accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: `0 10px 22px ${accent}40`,
                  transform: `scale(${checkPop})`,
                }}
              >
                <Check size={32} color="#FFFFFF" strokeWidth={3.2} />
              </div>

              <div
                style={{
                  fontSize: 34,
                  fontWeight: 600,
                  color: textColor,
                  lineHeight: 1.3,
                }}
              >
                {rule}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Branded CTA Pill */}
      {cta_text && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 18,
            padding: "22px 44px",
            borderRadius: 999,
            background: `linear-gradient(135deg, ${primary}, ${secondary})`,
            color: "#FFFFFF",
            fontSize: 30,
            fontWeight: 700,
            boxShadow: `0 18px 40px ${primary}38`,
            transform: `translateY(${interpolate(ctaSpring, [0, 1], [28, 0])}px) scale(${interpolate(ctaSpring, [0, 1], [0.92, 1])})`,
            opacity: ctaSpring,
          }}
        >
          <span>{cta_text}</span>
          <ArrowRight size={30} color="#FFFFFF" strokeWidth={2.8} />
        </div>
      )}
    </AbsoluteFill>
  );
};