"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface CinematicHeroProps extends React.HTMLAttributes<HTMLDivElement> {
  telegramBotLink?: string;
}

export function CinematicHero({ telegramBotLink = "https://t.me/AttendBuddy_bot", className, ...props }: CinematicHeroProps) {
  
  // Framer Motion variants for staggered entrance
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <section 
      className={cn("relative min-h-screen flex items-center justify-center overflow-hidden bg-zinc-950 pt-20", className)} 
      {...props}
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-teal-500/10 blur-[120px] rounded-full mix-blend-screen" />
        
        {/* Subtle Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 w-full relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Left Copy Container */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-6 text-center lg:text-left pt-12 lg:pt-0"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium tracking-wide w-fit mx-auto lg:mx-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Telegram Bot · Free Forever
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
            Your attendance,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">handled.</span>
          </motion.h1>
          
          <motion.p variants={itemVariants} className="text-zinc-400 text-lg md:text-xl max-w-xl mx-auto lg:mx-0 leading-relaxed">
            AttendBuddy is the intelligent companion that sits beside your college's FRS — not replacing it, but making sure you never accidentally drop below 75%.
          </motion.p>
          
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4 mt-4 justify-center lg:justify-start">
            <a 
              href={telegramBotLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-zinc-950 font-bold hover:bg-zinc-200 transition-colors shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] flex justify-center items-center gap-2"
            >
              Open in Telegram
            </a>
            <a 
              href="#timeline"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-zinc-900/50 backdrop-blur-md border border-zinc-800 text-white font-semibold hover:bg-zinc-800/50 transition-colors flex justify-center items-center"
            >
              See how it works
            </a>
          </motion.div>

          <motion.div variants={itemVariants} className="flex items-center justify-center lg:justify-start gap-8 mt-8 pt-8 border-t border-zinc-900/50">
            <div>
              <div className="text-2xl font-bold text-white">₹0</div>
              <div className="text-sm text-zinc-500 font-medium">Forever free</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">30s</div>
              <div className="text-sm text-zinc-500 font-medium">Onboarding</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">24/7</div>
              <div className="text-sm text-zinc-500 font-medium">Always on</div>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Phone Mockup Container */}
        <motion.div
          initial={{ opacity: 0, x: 50, rotateY: -10 }}
          animate={{ opacity: 1, x: 0, rotateY: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          className="relative perspective-1000 w-full max-w-[320px] mx-auto lg:max-w-[360px]"
        >
          {/* Subtle floating animation */}
          <motion.div
            animate={{ y: [-10, 10, -10] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative aspect-[9/19] rounded-[2.5rem] border-[8px] border-zinc-900 bg-zinc-950/40 backdrop-blur-xl shadow-2xl overflow-hidden ring-1 ring-white/10"
          >
            {/* Dynamic Island / Notch */}
            <div className="absolute top-0 inset-x-0 h-7 bg-zinc-900 rounded-b-3xl w-40 mx-auto z-20" />
            
            {/* Chat Interface */}
            <div className="p-5 pt-14 h-full flex flex-col gap-4 text-[13px] text-zinc-300 relative z-10 font-medium">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3.5 rounded-2xl rounded-tl-sm self-start max-w-[85%] shadow-lg">
                🌅 Good morning! Working day. Attending today?
              </div>
              
              <div className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 p-3.5 rounded-2xl rounded-tr-sm self-end max-w-[85%] shadow-lg">
                ✅ Going!
              </div>
              
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl rounded-tl-sm self-start w-full shadow-lg">
                <div className="text-white font-bold mb-2">Marked: Present ✓</div>
                <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden mb-2">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "82.1%" }}
                    transition={{ delay: 1, duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-emerald-500 rounded-full"
                  />
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500">Attendance</span>
                  <span className="text-emerald-400 font-bold">82.1%</span>
                </div>
              </div>
            </div>

            {/* Ambient inner glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 via-transparent to-teal-500/5 pointer-events-none" />
          </motion.div>

          {/* Decorative backdrop blobs behind the phone */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[80%] bg-emerald-500/20 blur-[80px] -z-10 rounded-full" />
        </motion.div>
      </div>
    </section>
  );
}
