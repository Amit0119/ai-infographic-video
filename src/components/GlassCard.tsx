import React from "react";
import type { SceneStyle } from "../types";

export interface GlassCardProps {
  children: React.ReactNode;
  style: SceneStyle;
  padding?: string;
  width?: number | string;
  height?: number | string;
  opacity?: number;
  transform?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  padding = "60px",
  width,
  height,
  opacity = 1,
  transform = "none"
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding,
        width,
        height,
        borderRadius: 32,
        background: `linear-gradient(135deg, ${style.backgroundColor}B3, ${style.backgroundColor}80)`,
        border: `1px solid ${style.primaryColor}30`,
        boxShadow: `0 0 80px ${style.primaryColor}15, 0 8px 32px rgba(0,0,0,0.4)`,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        color: style.textColor,
        fontFamily: style.fontFamily,
        opacity,
        transform,
      }}
    >
      {children}
    </div>
  );
};
