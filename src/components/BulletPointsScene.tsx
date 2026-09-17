import React from 'react';
import { AbsoluteFill, useVideoConfig, useCurrentFrame, spring } from 'remotion';
import type { BulletPointsSceneProps } from '../types';

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
        padding: '80px 120px',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: style.fontFamily,
      }}
    >
      <h1
        style={{
          color: style.primaryColor,
          fontSize: '80px',
          fontWeight: 'bold',
          marginBottom: '60px',
          opacity: titleOpacity,
          transform: `translateY(${100 - titleY * 100}px)`,
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
    </AbsoluteFill>
  );
};
