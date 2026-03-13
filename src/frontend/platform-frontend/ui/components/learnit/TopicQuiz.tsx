/**
 * TopicQuiz — inline multiple-choice quiz for a LearnIt topic.
 *
 * Features:
 * - 3–5 multiple choice questions
 * - Immediate per-question feedback with explanation
 * - Final score display
 * - Badge earned animation on 80%+ score
 */

import { useState, useCallback } from "react";

export interface QuizQuestion {
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
}

interface TopicQuizProps {
  questions: QuizQuestion[];
  topicSlug: string;
  onComplete: (score: number) => void;
}

type QuestionState = "unanswered" | "correct" | "incorrect";

function BadgeAnimation({ score }: { score: number }) {
  const passed = score >= 80;
  return (
    <div
      className={`flex flex-col items-center gap-4 rounded-2xl border p-8 text-center transition-all ${
        passed
          ? "border-yellow-400/50 bg-yellow-50/10 dark:bg-yellow-900/10"
          : "border-border bg-card"
      }`}
      role="status"
      aria-live="polite"
    >
      <div
        className={`flex h-20 w-20 items-center justify-center rounded-full text-4xl ${
          passed
            ? "animate-bounce bg-yellow-400/20 text-yellow-500"
            : "bg-muted text-muted-foreground"
        }`}
        aria-hidden="true"
      >
        {passed ? "🏅" : "📚"}
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{score}%</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {passed
            ? "Badge earned! You mastered this topic."
            : "Keep studying — 80% needed to earn the badge."}
        </p>
      </div>
    </div>
  );
}

interface SingleQuestionProps {
  question: QuizQuestion;
  index: number;
  selectedIndex: number | null;
  state: QuestionState;
  onSelect: (questionIndex: number, optionIndex: number) => void;
}

function SingleQuestion({ question, index, selectedIndex, state, onSelect }: SingleQuestionProps) {
  const isAnswered = state !== "unanswered";

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">
        <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          {index + 1}
        </span>
        {question.question}
      </p>

      <div className="grid gap-2" role="radiogroup" aria-label={`Question ${index + 1} options`}>
        {question.options.map((option, optIdx) => {
          const isSelected = selectedIndex === optIdx;
          const isCorrect = optIdx === question.correctIndex;

          let optionClass =
            "relative flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-all ";

          if (!isAnswered) {
            optionClass += isSelected
              ? "border-primary bg-primary/5 text-foreground"
              : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-muted/50";
          } else if (isCorrect) {
            optionClass += "border-green-500 bg-green-50/10 text-foreground dark:bg-green-900/10";
          } else if (isSelected && !isCorrect) {
            optionClass += "border-red-500 bg-red-50/10 text-foreground dark:bg-red-900/10";
          } else {
            optionClass += "border-border bg-background text-muted-foreground opacity-60";
          }

          return (
            <button
              key={optIdx}
              role="radio"
              aria-checked={isSelected}
              disabled={isAnswered}
              onClick={() => !isAnswered && onSelect(index, optIdx)}
              className={optionClass}
              type="button"
            >
              <span
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                  isAnswered && isCorrect
                    ? "border-green-500 bg-green-500 text-white"
                    : isAnswered && isSelected && !isCorrect
                      ? "border-red-500 bg-red-500 text-white"
                      : isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border"
                }`}
                aria-hidden="true"
              >
                {isAnswered && isCorrect
                  ? "✓"
                  : isAnswered && isSelected && !isCorrect
                    ? "✗"
                    : String.fromCharCode(65 + optIdx)}
              </span>
              <span>{option}</span>
            </button>
          );
        })}
      </div>

      {isAnswered && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            state === "correct"
              ? "border-green-500/30 bg-green-50/5 text-green-700 dark:text-green-400"
              : "border-red-500/30 bg-red-50/5 text-red-700 dark:text-red-400"
          }`}
          role="note"
          aria-label="Explanation"
        >
          <span className="font-semibold">{state === "correct" ? "Correct! " : "Incorrect. "}</span>
          {question.explanation}
        </div>
      )}
    </div>
  );
}

export function TopicQuiz({ questions, topicSlug: _topicSlug, onComplete }: TopicQuizProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>(
    () => new Array(questions.length).fill(null),
  );
  const [questionStates, setQuestionStates] = useState<QuestionState[]>(
    () => new Array(questions.length).fill("unanswered"),
  );
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const handleSelect = useCallback((questionIndex: number, optionIndex: number) => {
    if (submitted) return;
    setSelectedAnswers((prev) => {
      const next = [...prev];
      next[questionIndex] = optionIndex;
      return next;
    });
  }, [submitted]);

  const allAnswered = selectedAnswers.every((a) => a !== null);

  const handleSubmit = useCallback(() => {
    if (!allAnswered || submitted) return;

    const newStates: QuestionState[] = questions.map((q, i) => {
      const selected = selectedAnswers[i];
      if (selected === null) return "unanswered";
      return selected === q.correctIndex ? "correct" : "incorrect";
    });

    const correctCount = newStates.filter((s) => s === "correct").length;
    const pct = Math.round((correctCount / questions.length) * 100);

    setQuestionStates(newStates);
    setSubmitted(true);
    setScore(pct);
    onComplete(pct);
  }, [allAnswered, submitted, questions, selectedAnswers, onComplete]);

  if (questions.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Knowledge Check</h3>
        {submitted && score !== null && (
          <span
            className={`rounded-full px-3 py-1 text-sm font-semibold ${
              score >= 80
                ? "bg-green-500/10 text-green-600 dark:text-green-400"
                : "bg-orange-500/10 text-orange-600 dark:text-orange-400"
            }`}
          >
            {score}%
          </span>
        )}
      </div>

      <div className="space-y-6">
        {questions.map((q, i) => (
          <SingleQuestion
            key={i}
            question={q}
            index={i}
            selectedIndex={selectedAnswers[i] ?? null}
            state={questionStates[i] ?? "unanswered"}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {!submitted ? (
        <button
          type="button"
          disabled={!allAnswered}
          onClick={handleSubmit}
          className={`w-full rounded-xl px-6 py-3 text-sm font-semibold transition-colors ${
            allAnswered
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "cursor-not-allowed bg-muted text-muted-foreground"
          }`}
        >
          Submit Answers ({selectedAnswers.filter((a) => a !== null).length}/{questions.length}{" "}
          answered)
        </button>
      ) : (
        score !== null && <BadgeAnimation score={score} />
      )}
    </div>
  );
}
