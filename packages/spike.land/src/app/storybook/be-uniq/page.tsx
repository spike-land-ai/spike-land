"use client";

import {
  AccessibilityPanel,
  Breadcrumbs,
  CodePreview,
  ComponentSample,
  PageHeader,
  RelatedComponents,
  UsageGuide,
} from "@/components/storybook";
import { UniquenessQuestionCard } from "@/components/be-uniq/UniquenessQuestionCard";
import { UniquenessScoreDisplay } from "@/components/be-uniq/UniquenessScoreDisplay";
import { PersonalityTagCloud } from "@/components/be-uniq/PersonalityTagCloud";
import { UniqueProgressTracker } from "@/components/be-uniq/UniqueProgressTracker";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockQuestion = {
  question: "When facing a difficult decision, what drives your choice most?",
  options: [
    { id: "a", text: "Logic and rational analysis of all available data" },
    { id: "b", text: "How it feels emotionally and instinctively" },
    { id: "c", text: "What aligns with my core values and principles" },
    { id: "d", text: "What others I trust would recommend" },
  ],
};

const mockQuestion2 = {
  question: "How do you recharge after a demanding week?",
  options: [
    { id: "a", text: "Solo activities like reading, gaming, or creating" },
    { id: "b", text: "Social gatherings with close friends" },
    { id: "c", text: "Physical exercise or time in nature" },
    { id: "d", text: "Structured rest with a clear plan for the next week" },
  ],
};

const mockTags = [
  { label: "Analytical", weight: 9 },
  { label: "Creative", weight: 7 },
  { label: "Empathetic", weight: 8 },
  { label: "Detail-oriented", weight: 5 },
  { label: "Strategic", weight: 10 },
  { label: "Introvert", weight: 6 },
  { label: "Curious", weight: 9 },
  { label: "Methodical", weight: 4 },
  { label: "Visionary", weight: 8 },
  { label: "Resilient", weight: 3 },
  { label: "Collaborative", weight: 2 },
  { label: "Independent", weight: 6 },
];

