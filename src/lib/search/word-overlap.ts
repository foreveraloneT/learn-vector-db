const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'do', 'does',
  'from', 'has', 'have', 'how', 'i', 'in', 'is', 'it', 'its', 'me',
  'my', 'of', 'on', 'or', 'so', 'that', 'the', 'this', 'to', 'was', 'we',
  'what', 'when', 'where', 'who', 'why', 'will', 'with', 'you', 'your',
]);

/**
 * Lowercase, strip ASCII punctuation, split on whitespace, drop stopwords,
 * de-duplicate. Order is preserved by first-occurrence so test assertions
 * about tokenization stay readable.
 */
export function tokenize(text: string): string[] {
  const cleaned = text.toLowerCase().replace(/'\w+/g, '').replace(/[^\p{L}\p{N}\s]/gu, ' ');
  const out: string[] = [];
  const seen = new Set<string>();
  for (const tok of cleaned.split(/\s+/)) {
    if (!tok || STOPWORDS.has(tok) || seen.has(tok)) continue;
    seen.add(tok);
    out.push(tok);
  }
  return out;
}

export interface OverlapMatch {
  /** Index into the candidates array, or -1 if no candidate had any token overlap. */
  index: number;
  /** The matched candidate text, or null on no-match. */
  candidate: string | null;
  /** Number of tokens that overlapped. 0 on no-match. */
  score: number;
}

/**
 * Pair `input` to its best-matching candidate by token-set intersection size.
 * Ties go to the earlier index (deterministic).
 */
export function bestOverlapMatch(input: string, candidates: readonly string[]): OverlapMatch {
  const inputTokens = new Set(tokenize(input));
  if (inputTokens.size === 0) {
    return { index: -1, candidate: null, score: 0 };
  }
  let bestIndex = -1;
  let bestScore = 0;
  for (let i = 0; i < candidates.length; i++) {
    const candTokens = tokenize(candidates[i]);
    let score = 0;
    for (const t of candTokens) if (inputTokens.has(t)) score++;
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }
  return {
    index: bestIndex,
    candidate: bestIndex >= 0 ? candidates[bestIndex] : null,
    score: bestScore,
  };
}
