import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import type { TimelineSceneProps } from "../types";

export const TimelineScene: React.FC<TimelineSceneProps> = ({
  title,
  chart_data,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps, width: videoWidth, height: videoHeight } = useVideoConfig();

  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 80, mass: 0.8 },
  });
  const titleTranslateY = interpolate(titleSpring, [0, 1], [-30, 0]);

  const bgOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  const timelineY = videoHeight / 2 + 20;
  const paddingX = 120;
  const usableWidth = videoWidth - paddingX * 2;
  const gap = usableWidth / Math.max(chart_data.length - 1, 1);

  const drawProgress = spring({
    frame: frame - 10,
    fps,
    config: { damping: 40, stiffness: 20 },
  });
  const currentDrawWidth = usableWidth * Math.max(0, Math.min(1, drawProgress));

  return (
    <AbsoluteFill
      style={{
        backgroundColor: style.backgroundColor,
        opacity: bgOpacity,
        fontFamily: style.fontFamily,
      }}
    >
      <h2
        style={{
          position: "absolute",
          top: 40,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 44,
          fontWeight: 700,
          color: style.textColor,
          margin: 0,
          opacity: titleSpring,
          transform: `translateY(${titleTranslateY}px)`,
        }}
      >
        {title}
      </h2>

      <svg width={videoWidth} height={videoHeight} style={{ position: "absolute", top: 0, left: 0 }}>
        {/* Main timeline line */}
        <line
          x1={paddingX}
          y1={timelineY}
          x2={paddingX + currentDrawWidth}
          y2={timelineY}
          stroke={style.subtextColor}
          strokeWidth={4}
          strokeLinecap="round"
        />

        {chart_data.map((item, index) => {
          const x = paddingX + gap * index;
          const isVisible = currentDrawWidth >= gap * index;

          const dotSpring = spring({
            frame: isVisible ? frame - 10 - index * 5 : 0,
            fps,
            config: { damping: 12, stiffness: 80 },
          });

          // Alternate above and below
          const labelYOffset = index % 2 === 0 ? -60 : 80;

          return (
            <g key={item.label} style={{ opacity: dotSpring }}>
              {/* Vertical tick */}
              <line
                x1={x}
                y1={timelineY - 15}
                x2={x}
                y2={timelineY + 15}
                stroke={style.primaryColor}
                strokeWidth={3}
              />
              
              {/* Dot */}
              <circle
                cx={x}
                cy={timelineY}
                r={8 * dotSpring}
                fill={style.primaryColor}
              />

              <text
                x={x}
                y={timelineY + labelYOffset}
                fill={style.textColor}
                fontSize={24}
                fontWeight="bold"
                textAnchor="middle"
              >
                {item.label}
              </text>
              <text
                x={x}
                y={timelineY + labelYOffset + 25}
                fill={style.subtextColor}
                fontSize={20}
                textAnchor="middle"
              >
                {item.value}
              </text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
