/**
 * Curated word list for the EmbeddingMap demo.
 *
 * Four loose semantic clusters (animals, foods, tech, emotions). The list is
 * deliberately small (~30 words) so the 2D PCA projection is easy to read and
 * the JSON fixture stays under a few KB. Order is preserved end-to-end so
 * indices into the fixture array match positions here.
 */
export const EMBEDDING_WORDS: readonly string[] = [
  // Animals
  'cat',
  'dog',
  'bird',
  'fish',
  'lion',
  'tiger',
  'elephant',
  'mouse',
  // Foods
  'pizza',
  'burger',
  'salad',
  'sushi',
  'pasta',
  'rice',
  'bread',
  'soup',
  // Tech
  'computer',
  'phone',
  'laptop',
  'software',
  'internet',
  'code',
  'data',
  'server',
  // Emotions
  'happy',
  'sad',
  'angry',
  'calm',
  'excited',
  'scared',
] as const;

export const EMBEDDING_CLUSTERS: readonly { label: string; range: [number, number] }[] = [
  { label: 'animals', range: [0, 8] },
  { label: 'foods', range: [8, 16] },
  { label: 'tech', range: [16, 24] },
  { label: 'emotions', range: [24, 30] },
] as const;
