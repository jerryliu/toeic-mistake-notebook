import { ReviewConfidence } from '../common/enums';

export type ScheduleResult = {
  intervalDays: number;
  nextReviewAt: Date;
  repetitionCount: number;
};

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;

/**
 * Phase 1 simplified schedule (not FSRS).
 * 不會 → 10m | 答錯 → 1d | 答對不確定 → 3d | 答對很熟 → 7d
 * After 3 consecutive correct: 14d (unsure) / 30d (confident).
 */
export function computeNextSchedule(params: {
  confidence: ReviewConfidence;
  previousRepetitionCount: number;
  now?: Date;
}): ScheduleResult {
  const now = params.now ?? new Date();
  const isCorrect =
    params.confidence === ReviewConfidence.CorrectUnsure ||
    params.confidence === ReviewConfidence.CorrectConfident;

  const repetitionCount = isCorrect
    ? params.previousRepetitionCount + 1
    : 0;

  let delayMs: number;
  let intervalDays: number;

  switch (params.confidence) {
    case ReviewConfidence.Forgot:
      delayMs = 10 * MINUTE_MS;
      intervalDays = 0;
      break;
    case ReviewConfidence.WrongFamiliar:
      delayMs = 1 * DAY_MS;
      intervalDays = 1;
      break;
    case ReviewConfidence.CorrectUnsure:
      if (repetitionCount >= 3) {
        delayMs = 14 * DAY_MS;
        intervalDays = 14;
      } else {
        delayMs = 3 * DAY_MS;
        intervalDays = 3;
      }
      break;
    case ReviewConfidence.CorrectConfident:
      if (repetitionCount >= 3) {
        delayMs = 30 * DAY_MS;
        intervalDays = 30;
      } else {
        delayMs = 7 * DAY_MS;
        intervalDays = 7;
      }
      break;
    default:
      delayMs = 1 * DAY_MS;
      intervalDays = 1;
  }

  return {
    intervalDays,
    nextReviewAt: new Date(now.getTime() + delayMs),
    repetitionCount,
  };
}
