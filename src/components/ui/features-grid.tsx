"use client";

import React from "react";
import { motion } from "framer-motion";

const features = [
  {
    icon: "⏰",
    title: "Smart Reminders",
    desc: "8:30 AM prompt → 9:15 nudge → 9:30 auto-absent. Three layers so nothing falls through.",
  },
  {
    icon: "📊",
    title: "Real-time Stats",
    desc: "Cumulative %, forecast, skip budget, recovery plan — all in one /stats command.",
  },
  {
    icon: "🏖️",
    title: "Holiday Intelligence",
    desc: "Admins add/remove holidays on the fly. Stats recalculate instantly across all students.",
  },
  {
    icon: "📢",
    title: "Admin Broadcasts",
    desc: "One command to announce holidays, schedule changes, or monthly reports to everyone.",
  },
  {
    icon: "🔄",
    title: "Self-Correction",
    desc: "Marked absent by mistake? /correct fixes it same-day. Full audit trail.",
  },
  {
    icon: "🔒",
    title: "Zero-Cost, Private",
    desc: "Google Apps Script + Sheets. Your data, your Google account. No servers, no fees.",
  },
];

export function FeaturesGrid() {
  return (
    <section id="features" className="py-24 bg-zinc-950 text-white relative">
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        
        <div className="text-center mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-emerald-400 font-semibold tracking-wide text-sm mb-3 uppercase"
          >
            Features
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold tracking-tight mb-4"
          >
            Everything you need.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">Nothing you don't.</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-zinc-400 max-w-xl mx-auto text-lg"
          >
            Built for college students who just want to know: "Can I skip tomorrow?"
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="bg-zinc-900/30 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-8 hover:bg-zinc-900/60 hover:border-emerald-500/30 transition-colors group"
            >
              <div className="text-4xl mb-6 bg-zinc-800/50 w-14 h-14 rounded-xl flex items-center justify-center border border-zinc-700/50 group-hover:scale-110 transition-transform">
                {feat.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{feat.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {feat.desc}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
