"use client";

import React from "react";
import { motion } from "framer-motion";

const stories = [
  {
    icon: "🎮",
    bg: "from-green-400 to-emerald-500",
    name: "Ravi — 'The Skipper'",
    role: "3rd Year, CSE",
    chats: [
      { sender: "them", text: "Bro I've been skipping a lot… am I gonna hit 75%?" },
      { sender: "me", text: "Just type /stats 👀" },
      { sender: "them", text: "It says I can skip 3 more days?! That's all I needed" },
      { sender: "me", text: "Plan your bunks like a pro 😎" },
    ],
    outcomeBadge: "✓ Safe at 78%",
    outcomeBadgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    outcomeText: "Planned skips, never dropped",
  },
  {
    icon: "📚",
    bg: "from-amber-400 to-orange-500",
    name: "Priya — 'The Worrier'",
    role: "2nd Year, ECE",
    chats: [
      { sender: "them", text: "Sick for a week. Am I doomed?" },
      { sender: "me", text: "Bot says: recover in 6 classes" },
      { sender: "them", text: "Only 6?! I thought it'd be 20. The countdown is 🙏" },
      { sender: "me", text: "Forecast accounts for holidays too!" },
    ],
    outcomeBadge: "↑ Recovered",
    outcomeBadgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    outcomeText: "Back above 75% in 8 days",
  },
  {
    icon: "⚽",
    bg: "from-blue-400 to-indigo-500",
    name: "Arjun — 'The Athlete'",
    role: "1st Year, BBA",
    chats: [
      { sender: "them", text: "Sports week next month. I'll miss 5 days." },
      { sender: "me", text: "Check your forecast bro." },
      { sender: "them", text: "If I attend everything this week, I'll drop to 76.2% after sports week. I'm safe! 🏅" },
    ],
    outcomeBadge: "✓ Confident",
    outcomeBadgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    outcomeText: "Balanced sports and attendance",
  },
];

export function CinematicStories() {
  return (
    <section id="stories" className="py-24 bg-zinc-950 text-white relative">
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        
        <div className="text-center mb-20">
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
            className="text-4xl md:text-5xl font-bold tracking-tight mb-4"
          >
            Students like you, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">stress-free.</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-zinc-400 max-w-xl mx-auto text-lg"
          >
            Three conversations. Three very different problems. One bot.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stories.map((story, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: idx * 0.15, duration: 0.5 }}
              className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-3xl p-6 flex flex-col shadow-xl"
            >
              {/* Header */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-zinc-800/50">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${story.bg} flex items-center justify-center text-xl shadow-lg`}>
                  {story.icon}
                </div>
                <div>
                  <div className="font-bold text-zinc-100">{story.name}</div>
                  <div className="text-xs text-zinc-500">{story.role}</div>
                </div>
              </div>

              {/* Chat */}
              <div className="flex-1 flex flex-col gap-3 mb-8">
                {story.chats.map((chat, cIdx) => (
                  <motion.div
                    key={cIdx}
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + (idx * 0.1) + (cIdx * 0.2) }}
                    className={`max-w-[85%] p-3 rounded-2xl text-sm leading-snug ${
                      chat.sender === 'me' 
                        ? 'bg-emerald-500/20 text-emerald-50 border border-emerald-500/20 rounded-tr-sm self-end' 
                        : 'bg-zinc-800/60 text-zinc-300 rounded-tl-sm self-start border border-zinc-700/30'
                    }`}
                  >
                    {chat.text}
                  </motion.div>
                ))}
              </div>

              {/* Outcome */}
              <div className="mt-auto flex flex-col gap-2">
                <div className={`inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border self-start ${story.outcomeBadgeColor}`}>
                  {story.outcomeBadge}
                </div>
                <div className="text-zinc-400 text-sm">{story.outcomeText}</div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
