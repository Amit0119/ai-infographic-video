import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import type { TimelineSceneProps } from "../types";
import { GlassCard } from "./GlassCard";

/**
 * TimelineScene — Professional milestone timeline with numbered markers.
 *
 * Animations:
 * - Gradient connecting line draws in from left
 * - Numbered milestone circles pop in sequentially
 * - Milestone cards alternate above/below the line
 * - Connecting stems animate between cards and line
 */
export const TimelineScene: React.FC<TimelineSceneProps> = ({
  title,
  chart_data,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 80, mass: 0.8 },
  });
  const titleTranslateY = interpolate(titleSpring, [0, 1], [-30, 0]);

  const bgOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  const lineProgress = spring({
    frame: frame - 10,
    fps,
    config: { damping: 40, stiffness: 20 },
  });
  const clampedLine = Math.max(0, Math.min(1, lineProgress));

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "transparent",
        opacity: bgOpacity,
        fontFamily: style.fontFamily,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <GlassCard
        style={style}
        width="90%"
        height="80%"
        opacity={titleSpring}
        transform={`translateY(${titleTranslateY}px)`}
      >
        <h2
          style={{
            textAlign: "center",
            fontSize: 44,
            fontWeight: 700,
            color: style.textColor,
            margin: 0,
            marginBottom: 60,
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </h2>

        {/* Timeline container */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            position: "relative",
            padding: "0 40px",
          }}
        >
          {/* Horizontal gradient line */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: 60,
              right: 60,
              height: 3,
              background: `linear-gradient(90deg, ${style.primaryColor}50, ${style.secondaryColor || style.primaryColor}50)`,
              borderRadius: 2,
              transform: `scaleX(${clampedLine})`,
              transformOrigin: "left center",
            }}
          />

          {/* Milestone markers */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              position: "relative",
              padding: "0 40px",
            }}
          >
            {chart_data.map((item, index) => {
              const milestoneSpring = spring({
                frame: frame - 15 - index * 12,
                fps,
                config: { damping: 14, stiffness: 80, mass: 0.7 },
              });
              const clamped = Math.max(0, milestoneSpring);
              const isAbove = index % 2 === 0;

              return (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    opacity: clamped,
                    transform: `scale(${clamped})`,
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: isAbove
                        ? "column"
                        : "column-reverse",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    {/* Label card */}
                    <div
                      style={{
                        padding: "14px 24px",
                        borderRadius: 16,
                        background: `${style.primaryColor}10`,
                        border: `1.5px solid ${style.primaryColor}30`,
                        textAlign: "center",
                        maxWidth: 200,
                        boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 20,
                          fontWeight: 600,
                          color: style.textColor,
                          lineHeight: 1.3,
                        }}
                      >
                        {item.label}
                      </span>
                    </div>

                    {/* Connector stem */}
                    <div
                      style={{
                        width: 2,
                        height: 30,
                        background: `linear-gradient(${isAbove ? "180deg" : "0deg"}, ${style.primaryColor}60, transparent)`,
                      }}
                    />

                    {/* Numbered circle on timeline */}
                    <div style={{ position: "relative" }}>
                      {/* Glow */}
                      <div
                        style={{
                          position: "absolute",
                          top: -6,
                          left: -6,
                          width: 48,
                          height: 48,
                          borderRadius: "50%",
                          background: style.primaryColor,
                          opacity: 0.15,
                          filter: "blur(6px)",
                        }}
                      />
                      {/* Step number */}
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: `linear-gradient(135deg, ${style.primaryColor}, ${style.secondaryColor || style.primaryColor})`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 16,
                          fontWeight: 700,
                          color: style.backgroundColor,
                          boxShadow: `0 2px 8px ${style.primaryColor}40`,
                        }}
                      >
                        {index + 1}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </GlassCard>
    </AbsoluteFill>
  );
};
