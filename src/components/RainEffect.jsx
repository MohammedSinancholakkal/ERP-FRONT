import React, { useEffect, useState, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

const RainEffect = ({ count = 100 }) => {
  const [raindrops, setRaindrops] = useState([]);
  const [isMuted, setIsMuted] = useState(true);
  const audioRef = useRef(null);

  useEffect(() => {
    // Generate raindrops
    const drops = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100 + '%',
      animationDuration: Math.random() * 0.5 + 0.5 + 's',
      animationDelay: Math.random() * 2 + 's',
    }));
    setRaindrops(drops);
  }, [count]);

  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.volume = 0.3; 
        if (!isMuted) {
            audioRef.current.play().catch(e => console.log("Playback failed:", e));
        } else {
            audioRef.current.pause();
        }
    }
  }, [isMuted]);

  return (
    <div className="rain-container absolute inset-0 overflow-hidden pointer-events-none z-0">
      <style>{`
        .raindrop {
          position: absolute;
          width: 2px;
          height: 15px;
          background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.6));
          top: -20px; 
          animation: fall linear infinite;
        }

        @keyframes fall {
          to {
            transform: translateY(100vh); 
          }
        }
      `}</style>
      
      <audio 
        ref={audioRef} 
        loop
        src="/sounds/rain.ogg" 
        style={{ display: 'none' }}
      />
      
      {/* Sound Toggle Button - Need pointer-events-auto because parent is pointer-events-none */}
      <div className="absolute top-5 right-5 z-50 pointer-events-auto">
        <button 
            onClick={() => setIsMuted(!isMuted)}
            className={`p-3 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-all border border-white/30 shadow-lg ${isMuted ? 'animate-pulse ring-2 ring-white/50' : ''}`}
            title={isMuted ? "Unmute Rain" : "Mute Rain"}
        >
            {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>
      </div>

      {raindrops.map((drop) => (
        <div
          key={drop.id}
          className="raindrop"
          style={{
            left: drop.left,
            animationDuration: drop.animationDuration,
            animationDelay: drop.animationDelay,
          }}
        />
      ))}
    </div>
  );
};

export default RainEffect;