const codeSnippets = {
  questionCard:
    `import { UniquenessQuestionCard } from "@/components/be-uniq/UniquenessQuestionCard";

<UniquenessQuestionCard
  question="When facing a difficult decision, what drives your choice?"
  options={[
    { id: "a", text: "Logic and rational analysis" },
    { id: "b", text: "Emotional instinct" },
  ]}
  selectedOptionId="a"
  onSelect={(id) => console.log(id)}
  questionNumber={3}
  totalQuestions={10}
/>`,
  scoreDisplay:
    `import { UniquenessScoreDisplay } from "@/components/be-uniq/UniquenessScoreDisplay";

<UniquenessScoreDisplay
  score={84200}
  category="Strategic Visionary"
  description="You combine analytical rigor with creative foresight in a rare combination."
/>`,
  tagCloud: `import { PersonalityTagCloud } from "@/components/be-uniq/PersonalityTagCloud";

<PersonalityTagCloud
  tags={[
    { label: "Strategic", weight: 10 },
    { label: "Creative", weight: 7 },
    { label: "Analytical", weight: 9 },
    { label: "Collaborative", weight: 2 },
  ]}
/>`,
  progressTracker:
    `import { UniqueProgressTracker } from "@/components/be-uniq/UniqueProgressTracker";

<UniqueProgressTracker
  answered={7}
  total={10}
  currentStreak={4}
/>`,
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function BeUniqPage() {
  return (
    <div className="space-y-16 pb-20">
      <Breadcrumbs />

      <PageHeader
        title="Be Unique"
        description="Be Unique is spike.land's personality discovery experience. Users answer a series of introspective questions to reveal how rare their combination of traits is — expressed as '1 in X people'. The result is a personal uniqueness score with a tag cloud of personality attributes."
        usage="Use Be Unique components to build interactive questionnaires, reveal personality scores, visualize trait tag clouds, and track quiz progress."
      />

      <UsageGuide
        dos={[
          "Show UniquenessQuestionCard one at a time for focused engagement.",
          "Use UniqueProgressTracker at the top of the quiz to orient users.",
          "Animate the score reveal with isRevealing=true on initial display.",
          "Size PersonalityTagCloud tags proportionally to weight (1-10 scale).",
          "Format all scores with toLocaleString() for locale-appropriate separators.",
        ]}
        donts={[
          "Don't show all questions at once -- reveal them progressively.",
          "Avoid displaying raw numeric scores without the '1 in X' framing.",
          "Don't use weight=1 for tags that represent core traits -- reserve low weights for minor attributes.",
          "Avoid showing the score card before the quiz is complete.",
          "Don't skip the category badge on UniquenessScoreDisplay -- it anchors the result.",
        ]}
      />

      {/* Question Card - Unanswered */}
      <ComponentSample
        title="Question Card (Unanswered)"
        description="The question prompt shown before the user selects an answer. Options appear as selectable cards with hover states. Progress indicator shows position in the quiz."
        code={codeSnippets.questionCard}
      >
        <div className="w-full max-w-lg">
          <UniquenessQuestionCard
            question={mockQuestion.question}
            options={mockQuestion.options}
            questionNumber={1}
            totalQuestions={10}
          />
        </div>
      </ComponentSample>

      {/* Question Card - With Selection */}
      <ComponentSample
        title="Question Card (Answer Selected)"
        description="After the user taps an option, it highlights with a violet accent. The selection is visually distinct while others fade to secondary state."
      >
        <div className="w-full max-w-lg">
          <UniquenessQuestionCard
            question={mockQuestion2.question}
            options={mockQuestion2.options}
            selectedOptionId="a"
            questionNumber={5}
            totalQuestions={10}
          />
        </div>
      </ComponentSample>

      {/* Score Displays */}
      <ComponentSample
        title="Uniqueness Score Display"
        description="Reveals the user's uniqueness score as a large '1 in X people' figure. Includes a category badge, formatted score, and rarity percentage. Use isRevealing for animated entrance."
        code={codeSnippets.scoreDisplay}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          <UniquenessScoreDisplay
            score={500}
            category="Creative"
            description="Highly imaginative with unconventional problem-solving instincts."
          />
          <UniquenessScoreDisplay
            score={12500}
            category="Strategic Thinker"
            description="Combines long-range vision with systematic analytical precision."
          />
          <UniquenessScoreDisplay
            score={84200}
            category="Rare Visionary"
            description="Your combination of empathy, logic, and creativity is exceptionally uncommon."
          />
        </div>
      </ComponentSample>

      {/* Score Display - Revealing State */}
      <ComponentSample
        title="Score Display (Revealing)"
        description="The isRevealing prop triggers a pulse animation to dramatize the score reveal moment."
      >
        <div className="w-full max-w-sm">
          <UniquenessScoreDisplay
            score={33000}
            category="Analytical Empath"
            description="You balance data-driven thinking with deep emotional intelligence."
            isRevealing
          />
        </div>
      </ComponentSample>

      {/* Personality Tag Cloud */}
      <ComponentSample
        title="Personality Tag Cloud"
        description="Tags rendered with size proportional to weight (1-10). Higher-weight tags use larger typography and padding. Colors cycle through a predefined palette unless overridden."
        code={codeSnippets.tagCloud}
      >
        <div className="w-full max-w-xl py-4">
          <PersonalityTagCloud tags={mockTags} />
        </div>
      </ComponentSample>

      {/* Personality Tag Cloud - Minimal */}
      <ComponentSample
        title="Personality Tag Cloud (Minimal)"
        description="A smaller tag cloud with fewer traits, suitable for compact result summaries."
      >
        <div className="w-full max-w-md py-4">
          <PersonalityTagCloud
            tags={[
              { label: "Visionary", weight: 10 },
              { label: "Empathetic", weight: 8 },
              { label: "Detail-oriented", weight: 5 },
              { label: "Introvert", weight: 3 },
            ]}
          />
        </div>
      </ComponentSample>

      {/* Progress Tracker Variants */}
      <ComponentSample
        title="Progress Tracker"
        description="Shows answered/remaining counts with a gradient progress bar and optional streak badge. Updates smoothly with CSS transitions."
        code={codeSnippets.progressTracker}
      >
        <div className="space-y-8 w-full max-w-md">
          <div>
            <p className="text-xs text-zinc-600 mb-2 uppercase tracking-widest font-mono">
              Just started
            </p>
            <UniqueProgressTracker answered={1} total={10} />
          </div>
          <div>
            <p className="text-xs text-zinc-600 mb-2 uppercase tracking-widest font-mono">
              Midway with streak
            </p>
            <UniqueProgressTracker answered={5} total={10} currentStreak={4} />
          </div>
          <div>
            <p className="text-xs text-zinc-600 mb-2 uppercase tracking-widest font-mono">
              Nearly complete
            </p>
            <UniqueProgressTracker answered={9} total={10} currentStreak={7} />
          </div>
          <div>
            <p className="text-xs text-zinc-600 mb-2 uppercase tracking-widest font-mono">
              Completed
            </p>
            <UniqueProgressTracker answered={10} total={10} currentStreak={10} />
          </div>
        </div>
      </ComponentSample>

      <CodePreview
        code={codeSnippets.questionCard}
        title="Be Unique Components"
        tabs={[
          { label: "UniquenessQuestionCard", code: codeSnippets.questionCard },
          { label: "UniquenessScoreDisplay", code: codeSnippets.scoreDisplay },
          { label: "PersonalityTagCloud", code: codeSnippets.tagCloud },
          { label: "UniqueProgressTracker", code: codeSnippets.progressTracker },
        ]}
      />

      <AccessibilityPanel
        notes={[
          "UniquenessQuestionCard uses button elements for keyboard-navigable option selection.",
          "Selected options communicate state via both color and font-weight, not color alone.",
          "UniqueProgressTracker uses role='progressbar' with aria-valuenow/min/max for screen readers.",
          "Score display formats numbers with toLocaleString() for locale-appropriate separators.",
          "PersonalityTagCloud tags use span elements; weight is conveyed by visible size difference.",
          "Progress percentage is shown as text alongside the visual bar for screen reader users.",
          "Streak indicator uses a text character plus label, not emoji, for screen reader compatibility.",
          "Category badges on score display use text labels, not colors alone, to convey meaning.",
        ]}
      />

      <RelatedComponents currentId="be-uniq" />
    </div>
  );
}
