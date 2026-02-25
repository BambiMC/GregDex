"use client";

import { useState, useRef, useEffect } from "react";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
}

export default function Tooltip({ content, children, className = "" }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const tooltipHeight = 32; // Approximate height of tooltip
      const tooltipWidth = 200; // Max width of tooltip
      
      let top = rect.top - tooltipHeight - 4;
      let left = rect.left + rect.width / 2 - tooltipWidth / 2;
      
      // Keep tooltip within viewport bounds
      if (top < 0) {
        top = rect.bottom + 4;
      }
      if (left < 4) {
        left = 4;
      }
      if (left + tooltipWidth > window.innerWidth - 4) {
        left = window.innerWidth - tooltipWidth - 4;
      }
      
      setPosition({ top, left });
    }
  }, [isVisible]);

  return (
    <div
      ref={containerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className="mc-tooltip fixed z-50 max-w-xs whitespace-normal"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
}
