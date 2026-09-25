import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';

export interface WordToken {
  word: string;
  start: number;
  end: number;
}

export interface CaptionsProps {
  captions?: WordToken[];
  style: any;
}

export const Captions: React.FC<CaptionsProps> = ({ captions, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (!captions || captions.length === 0) return null;
  const currentTime = frame / fps;

  // Find the currently active word index
  let activeIndex = -1;
  for (let i = 0; i < captions.length; i++) {
    if (currentTime >= captions[i].start && currentTime <= captions[i].end) {
      activeIndex = i;
      break;
    }
  }

  // If no word is exactly active (e.g., a pause), find the closest previous word
  if (activeIndex === -1) {
      for (let i = captions.length - 1; i >= 0; i--) {
          if (currentTime >= captions[i].end) {
              activeIndex = i;
              break;
          }
      }
  }

  // To create a rolling window, display a max of 7 words.
  const startIdx = Math.max(0, activeIndex - 3);
  const endIdx = Math.min(captions.length - 1, activeIndex + 3);
  const visibleWords = captions.slice(startIdx, endIdx + 1);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 40,
        left: '10%',
        right: '10%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px 40px',
        gap: '16px',
        borderRadius: 24,
        background: `linear-gradient(135deg, ${style?.backgroundColor}CC, ${style?.backgroundColor}99)`,
        border: `1px solid ${style?.primaryColor}40`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.5)`,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        zIndex: 2000,
        pointerEvents: 'none'
      }}
    >
      {visibleWords.map((token, idx) => {
        const isActuallyActive = currentTime >= token.start && currentTime <= token.end;
        
        return (
          <span
            key={`${token.start}-${idx}`}
            style={{
              fontFamily: style?.fontFamily || 'Inter',
              fontSize: isActuallyActive ? '60px' : '48px',
              fontWeight: 800,
              color: isActuallyActive ? (style?.accentColor || '#38bdf8') : 'rgba(255, 255, 255, 0.5)',
              textShadow: isActuallyActive ? `0px 0px 20px ${style?.accentColor}80` : 'none',
              transform: isActuallyActive ? 'translateY(-4px)' : 'translateY(0px)',
              transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            }}
          >
            {token.word}
          </span>
        );
      })}
    </div>
  );
};
