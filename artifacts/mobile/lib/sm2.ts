// SM-2 Spaced Repetition Algorithm
// Grade: 0=Again, 1=Hard, 2=Easy

export interface SM2Card {
  interval: number;       // days until next review
  repetitions: number;    // number of successful reviews
  easeFactor: number;     // difficulty multiplier (min 1.3)
  dueDate: number;        // ms timestamp
}

export type ReviewGrade = 0 | 1 | 2;

export function sm2Review(card: SM2Card, grade: ReviewGrade): SM2Card {
  const ONE_DAY = 24 * 60 * 60 * 1000;

  // Map grade to SM-2 quality (0-5 scale)
  // Again=1, Hard=3, Easy=5
  const quality = grade === 0 ? 1 : grade === 1 ? 3 : 5;

  let { interval, repetitions, easeFactor } = card;

  if (quality < 3) {
    // Failed - reset
    repetitions = 0;
    interval = 0;
  } else {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }

  // Update ease factor
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  // Due tomorrow minimum for passed cards, or today for failed
  const dueDate = quality < 3
    ? Date.now()
    : Date.now() + interval * ONE_DAY;

  return { interval, repetitions, easeFactor, dueDate };
}

export function isDue(card: SM2Card): boolean {
  return card.dueDate <= Date.now();
}
