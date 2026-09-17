import React from 'react';
import { AbsoluteFill, useVideoConfig, useCurrentFrame, spring } from 'remotion';
import type { NumberedStepsSceneProps } from '../types';

export const NumberedStepsScene: React.FC<NumberedStepsSceneProps> = ({
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
        }}
      >
        {heading}
      </h1>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        {content_points.map((point, index) => {
          const pointFrame = frame - (index * 20 + 20); // Stagger by 20 frames
          const pointOpacity = spring({
            frame: pointFrame,
            fps,
            config: { damping: 200 },
          });
          const pointScale = spring({
            frame: pointFrame,
            fps,
            config: { damping: 12 },
          });

          return (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                opacity: pointOpacity,
              }}
            >
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '16px',
                  backgroundColor: style.secondaryColor,
                  color: style.backgroundColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '40px',
                  fontWeight: 'bold',
                  marginRight: '40px',
                  flexShrink: 0,
                  transform: `scale(${pointScale})`,
                }}
              >
                {index + 1}
              </div>
              <span
                style={{
                  color: style.textColor,
                  fontSize: '48px',
                  lineHeight: '1.4',
                  marginTop: '10px',
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
