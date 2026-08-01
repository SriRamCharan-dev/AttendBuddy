import { CinematicHero } from "@/components/ui/cinematic-landing-hero";

export default function Home() {
  return (
    <main className="overflow-x-hidden w-full min-h-screen">
      <CinematicHero telegramBotLink="https://t.me/AttendBuddy_bot" />
    </main>
  );
}
