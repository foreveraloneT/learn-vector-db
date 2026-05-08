/**
 * Corpus and canned queries for the SemanticSearchDemo island.
 *
 * 50 sentences across 5 topics (cooking, programming, travel, science, sports)
 * and 20 canned queries that span those topics. Order is preserved end-to-end
 * so indices in the JSON fixture map directly back to positions here.
 */
export const SENTENCES: readonly string[] = [
  // Cooking (0–9)
  'Sourdough bread relies on wild yeast captured from the air.',
  'Searing meat develops flavor through the Maillard reaction.',
  'Olive oil smokes at a lower temperature than peanut oil.',
  'Sushi rice is seasoned with vinegar, sugar, and salt.',
  'Pasta water should taste like the sea before the noodles go in.',
  'Caramelizing onions takes at least 30 minutes of patience.',
  'A dull knife is more dangerous than a sharp one in the kitchen.',
  'Resting steak for five minutes lets the juices redistribute.',
  'Baking is precise chemistry; cooking is forgiving improvisation.',
  'Stocks should never boil — a gentle simmer keeps them clear.',
  // Programming (10–19)
  'Python is a popular language for data science and machine learning.',
  'JavaScript runs in every modern web browser without a plugin.',
  'Rust offers memory safety without a garbage collector.',
  'Go was designed for fast compilation and concurrency primitives.',
  'TypeScript adds optional static typing on top of JavaScript.',
  'Functional programming favors pure functions and immutable data.',
  'Version control lets teams collaborate without overwriting each other.',
  'Unit tests catch regressions before they reach production.',
  'A good API has small surface area and predictable behavior.',
  'Caching is the source of half the bugs in distributed systems.',
  // Travel (20–29)
  'Kyoto is famous for its temples and traditional tea houses.',
  'The Northern Lights appear best on cold, clear nights near the poles.',
  'Iceland sits on the boundary of two tectonic plates.',
  'Lisbon is built across seven hills overlooking the Atlantic.',
  'Tokyo runs one of the largest subway systems in the world.',
  'Patagonia stretches across both Argentina and Chile.',
  'The Inca Trail leads to the cloud-shrouded ruins of Machu Picchu.',
  'Marrakech is known for its souks and the High Atlas mountains beyond.',
  'Bali combines volcanic landscapes with terraced rice paddies.',
  'New Zealand is home to dramatic fjords and ancient kauri forests.',
  // Science (30–39)
  'Photosynthesis converts sunlight into chemical energy stored in sugars.',
  'Black holes warp spacetime so much that not even light escapes.',
  'CRISPR enables precise edits to specific sequences of DNA.',
  'The speed of light in a vacuum is a universal constant.',
  'Plate tectonics explains how continents drift over geologic time.',
  'Quantum particles behave as both waves and discrete bundles.',
  'Antibiotics target bacterial cells but leave viruses unaffected.',
  'Vaccines train the immune system without causing the underlying disease.',
  'The carbon cycle moves carbon through air, ocean, soil, and life.',
  'Neural networks learn by adjusting weights to minimize a loss function.',
  // Sports (40–49)
  'A marathon is just over 42 kilometers from start to finish.',
  'Tennis matches are scored in games and sets, not points alone.',
  'Cycling drafting saves a rider roughly 30 percent of their effort.',
  'Climbing routes are graded by difficulty using regional scales.',
  'Soccer offside is judged at the moment the ball is played.',
  'Basketball shot clocks force quick decisions on offense.',
  'Surfing waves break differently over reef versus sand bottoms.',
  "Skiing wax is matched to the day's snow temperature.",
  'Cricket innings can last hours or days depending on the format.',
  'Olympic weightlifting features the snatch and the clean and jerk.',
] as const;

export const QUERIES: readonly string[] = [
  // Cooking
  'How do I make great steak at home',
  'What is the science behind sourdough',
  'Best oils for high heat cooking',
  // Programming
  'Best language for machine learning',
  'Memory-safe systems language',
  'Why use TypeScript over JavaScript',
  'How does version control help teams',
  // Travel
  'Where can I see the Northern Lights',
  'Famous places to visit in Japan',
  'Mountains and ruins in South America',
  'Volcanic islands with rice paddies',
  // Science
  'How do plants make food from sunlight',
  'What are black holes made of',
  'How do vaccines work',
  'What is CRISPR used for',
  // Sports
  'How long is a marathon',
  'How does drafting help cyclists',
  'How is offside decided in soccer',
  'Why do climbers grade routes',
  'Best way to wax skis',
] as const;

export const SENTENCE_TOPICS: readonly { label: string; range: [number, number] }[] = [
  { label: 'cooking', range: [0, 10] },
  { label: 'programming', range: [10, 20] },
  { label: 'travel', range: [20, 30] },
  { label: 'science', range: [30, 40] },
  { label: 'sports', range: [40, 50] },
] as const;
