"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const timelineItems = [
  {
    time: "8:30",
    ampm: "AM",
    icon: "🔔",
    title: "Morning Reminder",
    desc: "Phone buzzes. AttendBuddy checks the holiday list, confirms it's a working day, and sends a friendly check-in.",
    notifApp: "AttendBuddy",
    notifBody: "🌅 Good morning! Working day. Attending today?",
    notifIcon: "📲",
  },
  {
    time: "9:00",
    ampm: "AM",
    icon: "✅",
    title: "One-Tap Check-in",
    desc: "Tap 'Going' right from the notification. Instantly see your updated %, month-end forecast, and skip budget.",
    isProgress: true,
    progressLabel: "Attendance",
    progressValue: "82.1%",
  },
  {
    time: "Auto",
    ampm: "ADJUST",
    icon: "🏖️",
    title: "Holiday Adjustment",
    desc: "Independence Day declared suddenly? Admin adds it. AttendBuddy recalculates everyone's stats instantly.",
    notifApp: "Admin broadcast",
    notifBody: "📢 15 Aug — Independence Day. Attendance recalculated!",
    notifIcon: "🎉",
  },
  {
    time: "End",
    ampm: "MONTH",
    icon: "📊",
    title: "Monthly Analytics",
    desc: "Admin runs /monthlystats. The class gets a performance snapshot — current %, forecast, who's at risk, who's safe.",
    isMiniStats: true,
  }
];

export function CinematicTimeline() {
  return (
    <section id="timeline" className="relative py-24 md:py-32 bg-zinc-950 text-white border-t border-zinc-900/50">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">
          
          {/* Sticky Header Container (Left Col) */}
          <div className="lg:col-span-5 lg:sticky lg:top-32 lg:pr-12">
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
              className="text-4xl md:text-5xl font-bold tracking-tight mb-6"
            >
              Scroll through a <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">typical morning.</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.2 }}
              className="text-zinc-400 text-lg leading-relaxed"
            >
              From the first alarm to the month-end report — AttendBuddy runs silently so you don't have to think about attendance.
            </motion.p>
          </div>

          {/* Scrolling Timeline (Right Col) */}
          <div className="lg:col-span-7 relative">
            
            {/* The physical track line */}
            <div className="absolute left-6 md:left-8 top-8 bottom-8 w-[1px] bg-zinc-800 rounded-full" />

            <div className="space-y-16 relative">
              {timelineItems.map((item, i) => (
                <div key={i} className="flex flex-row items-start relative">
                  
                  {/* Timeline Dot & Time Indicator */}
                  <div className="flex flex-col items-center mr-6 md:mr-8 relative z-10 w-12 md:w-16 flex-shrink-0">
                    <motion.div 
                      initial={{ backgroundColor: "rgba(24, 24, 27, 1)", borderColor: "rgba(39, 39, 42, 1)" }}
                      whileInView={{ backgroundColor: "rgba(16, 185, 129, 0.2)", borderColor: "rgba(16, 185, 129, 1)" }}
                      viewport={{ margin: "-50% 0px -50% 0px" }}
                      transition={{ duration: 0.3 }}
                      className="w-4 h-4 rounded-full border-2 mt-7 mb-2 shadow-[0_0_15px_rgba(16,185,129,0)]"
                    />
                    <div className="text-center font-mono">
                      <div className="text-zinc-300 font-bold text-sm md:text-base">{item.time}</div>
                      <div className="text-emerald-500 text-[10px] font-bold tracking-widest uppercase">{item.ampm}</div>
                    </div>
                  </div>

                  {/* Glassmorphic Node Card */}
                  <div className="flex-1 mt-0">
                    <motion.div
                      initial={{ opacity: 0.3, scale: 0.95, y: 20 }}
                      whileInView={{ opacity: 1, scale: 1, y: 0 }}
                      viewport={{ margin: "-20% 0px -20% 0px", amount: 0.4 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 rounded-2xl p-6 md:p-8 hover:border-zinc-700 transition-colors shadow-2xl"
                    >
                      <div className="text-2xl mb-4 bg-zinc-800/50 w-10 h-10 rounded-xl flex items-center justify-center border border-zinc-700/50">{item.icon}</div>
                      <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                      <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                        {item.desc}
                      </p>

                      {/* Notif Variant */}
                      {item.notifApp && (
                        <div className="bg-white/5 rounded-xl p-4 flex gap-3 border border-white/10 shadow-inner">
                          <div className="text-xl">{item.notifIcon}</div>
                          <div>
                            <div className="text-xs font-medium text-emerald-400 mb-1">{item.notifApp}</div>
                            <div className="text-sm text-zinc-300 leading-snug">{item.notifBody}</div>
                          </div>
                        </div>
                      )}

                      {/* Progress Variant */}
                      {item.isProgress && (
                        <div className="bg-white/5 rounded-xl p-5 border border-white/10 shadow-inner">
                          <div className="h-1.5 bg-zinc-800 rounded-full mb-3 overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              whileInView={{ width: "82%" }}
                              viewport={{ once: true }}
                              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                              className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                            />
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-zinc-400 font-medium">{item.progressLabel}</span>
                            <span className="text-emerald-400 font-bold">{item.progressValue}</span>
                          </div>
                        </div>
                      )}

                      {/* Mini Stats Variant */}
                      {item.isMiniStats && (
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center shadow-sm">
                            <div className="text-xl font-bold text-emerald-400">82%</div>
                            <div className="text-[10px] uppercase font-semibold text-emerald-500/80 mt-1 tracking-wider">Current</div>
                          </div>
                          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center shadow-sm">
                            <div className="text-xl font-bold text-amber-400">3</div>
                            <div className="text-[10px] uppercase font-semibold text-amber-500/80 mt-1 tracking-wider">Skippable</div>
                          </div>
                          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center shadow-sm">
                            <div className="text-xl font-bold text-blue-400">88%</div>
                            <div className="text-[10px] uppercase font-semibold text-blue-500/80 mt-1 tracking-wider">Forecast</div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
