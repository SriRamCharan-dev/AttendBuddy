"use client";

import React, { useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: "⏰",
    title: "Smart Reminders",
    desc: "8:30 AM prompt → 9:15 nudge → 9:30 auto-absent. Three layers so nothing falls through.",
    className: "md:col-span-1",
  },
  {
    icon: "📊",
    title: "Real-time Stats",
    desc: "Cumulative %, forecast, skip budget, recovery plan — all beautifully formatted in one /stats command.",
    className: "md:col-span-2",
  },
  {
    icon: "🏖️",
    title: "Holiday Intelligence",
    desc: "Admins add/remove holidays on the fly. Stats recalculate instantly across all students in the class. No manual spreadsheet updates needed.",
    className: "md:col-span-2",
  },
  {
    icon: "📢",
    title: "Admin Broadcasts",
    desc: "One command to announce holidays, schedule changes, or monthly reports to everyone.",
    className: "md:col-span-1",
  },
  {
    icon: "🔄",
    title: "Self-Correction",
    desc: "Marked absent by mistake? /correct fixes it same-day. Full audit trail included.",
    className: "md:col-span-1",
  },
  {
    icon: "🔒",
    title: "Zero-Cost, Private",
    desc: "Google Apps Script + Sheets. Your data, your Google account. No servers, no subscription fees.",
    className: "md:col-span-2",
  },
];

function BentoCard({ feat, index }: { feat: typeof features[0], index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty("--mouse-x", `${x}px`);
    cardRef.current.style.setProperty("--mouse-y", `${y}px`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={cn(
        "group relative flex flex-col justify-end overflow-hidden rounded-3xl bg-zinc-900/40 border border-zinc-800/60 p-8 hover:border-zinc-700/80 transition-colors",
        feat.className
      )}
    >
      {/* Hover Gradient Effect */}
      <div 
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100 z-0"
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(16, 185, 129, 0.08), transparent 40%)`
        }}
      />
      
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl z-0 group-hover:bg-emerald-500/20 transition-colors" />

      <div className="relative z-10 flex flex-col h-full">
        <div className="text-4xl mb-6 bg-zinc-800/50 w-14 h-14 rounded-2xl flex items-center justify-center border border-zinc-700/50 shadow-inner group-hover:scale-110 transition-transform duration-300">
          {feat.icon}
        </div>
        
        <div className="mt-auto">
          <h3 className="text-2xl font-bold mb-3 text-zinc-100 tracking-tight">{feat.title}</h3>
          <p className="text-zinc-400 text-sm leading-relaxed font-medium">
            {feat.desc}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function FeaturesGrid() {
  return (
    <section id="features" className="py-32 bg-zinc-950 text-white relative border-t border-zinc-900/50">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        <div className="text-center mb-24">
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
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight"
          >
            Everything you need.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">Nothing you don't.</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-zinc-400 max-w-xl mx-auto text-lg leading-relaxed"
          >
            Built specifically for college students who just want to know: "Can I skip tomorrow without getting into trouble?"
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[280px]">
          {features.map((feat, i) => (
            <BentoCard key={i} feat={feat} index={i} />
          ))}
        </div>

      </div>
    </section>
  );
}
