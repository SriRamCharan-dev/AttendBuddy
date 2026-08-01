"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

const timelineItems = [
  {
    time: "8:30",
    ampm: "AM IST",
    icon: "🔔",
    title: "Morning Reminder",
    desc: "Phone buzzes. AttendBuddy checks the holiday list, confirms it's a working day, and sends a friendly check-in before you've even brushed your teeth.",
    notifApp: "AttendBuddy",
    notifBody: "🌅 Good morning! Working day. Attending today?",
    notifIcon: "📲",
  },
  {
    time: "9:00",
    ampm: "AM IST",
    icon: "✅",
    title: "One-Tap Check-in",
    desc: "Tap 'Going' right from the notification. Instantly see your updated %, month-end forecast, and how many days you can still skip.",
    isProgress: true,
    progressLabel: "Attendance",
    progressValue: "82.1%",
  },
  {
    time: "Auto",
    ampm: "ADJUSTED",
    icon: "🏖️",
    title: "Holiday Adjustment",
    desc: "Independence Day declared suddenly? Admin adds it. AttendBuddy voids today's records, recalculates everyone's stats, broadcasts the update. Zero manual work.",
    notifApp: "Admin broadcast",
    notifBody: "📢 15 Aug — Independence Day. Attendance recalculated!",
    notifIcon: "🎉",
  },
  {
    time: "End",
    ampm: "OF MONTH",
    icon: "📊",
    title: "Monthly Analytics",
    desc: "Admin runs /monthlystats. The class gets a performance snapshot — current %, forecast, who's at risk, who's safe.",
    isMiniStats: true,
  }
];

export function CinematicTimeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section id="timeline" ref={containerRef} className="relative py-24 md:py-40 bg-zinc-950 text-white overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-emerald-400 font-semibold tracking-wide text-sm mb-3 uppercase"
          >
            A day in your life
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold tracking-tight mb-4"
          >
            Scroll through a <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">typical morning.</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.2 }}
            className="text-zinc-400 max-w-2xl mx-auto text-lg"
          >
            From the first alarm to the month-end report — AttendBuddy runs silently so you don't have to think about attendance.
          </motion.p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line background */}
          <div className="absolute left-8 md:left-1/2 md:-ml-[1px] top-0 bottom-0 w-[2px] bg-zinc-800 rounded-full" />
          
          {/* Animated vertical line */}
          <motion.div 
            className="absolute left-8 md:left-1/2 md:-ml-[1px] top-0 w-[2px] bg-gradient-to-b from-emerald-500 to-teal-400 rounded-full origin-top"
            style={{ height: lineHeight }}
          />

          <div className="space-y-12 md:space-y-24 relative">
            {timelineItems.map((item, i) => {
              const isEven = i % 2 === 0;
              return (
                <div key={i} className={cn("flex flex-col md:flex-row items-start md:items-center relative", isEven ? "md:flex-row-reverse" : "")}>
                  
                  {/* Time (Desktop) */}
                  <div className={cn("hidden md:block w-1/2 px-12", isEven ? "text-left" : "text-right")}>
                    <motion.div
                      initial={{ opacity: 0, x: isEven ? 50 : -50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-20%" }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                      <div className="text-4xl font-black tracking-tighter text-zinc-300">{item.time}</div>
                      <div className="text-xs font-bold tracking-widest text-emerald-500 mt-1">{item.ampm}</div>
                    </motion.div>
                  </div>

                  {/* Dot */}
                  <div className="absolute left-8 md:left-1/2 w-4 h-4 rounded-full bg-zinc-950 border-2 border-emerald-500 transform -translate-x-1/2 mt-6 md:mt-0 z-10 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />

                  {/* Card */}
                  <div className="w-full md:w-1/2 pl-20 pr-0 md:px-12 mt-2 md:mt-0">
                    <motion.div
                      initial={{ opacity: 0, y: 30, scale: 0.95 }}
                      whileInView={{ opacity: 1, y: 0, scale: 1 }}
                      viewport={{ once: true, margin: "-20%" }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800/50 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden group hover:border-zinc-700/50 transition-colors"
                    >
                      {/* Mobile Time */}
                      <div className="md:hidden text-emerald-400 font-semibold text-sm mb-4">
                        {item.time} {item.ampm}
                      </div>

                      <div className="text-3xl mb-4 bg-zinc-800/50 w-12 h-12 rounded-full flex items-center justify-center border border-zinc-700/50">{item.icon}</div>
                      <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                      <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                        {item.desc}
                      </p>

                      {/* Notif Variant */}
                      {item.notifApp && (
                        <div className="bg-black/40 rounded-xl p-4 flex gap-3 border border-zinc-800/50">
                          <div className="text-2xl">{item.notifIcon}</div>
                          <div>
                            <div className="text-xs font-medium text-emerald-500 mb-1">{item.notifApp}</div>
                            <div className="text-sm text-zinc-300 leading-snug">{item.notifBody}</div>
                          </div>
                        </div>
                      )}

                      {/* Progress Variant */}
                      {item.isProgress && (
                        <div className="bg-black/40 rounded-xl p-5 border border-zinc-800/50">
                          <div className="h-2 bg-zinc-800 rounded-full mb-3 overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              whileInView={{ width: "82%" }}
                              viewport={{ once: true }}
                              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                              className="h-full bg-emerald-500 rounded-full"
                            />
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-zinc-400">{item.progressLabel}</span>
                            <span className="text-emerald-400 font-bold">{item.progressValue}</span>
                          </div>
                        </div>
                      )}

                      {/* Mini Stats Variant */}
                      {item.isMiniStats && (
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
                            <div className="text-xl font-bold text-emerald-400">82%</div>
                            <div className="text-[10px] uppercase text-emerald-500 mt-1">Current</div>
                          </div>
                          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-center">
                            <div className="text-xl font-bold text-amber-400">3</div>
                            <div className="text-[10px] uppercase text-amber-500 mt-1">Skippable</div>
                          </div>
                          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-center">
                            <div className="text-xl font-bold text-blue-400">88%</div>
                            <div className="text-[10px] uppercase text-blue-500 mt-1">Forecast</div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
