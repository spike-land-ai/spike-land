"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function HelloWorld() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-900 via-orange-600 to-amber-500 flex items-center justify-center overflow-hidden relative">
      {/* Animated background circles */}
      <motion.div
        className="absolute w-96 h-96 bg-orange-400 rounded-full opacity-20 blur-3xl"
        animate={{
          x: [0, 100, 0],
          y: [0, -100, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute w-64 h-64 bg-amber-400 rounded-full opacity-20 blur-3xl"
        animate={{
          x: [0, -100, 0],
          y: [0, 100, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      {/* Rotating squares in corners */}
      {[0, 1, 2, 3].map(corner => (
        <motion.div
          key={corner}
          className="absolute w-24 h-24 border-4 border-white opacity-10"
          style={{
            top: corner < 2 ? "10%" : "auto",
            bottom: corner >= 2 ? "10%" : "auto",
            left: corner % 2 === 0 ? "10%" : "auto",
            right: corner % 2 === 1 ? "10%" : "auto",
          }}
          animate={{
            rotate: [0, 360],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "linear",
            delay: corner * 0.5,
          }}
        />
      ))}

      {/* Bouncing circles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`circle-${i}`}
          className="absolute w-16 h-16 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full opacity-20"
          style={{
            left: `${10 + i * 10}%`,
            top: "50%",
          }}
          animate={{
            y: [-100, 100, -100],
            scale: [0.8, 1.2, 0.8],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 2 + (i * 0.3),
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.2,
          }}
        />
      ))}

      {/* Spiral stars */}
      {[...Array(12)].map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        return (
          <motion.div
            key={`star-${i}`}
            className="absolute text-4xl"
            style={{
              left: "50%",
              top: "50%",
            }}
            animate={{
              x: [0, Math.cos(angle) * 300, 0],
              y: [0, Math.sin(angle) * 300, 0],
              rotate: [0, 360],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.15,
            }}
          >
            ✨
          </motion.div>
        );
      })}

      {/* Main content */}
      <div className="relative z-10 text-center">
        <motion.h1
          className="text-8xl font-bold text-white mb-8"
          initial={{ opacity: 0, y: -50 }}
          animate={{
            opacity: mounted ? 1 : 0,
            y: mounted ? 0 : -50,
            scale: [1, 1.05, 1],
          }}
          transition={{
            opacity: { duration: 1, ease: "easeOut" },
            y: { duration: 1, ease: "easeOut" },
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          Hello
        </motion.h1>

        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: mounted ? 1 : 0,
            scale: mounted ? 1 : 0.5,
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            opacity: { duration: 1, delay: 0.5, ease: "backOut" },
            scale: { duration: 1, delay: 0.5, ease: "backOut" },
            rotate: { duration: 3, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <motion.h2
            className="text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-100 via-amber-100 to-orange-100"
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              backgroundSize: "200% 200%",
            }}
          >
            World
          </motion.h2>

          {/* Pulsing glow effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-orange-400 to-amber-400 opacity-30 blur-2xl -z-10"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>

        {/* Floating particles */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-3 h-3 bg-white rounded-full opacity-60"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              x: [-10, 10, -10],
              opacity: [0.6, 1, 0.6],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 2,
            }}
          />
        ))}

        <motion.p
          className="text-orange-100 text-xl mt-12 font-light tracking-wide"
          initial={{ opacity: 0 }}
          animate={{
            opacity: mounted ? 1 : 0,
            y: [0, -5, 0],
          }}
          transition={{
            opacity: { duration: 1, delay: 1 },
            y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          Welcome to your animated experience
        </motion.p>

        {/* Rainbow wave line */}
        <motion.div className="mt-8 flex justify-center gap-2">
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={`wave-${i}`}
              className="w-2 h-12 bg-gradient-to-t from-orange-400 to-yellow-300 rounded-full"
              animate={{
                scaleY: [1, 2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.1,
              }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
