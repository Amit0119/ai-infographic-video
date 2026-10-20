import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export interface VarianceDataPoint {
  label: string;
  budget: number;
  actual: number;
}

export interface VarianceBarChartProps {
  data: VarianceDataPoint[];
  budgetColor?: string;
  actualColorUnder?: string; // Color when actual <= budget (e.g. Green)
  actualColorOver?: string; // Color when actual > budget (e.g. Red)
  style?: React.CSSProperties;
  frameDelay?: number;
}

export const VarianceBarChart: React.FC<VarianceBarChartProps> = ({
  data,
  budgetColor = "rgba(161, 161, 170, 0.4)", // Muted/glassy grey
  actualColorUnder = "#10B981", // Green
  actualColorOver = "#EF4444", // Red/Orange
  style,
  frameDelay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Find max value for scaling
  const maxValue = Math.max(...data.map(d => Math.max(d.budget, d.actual)), 1);
  const chartHeight = 300;
  const barWidth = 40;
  const groupGap = 60;
  const barGap = 8;
  const chartWidth = data.length * (barWidth * 2 + barGap) + (data.length - 1) * groupGap;

  return (
    <div style={{ ...style, display: "flex", flexDirection: "row", alignItems: "flex-end", height: chartHeight + 60, gap: groupGap }}>
      {data.map((item, index) => {
        const staggerDelay = frameDelay + index * 5;
        
        // Spring animation for height
        const barSpring = spring({
          frame: Math.max(0, frame - staggerDelay),
          fps,
          config: { damping: 16, stiffness: 90, mass: 0.9 },
        });
        
        const labelOpacity = interpolate(barSpring, [0.8, 1], [0, 1], { extrapolateLeft: "clamp" });

        const budgetHeight = (item.budget / maxValue) * chartHeight;
        const actualHeight = (item.actual / maxValue) * chartHeight;
        
        const isOver = item.actual > item.budget;
        const actualColor = isOver ? actualColorOver : actualColorUnder;

        return (
          <div key={item.label} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            {/* Bars container */}
            <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-end", gap: barGap, height: chartHeight, marginBottom: 16 }}>
              {/* Budget Bar */}
              <div style={{
                width: barWidth,
                height: budgetHeight * barSpring,
                backgroundColor: budgetColor,
                borderRadius: "6px 6px 0 0",
                position: "relative",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(4px)"
              }}>
                <span style={{ position: "absolute", top: -24, width: "100%", textAlign: "center", fontSize: 14, color: "#A1A1AA", opacity: labelOpacity }}>
                  {item.budget}
                </span>
              </div>
              
              {/* Actual Bar */}
              <div style={{
                width: barWidth,
                height: actualHeight * barSpring,
                backgroundColor: actualColor,
                borderRadius: "6px 6px 0 0",
                position: "relative",
                boxShadow: `0 0 16px ${actualColor}60`
              }}>
                <span style={{ position: "absolute", top: -24, width: "100%", textAlign: "center", fontSize: 14, color: "#FFF", fontWeight: "bold", opacity: labelOpacity }}>
                  {item.actual}
                </span>
              </div>
            </div>
            
            {/* X-Axis Label */}
            <div style={{ fontSize: 18, color: "#E4E4E7", fontWeight: 600, opacity: labelOpacity }}>
              {item.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};
