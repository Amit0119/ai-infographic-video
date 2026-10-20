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

/**
 * GlassCard — Premium glassmorphism container with subtle gradient border.
 *
 * Features:
 * - Gradient background that adapts to theme colors
 * - Top edge highlight for depth
 * - Enhanced blur and shadow for premium glass effect
 * - Subtle inset glow based on primary brand color
 */
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
        borderRadius: 28,
        background: style.videoOverlayColor || `linear-gradient(165deg, ${style.backgroundColor}d1, ${style.backgroundColor}a6)`,
        border: `1px solid ${style.primaryColor}22`,
        boxShadow: `0 0 60px ${style.primaryColor}08, 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 ${style.primaryColor}10`,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        color: style.textColor,
        fontFamily: style.fontFamily,
        opacity,
        transform,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top edge highlight for glass depth */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "10%",
          right: "10%",
          height: 1,
          background: `linear-gradient(90deg, transparent, ${style.primaryColor}30, transparent)`,
          borderRadius: 1,
        }}
      />
      {children}
    </div>
  );
};
