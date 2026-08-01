"use client";

import React from "react";
import { motion } from "framer-motion";

const stories = [
  {
    icon: "🎮",
    glow: "bg-emerald-500/20",
    gradient: "from-emerald-400 to-teal-500",
    name: "Ravi — 'The Skipper'",
    role: "3rd Year, CSE",
    chats: [
      { sender: "them", text: "Bro I've been skipping a lot… am I gonna hit 75%?" },
      { sender: "me", text: "Just type /stats 👀" },
      { sender: "them", text: "It says I can skip 3 more days?! That's all I needed" },
      { sender: "me", text: "Plan your bunks like a pro 😎" },
    ],
    outcomeBadge: "✓ Safe at 78%",
    outcomeBadgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    outcomeText: "Planned skips, never dropped",
  },
  {
    icon: "📚",
    glow: "bg-amber-500/20",
    gradient: "from-amber-400 to-orange-500",
    name: "Priya — 'The Worrier'",
    role: "2nd Year, ECE",
    chats: [
      { sender: "them", text: "Sick for a week. Am I doomed?" },
      { sender: "me", text: "Bot says: recover in 6 classes" },
      { sender: "them", text: "Only 6?! I thought it'd be 20. The countdown is 🙏" },
      { sender: "me", text: "Forecast accounts for holidays too!" },
    ],
    outcomeBadge: "↑ Recovered",
    outcomeBadgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    outcomeText: "Back above 75% in 8 days",
  },
  {
    icon: "⚽",
    glow: "bg-blue-500/20",
    gradient: "from-blue-400 to-indigo-500",
    name: "Arjun — 'The Athlete'",
    role: "1st Year, BBA",
    chats: [
      { sender: "them", text: "Sports week next month. I'll miss 5 days." },
      { sender: "me", text: "Check your forecast bro." },
      { sender: "them", text: "If I attend everything this week, I'll drop to 76.2% after sports week. I'm safe! 🏅" },
    ],
    outcomeBadge: "✓ Confident",
    outcomeBadgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    outcomeText: "Balanced sports and attendance",
  },
];

export function CinematicStories() {
  
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.4, delayChildren: 0.2 },
    },
  };

  const bubbleVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 350, damping: 25 } },
  };

  return (
    <section id="stories" className="py-32 bg-zinc-950 text-white relative border-t border-zinc-900/50">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        <div className="text-center mb-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-emerald-400 font-semibold tracking-wide text-sm mb-3 uppercase"
          >
            Real stories
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
          >
            Students like you, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">stress-free.</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-zinc-400 max-w-xl mx-auto text-lg leading-relaxed"
          >
            Three conversations. Three very different problems. One bot that handles it all automatically.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stories.map((story, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: idx * 0.15, duration: 0.7, ease: "easeOut" }}
              className="relative group bg-zinc-900/30 backdrop-blur-2xl border border-white/[0.05] rounded-[2.5rem] p-7 flex flex-col shadow-2xl overflow-hidden hover:border-white/[0.1] transition-colors"
            >
              {/* Authentic Glassmorphic Ambient Background */}
              <div className={`absolute inset-0 opacity-40 blur-3xl rounded-full ${story.glow} -z-10 group-hover:opacity-60 transition-opacity duration-700`} />
              
              {/* Header */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/[0.05]">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${story.gradient} flex items-center justify-center text-2xl shadow-lg shadow-black/50`}>
                  {story.icon}
                </div>
                <div>
                  <div className="font-bold text-zinc-100 text-lg tracking-tight">{story.name}</div>
                  <div className="text-sm font-medium text-zinc-500">{story.role}</div>
                </div>
              </div>

              {/* Chat Interface (Staggered Animation) */}
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-100px" }}
                className="flex-1 flex flex-col gap-3 mb-8"
              >
                {story.chats.map((chat, cIdx) => (
                  <motion.div
                    key={cIdx}
                    variants={bubbleVariants}
                    className={`max-w-[85%] p-3.5 rounded-2xl text-[14px] leading-snug font-medium shadow-lg backdrop-blur-md border ${
                      chat.sender === 'me' 
                        ? 'bg-emerald-500/10 text-emerald-100 border-emerald-500/20 rounded-tr-sm self-end' 
                        : 'bg-white/5 text-zinc-300 rounded-tl-sm self-start border-white/10'
                    }`}
                  >
                    {chat.text}
                  </motion.div>
                ))}
              </motion.div>

              {/* Outcome Footer */}
              <div className="mt-auto flex flex-col gap-2 bg-black/20 p-5 rounded-2xl border border-white/[0.03]">
                <div className={`inline-flex px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full border self-start ${story.outcomeBadgeColor}`}>
                  {story.outcomeBadge}
                </div>
                <div className="text-zinc-400 font-medium text-sm mt-1">{story.outcomeText}</div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
