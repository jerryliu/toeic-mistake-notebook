import { ReviewConfidence } from '../common/enums';
import { computeNextSchedule } from './schedule';

describe('computeNextSchedule', () => {
  const now = new Date('2026-11-07T00:00:00.000Z');

  it('schedules forgot for 10 minutes', () => {
    const result = computeNextSchedule({
      confidence: ReviewConfidence.Forgot,
      previousRepetitionCount: 2,
      now,
    });
    expect(result.repetitionCount).toBe(0);
    expect(result.intervalDays).toBe(0);
    expect(result.nextReviewAt.toISOString()).toBe('2026-11-07T00:10:00.000Z');
  });

  it('schedules wrong familiar for 1 day and resets streak', () => {
    const result = computeNextSchedule({
      confidence: ReviewConfidence.WrongFamiliar,
      previousRepetitionCount: 2,
      now,
    });
    expect(result.repetitionCount).toBe(0);
    expect(result.intervalDays).toBe(1);
  });

  it('uses 3/7 days before streak of 3', () => {
    expect(
      computeNextSchedule({
        confidence: ReviewConfidence.CorrectUnsure,
        previousRepetitionCount: 1,
        now,
      }).intervalDays,
    ).toBe(3);
    expect(
      computeNextSchedule({
        confidence: ReviewConfidence.CorrectConfident,
        previousRepetitionCount: 1,
        now,
      }).intervalDays,
    ).toBe(7);
  });

  it('uses 14/30 days after 3 consecutive correct', () => {
    expect(
      computeNextSchedule({
        confidence: ReviewConfidence.CorrectUnsure,
        previousRepetitionCount: 2,
        now,
      }).intervalDays,
    ).toBe(14);
    expect(
      computeNextSchedule({
        confidence: ReviewConfidence.CorrectConfident,
        previousRepetitionCount: 2,
        now,
      }).intervalDays,
    ).toBe(30);
  });
});
