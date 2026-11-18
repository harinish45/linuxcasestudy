import type { Metadata } from "next";
import QuizArena from "@/components/arena/QuizArena";

export const metadata: Metadata = {
  title: "Quiz Battle | Linux Lab",
  description:
    "Real-time multiplayer quiz battles: share a room code, 20 questions, 10 seconds each, points for speed — full leaderboard and badges for every player.",
};

export default function ArenaPage() {
  return <QuizArena />;
}
