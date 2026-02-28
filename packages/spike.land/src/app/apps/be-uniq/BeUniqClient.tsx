"use client";

import { useBeUniq } from "./hooks/useBeUniq";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { QuestionCard } from "./components/QuestionCard";
import { UniqueResult } from "./components/UniqueResult";
import { ProfileInsight } from "./components/ProfileInsight";

export function BeUniqClient() {
  const game = useBeUniq();

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-zinc-950 text-white flex items-center justify-center p-6">
      {/* Welcome */}
      {game.phase === "welcome" && (
        <WelcomeScreen
          treeStats={game.treeStats}
          onStart={game.startGame}
          isLoading={game.isLoading}
        />
      )}

      {/* Playing */}
      {game.phase === "playing" && game.currentQuestion && (
        <QuestionCard
          question={game.currentQuestion}
          questionNumber={game.answers.length + 1}
          answers={game.answers}
          onYes={() => game.answer(true)}
          onNo={() => game.answer(false)}
          isLoading={game.isLoading}
        />
      )}

      {/* Loading between questions */}
      {game.phase === "playing" && !game.currentQuestion && (
        <div className="flex flex-col items-center gap-4">
          {game.error
            ? (
              <>
                <p className="text-sm text-red-400">{game.error}</p>
                <button
                  onClick={game.backToWelcome}
                  className="text-sm text-zinc-400 underline hover:text-white"
                >
                  Back to start
                </button>
              </>
            )
            : (
              <>
                <div className="w-8 h-8 border-2 border-fuchsia-400/30 border-t-fuchsia-400 rounded-full animate-spin" />
                <p className="text-sm text-zinc-500">
                  Loading next question...
                </p>
              </>
            )}
        </div>
      )}

      {/* Unique result */}
      {game.phase === "unique" && (
        <UniqueResult
          answers={game.answers}
          profile={game.profile}
          onPlayAgain={game.playAgain}
          onBackToWelcome={game.backToWelcome}
          isLoading={game.isLoading}
        />
      )}

      {/* Already profiled */}
      {game.phase === "already_profiled" && (
        <ProfileInsight
          profile={game.profile}
          onPlayAgain={game.playAgain}
          onBackToWelcome={game.backToWelcome}
          isLoading={game.isLoading}
        />
      )}
    </div>
  );
}
