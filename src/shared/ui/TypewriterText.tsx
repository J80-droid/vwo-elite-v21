/* eslint-disable react-hooks/set-state-in-effect */
/**
 * Typewriter Text Component
 * Displays text with a typing animation effect
 */

import React, { useEffect, useRef, useState } from "react";

interface TypewriterTextProps {
  text: string;
  speed?: number; // ms per character
  delay?: number; // ms before starting
  onComplete?: () => void;
  className?: string;
  cursor?: boolean;
  cursorChar?: string;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed = 20,
  delay = 0,
  onComplete,
  className = "",
  cursor = true,
  cursorChar = "▊",
}) => {
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const indexRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // Reset on text change
    setDisplayText("");
    indexRef.current = 0;
    setIsTyping(true);

    // Start after delay
    const startTimeout = setTimeout(() => {
      const typeChar = () => {
        if (indexRef.current < text.length) {
          setDisplayText(text.slice(0, indexRef.current + 1));
          indexRef.current++;
          timeoutRef.current = window.setTimeout(typeChar, speed);
        } else {
          setIsTyping(false);
          onComplete?.();
        }
      };
      typeChar();
    }, delay);

    return () => {
      clearTimeout(startTimeout);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [text, speed, delay, onComplete]);

  // Cursor blink effect
  useEffect(() => {
    if (!cursor) return;

    const blinkInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);

    return () => clearInterval(blinkInterval);
  }, [cursor]);

  return (
    <span className={className}>
      {displayText}
      {cursor && isTyping && (
        <span
          className="inline-block animate-pulse"
          style={{ opacity: showCursor ? 1 : 0 }}
        >
          {cursorChar}
        </span>
      )}
    </span>
  );
};

/**
 * Streaming Text Component
 * For use with AI streaming responses
 */
interface StreamingTextProps {
  chunks: string[];
  className?: string;
}

export const StreamingText: React.FC<StreamingTextProps> = ({
  chunks,
  className = "",
}) => {
  const [displayedChunks, setDisplayedChunks] = useState<string[]>([]);
  useEffect(() => {
    if (chunks.length > displayedChunks.length) {
      // New chunk arrived
      const newChunk = chunks[displayedChunks.length]!;
      setDisplayedChunks((prev) => [...prev, newChunk]);
    }
  }, [chunks, displayedChunks.length]);

  return (
    <span className={className}>
      {displayedChunks.map((chunk, idx) => (
        <span key={idx} className="animate-in fade-in duration-100">
          {chunk}
        </span>
      ))}
      {chunks.length > displayedChunks.length && (
        <span className="inline-block w-2 h-4 bg-current animate-pulse ml-0.5" />
      )}
    </span>
  );
};
