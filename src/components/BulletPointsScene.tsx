import React from "react";
import {
  AbsoluteFill,
  useVideoConfig,
  useCurrentFrame,
  spring,
  interpolate,
} from "remotion";
import type { BulletPointsSceneProps } from "../types";
import { GlassCard } from "./GlassCard";

/**
 * BulletPointsScene — Corporate bullet points with icon badges.
 *
 * Animations:
 * - Heading with left accent bar fades in
 * - Each bullet point slides in from right with stagger
 * - Gradient-bordered icon badges replace plain circles
 * - Subtle card backgrounds for each point
 */

const BULLET_ICONS = ["◆", "●", "■", "▸", "◇"];

export const BulletPointsScene: React.FC<BulletPointsSceneProps> = ({
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
        {/* Heading with left accent bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 50,
          }}
        >
          <div
            style={{
              width: 5,
              height: 50,
              borderRadius: 3,
              background: `linear-gradient(180deg, ${style.primaryColor}, ${style.accentColor || style.secondaryColor})`,
              flexShrink: 0,
            }}
          />
          <h1
            style={{
              color: style.textColor,
              fontSize: 52,
              fontWeight: 700,
              margin: 0,
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}
          >
            {heading}
          </h1>
        </div>

        {/* Bullet Points */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {content_points.map((point, index) => {
            const delay = index * 10 + 15;
            const pointSpring = spring({
              frame: frame - delay,
              fps,
              config: { damping: 16, stiffness: 70, mass: 0.8 },
            });
            const clamped = Math.max(0, pointSpring);
            const translateX = interpolate(clamped, [0, 1], [40, 0]);

            return (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 20,
                  opacity: clamped,
                  transform: `translateX(${translateX}px)`,
                  padding: "16px 24px",
                  borderRadius: 16,
                  background: `${style.primaryColor}06`,
                  border: `1px solid ${style.primaryColor}15`,
                }}
              >
                {/* Icon badge */}
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: `linear-gradient(135deg, ${style.primaryColor}20, ${style.primaryColor}08)`,
                    border: `1.5px solid ${style.primaryColor}30`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      color: style.primaryColor,
                    }}
                  >
                    {BULLET_ICONS[index % BULLET_ICONS.length]}
                  </span>
                </div>
                <span
                  style={{
                    color: style.textColor,
                    fontSize: 32,
                    lineHeight: 1.4,
                    fontWeight: 400,
                  }}
                >
                  {point}
                </span>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </AbsoluteFill>
  );
};
