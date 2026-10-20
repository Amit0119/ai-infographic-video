import React from "react";
import {
  AbsoluteFill,
  useVideoConfig,
  useCurrentFrame,
  spring,
  interpolate,
} from "remotion";
import type { NumberedStepsSceneProps } from "../types";
import { GlassCard } from "./GlassCard";

/**
 * NumberedStepsScene — Process steps with connecting progress line.
 *
 * Animations:
 * - Heading fades in
 * - Vertical connecting line draws downward
 * - Gradient step number circles scale in with bounce
 * - Step content cards slide in from right with stagger
 */
export const NumberedStepsScene: React.FC<NumberedStepsSceneProps> = ({
  heading,
  content_points,
  style,
}) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 80, mass: 0.8 },
  });
  const titleTranslateY = interpolate(titleSpring, [0, 1], [-30, 0]);
  const bgOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

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
      <GlassCard
        style={style}
        width="100%"
        opacity={titleSpring}
        transform={`translateY(${titleTranslateY}px)`}
      >
        <h1
          style={{
            color: style.textColor,
            fontSize: 52,
            fontWeight: 700,
            textAlign: "center",
            letterSpacing: "-0.02em",
            margin: 0,
            marginBottom: 50,
          }}
        >
          {heading}
        </h1>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 0,
            position: "relative",
          }}
        >
          {/* Connecting vertical line */}
          <div
            style={{
              position: "absolute",
              left: 35,
              top: 40,
              bottom: 40,
              width: 2,
              background: `linear-gradient(180deg, ${style.primaryColor}40, ${style.secondaryColor || style.primaryColor}40, transparent)`,
              borderRadius: 1,
            }}
          />

          {content_points.map((point, index) => {
            const delay = index * 15 + 15;
            const pointSpring = spring({
              frame: frame - delay,
              fps,
              config: { damping: 14, stiffness: 70, mass: 0.8 },
            });
            const clamped = Math.max(0, pointSpring);
            const scaleSpring = spring({
              frame: frame - delay,
              fps,
              config: { damping: 12, stiffness: 100, mass: 0.6 },
            });
            const clampedScale = Math.max(0, scaleSpring);

            return (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 28,
                  opacity: clamped,
                  padding: "20px 0",
                }}
              >
                {/* Step number circle with glow */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div
                    style={{
                      position: "absolute",
                      top: -4,
                      left: -4,
                      width: 78,
                      height: 78,
                      borderRadius: "50%",
                      background: style.primaryColor,
                      opacity: 0.1 * clampedScale,
                      filter: "blur(6px)",
                    }}
                  />
                  <div
                    style={{
                      width: 70,
                      height: 70,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${style.primaryColor}, ${style.secondaryColor || style.primaryColor})`,
                      color: style.backgroundColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 32,
                      fontWeight: 800,
                      transform: `scale(${clampedScale})`,
                      boxShadow: `0 4px 16px ${style.primaryColor}30`,
                    }}
                  >
                    {index + 1}
                  </div>
                </div>

                {/* Step content card */}
                <div
                  style={{
                    flex: 1,
                    padding: "18px 24px",
                    borderRadius: 16,
                    background: `${style.primaryColor}06`,
                    border: `1px solid ${style.primaryColor}12`,
                    transform: `translateX(${interpolate(clamped, [0, 1], [30, 0])}px)`,
                  }}
                >
                  <span
                    style={{
                      color: style.textColor,
                      fontSize: 32,
                      lineHeight: 1.4,
                    }}
                  >
                    {point}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </AbsoluteFill>
  );
};
