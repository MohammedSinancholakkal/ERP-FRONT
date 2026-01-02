import React, { useEffect, useState } from 'react';

const FireflyEffect = ({ count = 30 }) => {
  const [fireflies, setFireflies] = useState([]);

  useEffect(() => {
    // Generate initial fireflies
    const flies = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      animationDuration: Math.random() * 5 + 5 + 's',
      animationDelay: Math.random() * 5 + 's',
    }));
    setFireflies(flies);
  }, [count]);

  return (
    <div className="firefly-container absolute inset-0 overflow-hidden pointer-events-none z-0">
      <style>{`
        .firefly {
          position: absolute;
          width: 4px;
          height: 4px;
          background-color: #ffd700;
          border-radius: 50%;
          box-shadow: 0 0 10px #ffd700, 0 0 20px #ffd700;
          opacity: 0;
          animation: fly 10s infinite ease-in-out;
        }

        @keyframes fly {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          50% {
             transform: translate(var(--move-x), var(--move-y)) scale(1.2);
             opacity: 0.8;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translate(var(--move-x-end), var(--move-y-end)) scale(0.5);
            opacity: 0;
          }
        }
      `}</style>
      
      {fireflies.map((fly) => {
        // Generate random movement for each fly
         const moveX = (Math.random() - 0.5) * 200 + 'px';
         const moveY = (Math.random() - 0.5) * 200 + 'px';
         const moveXEnd = (Math.random() - 0.5) * 400 + 'px';
         const moveYEnd = (Math.random() - 0.5) * 400 + 'px';

        return (
          <div
            key={fly.id}
            className="firefly"
            style={{
              left: `${fly.left}%`,
              top: `${fly.top}%`,
              animationDuration: fly.animationDuration,
              animationDelay: fly.animationDelay,
              '--move-x': moveX,
              '--move-y': moveY,
              '--move-x-end': moveXEnd,
              '--move-y-end': moveYEnd,
            }}
          />
        );
      })}
    </div>
  );
};

export default FireflyEffect;
