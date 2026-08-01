import { CinematicHero } from "@/components/ui/cinematic-landing-hero";
import { CinematicTimeline } from "@/components/ui/cinematic-timeline";
import { FeaturesGrid } from "@/components/ui/features-grid";
import { CinematicStories } from "@/components/ui/cinematic-stories";

export default function Home() {
  return (
    <main className="overflow-x-hidden w-full min-h-screen bg-zinc-950">
      <CinematicHero telegramBotLink="https://t.me/AttendBuddy_bot" />
      <CinematicTimeline />
      <FeaturesGrid />
      <CinematicStories />
      
      {/* Simple Footer Finale */}
      <footer className="py-24 bg-zinc-950 text-center border-t border-zinc-900 mt-20 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-emerald-900/20 via-zinc-950 to-zinc-950"></div>
        <div className="max-w-2xl mx-auto px-6 relative z-10">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to stop worrying about attendance?</h2>
          <p className="text-zinc-400 mb-10">Free forever. Runs on your Telegram. Takes 30 seconds to set up.</p>
          <a 
            href="https://t.me/AttendBuddy_bot" 
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold px-8 py-4 rounded-full transition-transform hover:scale-105 shadow-[0_0_40px_rgba(16,185,129,0.3)]"
          >
            Open in Telegram
          </a>
        </div>
      </footer>
    </main>
  );
}
