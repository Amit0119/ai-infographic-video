import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import type { PieChartSceneProps } from "../types";

export const PieChartScene: React.FC<PieChartSceneProps> = ({
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

  const totalValue = chart_data.reduce((acc, curr) => acc + curr.value, 0);
  let cumulativeAngle = 0;

  const radius = Math.min(videoWidth, videoHeight) * 0.25;
  const cx = videoWidth / 2;
  const cy = videoHeight / 2 + 40;

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
      <svg
        width={videoWidth}
        height={videoHeight}
        viewBox={`0 0 ${videoWidth} ${videoHeight}`}
      >
        {chart_data.map((item, index) => {
          const slicePercentage = item.value / totalValue;
          const sliceAngle = slicePercentage * 360;
          const startAngle = cumulativeAngle;
          cumulativeAngle += sliceAngle;

          const popSpring = spring({
            frame: frame - index * 5,
            fps,
            config: { damping: 15, stiffness: 100 },
          });

          // SVG Arc calculation
          const startX = cx + radius * Math.cos((startAngle - 90) * (Math.PI / 180));
          const startY = cy + radius * Math.sin((startAngle - 90) * (Math.PI / 180));
          const endX = cx + radius * Math.cos((startAngle + sliceAngle - 90) * (Math.PI / 180));
          const endY = cy + radius * Math.sin((startAngle + sliceAngle - 90) * (Math.PI / 180));

          const largeArcFlag = sliceAngle > 180 ? 1 : 0;
          const pathData = `M ${cx} ${cy} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
          
          const labelAngle = startAngle + sliceAngle / 2;
          const labelRadius = radius * 1.3;
          const labelX = cx + labelRadius * Math.cos((labelAngle - 90) * (Math.PI / 180));
          const labelY = cy + labelRadius * Math.sin((labelAngle - 90) * (Math.PI / 180));

          // Generate somewhat distinct colors based on primaryColor
          const colors = [style.primaryColor, style.secondaryColor, style.accentColor, "#F59E0B", "#10B981", "#8B5CF6"];
          const fillColor = colors[index % colors.length];

          return (
            <g key={item.label} style={{ transform: `scale(${popSpring})`, transformOrigin: `${cx}px ${cy}px` }}>
              <path d={pathData} fill={fillColor} stroke={style.backgroundColor} strokeWidth={4} />
              {popSpring > 0.8 && (
                <text
                  x={labelX}
                  y={labelY}
                  fill={style.textColor}
                  fontSize={24}
                  fontWeight="bold"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  {item.label} ({Math.round(slicePercentage * 100)}%)
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
