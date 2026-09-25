import React from 'react';
import { AbsoluteFill, useVideoConfig, useCurrentFrame, spring } from 'remotion';
import type { BulletPointsSceneProps } from '../types';
import { GlassCard } from './GlassCard';

export const BulletPointsScene: React.FC<BulletPointsSceneProps> = ({
  heading,
  content_points,
  style,
}) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const titleOpacity = spring({
    frame,
    fps,
    config: { damping: 200 },
  });
  const titleY = spring({
    frame,
    fps,
    config: { damping: 100 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: style.backgroundColor,
        padding: '120px 160px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: style.fontFamily,
      }}
    >
      <GlassCard style={style} width="100%" opacity={titleOpacity} transform={`translateY(${100 - titleY * 100}px)`}>
        <h1
          style={{
            color: style.textColor,
            fontSize: '72px',
            fontWeight: 'bold',
            marginBottom: '60px',
            textAlign: 'center',
            letterSpacing: '-0.02em',
          }}
        >
          {heading}
        </h1>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        {content_points.map((point, index) => {
          const pointFrame = frame - (index * 15 + 20); // Stagger by 15 frames
          const pointOpacity = spring({
            frame: pointFrame,
            fps,
            config: { damping: 200 },
          });
          const pointX = spring({
            frame: pointFrame,
            fps,
            config: { damping: 100 },
          });

          return (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                opacity: pointOpacity,
                transform: `translateX(${50 - pointX * 50}px)`,
              }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: style.accentColor,
                  marginRight: '30px',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  color: style.textColor,
                  fontSize: '48px',
                  lineHeight: '1.4',
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
