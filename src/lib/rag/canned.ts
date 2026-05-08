/**
 * Canned RAG demo runs for the RagFlow island.
 *
 * Each run is a hand-authored (question, retrieved corpus indices, answer)
 * triple. The retrieved indices reference `sentencesFixture.sentences` from
 * `src/lib/embeddings/sentences-loader.ts` (the same corpus SemanticSearchDemo
 * uses). Answers are deliberately short and don't pretend to be live LLM
 * output — the goal is to show the *flow*, not to run a real model.
 */
export interface CannedRagRun {
  question: string;
  /** Indices into the sentences corpus that the demo "retrieves". */
  retrieved: number[];
  answer: string;
}

export const CANNED_RAG_RUNS: readonly CannedRagRun[] = [
  {
    question: 'What language should I pick up for machine learning?',
    retrieved: [10, 14, 39],
    answer:
      'Python is the most popular choice — it has the deepest set of ML libraries and is what most tutorials assume. TypeScript is occasionally useful if you also want to ship a web UI.',
  },
  {
    question: "What's the best way to see the Northern Lights?",
    retrieved: [21, 22, 29],
    answer:
      'Travel to a high-latitude location (Iceland, Norway, northern Canada, New Zealand for the Southern variant) and aim for a cold, clear winter night well away from city lights.',
  },
  {
    question: 'How does CRISPR work, in one sentence?',
    retrieved: [32, 36, 37],
    answer:
      'CRISPR enables precise edits to specific DNA sequences using a guide RNA that directs an enzyme to cut at a chosen location.',
  },
  {
    question: 'Tips for cooking a great steak at home?',
    retrieved: [1, 7, 5],
    answer:
      'Pat the meat dry, get the pan very hot to develop a Maillard sear, and rest the steak for at least five minutes before slicing so the juices redistribute.',
  },
] as const;
