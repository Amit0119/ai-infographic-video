import React from "react";
import { AbsoluteFill, OffthreadVideo, useCurrentFrame, interpolate } from "remotion";

/**
 * BRollBackground — Renders a full-screen cinematic B-roll video
 * behind the scene content with a dark overlay so the GlassCards
 * remain readable.
 *
 * Features:
 * - Fades in over the first 20 frames
 * - Dark gradient overlay (60% opacity) ensures text legibility
 * - Slow zoom (Ken Burns effect) adds subtle cinematic motion
 * - Muted playback — audio comes from TTS, not the stock footage
 * - Graceful fallback: renders nothing if URL is missing or invalid
 */
export const BRollBackground: React.FC<{
  src: string;
  style: { backgroundColor: string; primaryColor: string };
}> = ({ src, style }) => {
  const frame = useCurrentFrame();

  // Fade in the video over the first 20 frames
  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Slow Ken Burns zoom: 1.0 → 1.08 over 300 frames
  const scale = interpolate(frame, [0, 300], [1.0, 1.08], {
    extrapolateRight: "extend",
  });

  return (
    <AbsoluteFill style={{ opacity, zIndex: 0 }}>
      {/* The actual B-roll video */}
      <AbsoluteFill
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        <OffthreadVideo
          src={src}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
          muted
          // If Remotion encounters a playback error, it'll just show nothing
          onError={() => {}}
        />
      </AbsoluteFill>

      {/* Dark cinematic overlay so GlassCards remain readable */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(
            180deg,
            ${style.backgroundColor}CC 0%,
            ${style.backgroundColor}99 40%,
            ${style.backgroundColor}B3 70%,
            ${style.backgroundColor}E6 100%
          )`,
        }}
      />

      {/* Subtle vignette for that documentary feel */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(
            ellipse at center,
            transparent 40%,
            ${style.backgroundColor} 100%
          )`,
          opacity: 0.5,
        }}
      />
    </AbsoluteFill>
  );
};
