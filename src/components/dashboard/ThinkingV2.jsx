import React from 'react';
import { motion } from 'framer-motion';

export default function ThinkingV2() {
  return (
    <div className="v2-thinking">
      <span className="v2-thinking-text">Plexis is thinking</span>
      <div className="v2-thinking-dots">
        <span className="v2-thinking-dot" />
        <span className="v2-thinking-dot" />
        <span className="v2-thinking-dot" />
      </div>
    </div>
  );
}
