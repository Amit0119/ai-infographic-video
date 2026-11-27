import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { StepFlowSceneProps } from "../../types";
import { ExplainerIcon } from "./ExplainerIcon";

export const StepFlowScene: React.FC<StepFlowSceneProps> = ({
  headline,
  steps,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const surface = style.surfaceColor || "#FFFFFF";
  const primary = style.primaryColor || "#2563EB";
  const secondary = style.secondaryColor || "#0EA5E9";
  const accent = style.accentColor || "#10B981";
  const textColor = style.textColor || "#0F172A";
  const subtextColor = style.subtextColor || "#475569";
  const fontFamily = style.fontFamily || "Inter, sans-serif";

  const headSpring = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const visibleSteps = (steps || []).slice(0, 3);
  const stepColors = [primary, secondary, accent];

  const renderAnimatedArrow = (startFrame: number, color: string) => {
    const progress = interpolate(frame, [startFrame, startFrame + 18], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const dashOffset = interpolate(progress, [0, 1], [86, 0]);
    const headOpacity = interpolate(progress, [0.65, 1], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    return (
      <div
        style={{
          width: 92,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg width="88" height="44" viewBox="0 0 88 44" fill="none">
          <line
            x1="4"
            y1="22"
            x2="72"
            y2="22"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="86"
            strokeDashoffset={dashOffset}
          />
          <polyline
            points="58,9 76,22 58,35"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={headOpacity}
          />
        </svg>
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
        padding: "70px 96px",
        fontFamily,
      }}
    >
      {/* Headline */}
      <h2
        style={{
          margin: "0 0 72px 0",
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

      {/* 3-Step Flow Row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
        }}
      >
        {visibleSteps.map((item, idx) => {
          const cardDelay = 14 + idx * 36;
          const cardSpring = spring({
            frame: Math.max(0, frame - cardDelay),
            fps,
            config: { damping: 12, stiffness: 115 },
          });
          const stepColor = stepColors[idx % stepColors.length];
          const stepNumber = item.step ?? idx + 1;

          return (
            <React.Fragment key={stepNumber}>
              <div
                style={{
                  flex: 1,
                  maxWidth: 480,
                  minHeight: 420,
                  backgroundColor: surface,
                  borderRadius: 30,
                  padding: "46px 38px",
                  boxShadow: "0 22px 54px rgba(15, 23, 42, 0.06), 0 4px 14px rgba(15, 23, 42, 0.03)",
                  border: `1.5px solid ${stepColor}24`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  transform: `translateY(${interpolate(cardSpring, [0, 1], [44, 0])}px) scale(${interpolate(cardSpring, [0, 1], [0.92, 1])})`,
                  opacity: cardSpring,
                }}
              >
                {/* Step Number Pill */}
                <div
                  style={{
                    padding: "8px 20px",
                    borderRadius: 999,
                    backgroundColor: `${stepColor}18`,
                    color: stepColor,
                    fontSize: 20,
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                    marginBottom: 28,
                  }}
                >
                  STEP 0{stepNumber}
                </div>

                {/* Icon Container */}
                <div
                  style={{
                    width: 112,
                    height: 112,
                    borderRadius: "50%",
                    backgroundColor: `${stepColor}14`,
                    border: `2px solid ${stepColor}30`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 28,
                  }}
                >
                  <ExplainerIcon name={item.icon} size={54} color={stepColor} strokeWidth={2.2} />
                </div>

                {/* Step Title */}
                <div
                  style={{
                    fontSize: 38,
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                    color: textColor,
                    marginBottom: 14,
                    lineHeight: 1.15,
                  }}
                >
                  {item.title}
                </div>

                {/* Step Subtext */}
                <p
                  style={{
                    margin: 0,
                    fontSize: 25,
                    fontWeight: 500,
                    color: subtextColor,
                    lineHeight: 1.38,
                  }}
                >
                  {item.subtext}
                </p>
              </div>

              {idx < visibleSteps.length - 1 &&
                renderAnimatedArrow(cardDelay + 18, stepColor)}
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};