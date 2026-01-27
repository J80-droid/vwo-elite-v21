/* eslint-disable react-hooks/purity */
// import React from 'react';
import { motion } from "framer-motion";

export const Confetti = () => {
  // Simple pure CSS/Framer confetti or placeholder
  // Generates 50 particles
  const particles = Array.from({ length: 50 });
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: -20, x: Math.random() * window.innerWidth, opacity: 1 }}
          animate={{
            y: window.innerHeight + 20,
            x: (Math.random() - 0.5) * 500 + Math.random() * window.innerWidth,
            rotate: Math.random() * 360,
          }}
          transition={{ duration: 2 + Math.random() * 2, ease: "linear" }}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: [
              "#ff0000",
              "#00ff00",
              "#0000ff",
              "#ffff00",
              "#ff00ff",
            ][Math.floor(Math.random() * 5)],
            left: 0,
            top: 0,
          }}
        />
      ))}
    </div>
  );
};
