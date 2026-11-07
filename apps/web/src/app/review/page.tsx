'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  ensureLoggedIn,
  getApiBase,
  getTodayReviews,
  submitReview,
  type ReviewCard,
  type ReviewConfidence,
} from '../../lib/api';
import styles from '../page.module.css';
import reviewStyles from './review.module.css';

type Phase = 'answer' | 'reason' | 'reveal' | 'done';

const CONFIDENCE_WRONG: Array<{ value: ReviewConfidence; label: string }> = [
  { value: 'forgot', label: '不會' },
  { value: 'wrong_familiar', label: '答錯' },
];

const CONFIDENCE_RIGHT: Array<{ value: ReviewConfidence; label: string }> = [
  { value: 'correct_unsure', label: '答對但不確定' },
  { value: 'correct_confident', label: '答對且很熟' },
];

export default function ReviewPage() {
  const [cards, setCards] = useState<ReviewCard[]>([]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('answer');
  const [selected, setSelected] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await ensureLoggedIn();
      const data = await getTodayReviews();
      setCards(data.items);
      setIndex(0);
      setPhase('answer');
      setSelected(null);
      setReason('');
      setLastResult(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const card = cards[index] ?? null;
  const isCorrect =
    selected != null && selected === card?.reveal.correctOption;

  function onPickOption(label: string) {
    if (phase !== 'answer' || busy) return;
    setSelected(label);
    setPhase('reason');
  }

  function onSkipReason() {
    setPhase('reveal');
  }

  function onContinueFromReason() {
    setPhase('reveal');
  }

  async function onConfidence(confidence: ReviewConfidence) {
    if (!card || !selected) return;
    setBusy(true);
    setError(null);
    try {
      const res = await submitReview(card.prompt.id, {
        recalledOption: selected,
        confidence,
        reasonNote: reason.trim() || undefined,
      });
      setLastResult(
        `下次複習：${new Date(res.question.nextReviewAt).toLocaleString()} · 間隔 ${res.question.intervalDays} 天 · 連續答對 ${res.question.repetitionCount}`,
      );
      setPhase('done');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function onNext() {
    const next = index + 1;
    if (next >= cards.length) {
      void load();
      return;
    }
    setIndex(next);
    setPhase('answer');
    setSelected(null);
    setReason('');
    setLastResult(null);
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          TOEIC 錯題記憶庫
        </Link>
        <nav className={styles.nav}>
          <Link href="/ingest">新增錯題</Link>
          <Link href="/review">複習</Link>
        </nav>
      </header>

      <main className={styles.main}>
        <section className={reviewStyles.panel}>
          <div className={reviewStyles.top}>
            <h1>今日複習</h1>
            <p className={reviewStyles.meta}>
              {loading
                ? '載入中…'
                : cards.length === 0
                  ? '目前沒有到期題目'
                  : `${index + 1} / ${cards.length}`}
            </p>
          </div>

          {!loading && cards.length === 0 && (
            <div className={reviewStyles.empty}>
              <p>沒有待複習的題。先去新增並「確認並加入複習」。</p>
              <Link className={styles.primary} href="/ingest">
                新增錯題
              </Link>
            </div>
          )}

          {card && (
            <>
              <p className={reviewStyles.meta}>
                Part {card.prompt.part ?? '—'} · 連續答對{' '}
                {card.prompt.repetitionCount}
              </p>

              {card.prompt.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className={reviewStyles.preview}
                  src={`${getApiBase()}${card.prompt.imageUrl}`}
                  alt=""
                />
              )}

              <p className={reviewStyles.stem}>{card.prompt.stem}</p>

              <div className={reviewStyles.options}>
                {card.options.map((opt) => {
                  const picked = selected === opt.label;
                  const showKey = phase === 'reveal' || phase === 'done';
                  const isAnswer = opt.label === card.reveal.correctOption;
                  const isOriginal =
                    opt.label === card.reveal.originalUserOption;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      className={[
                        reviewStyles.option,
                        picked ? reviewStyles.picked : '',
                        showKey && isAnswer ? reviewStyles.correct : '',
                        showKey && isOriginal && !isAnswer
                          ? reviewStyles.originalWrong
                          : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      disabled={phase !== 'answer' || busy}
                      onClick={() => onPickOption(opt.label)}
                    >
                      <strong>{opt.label}.</strong> {opt.content}
                    </button>
                  );
                })}
              </div>

              {phase === 'reason' && (
                <div className={reviewStyles.reasonBox}>
                  <label>
                    為什麼選這個？（可跳過）
                    <textarea
                      rows={3}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="簡短寫下理由…"
                    />
                  </label>
                  <div className={reviewStyles.actions}>
                    <button
                      type="button"
                      className={styles.ghost}
                      onClick={onSkipReason}
                    >
                      跳過
                    </button>
                    <button
                      type="button"
                      className={styles.primary}
                      onClick={onContinueFromReason}
                    >
                      看解析
                    </button>
                  </div>
                </div>
              )}

              {(phase === 'reveal' || phase === 'done') && (
                <div className={reviewStyles.reveal}>
                  <p>
                    你的選擇：<strong>{selected}</strong>
                    {isCorrect ? '（正確）' : '（不正確）'}
                  </p>
                  <p>
                    正解：<strong>{card.reveal.correctOption}</strong>
                    {card.reveal.originalUserOption && (
                      <>
                        {' '}
                        · 當初錯選：
                        <strong>{card.reveal.originalUserOption}</strong>
                      </>
                    )}
                  </p>
                  {card.reveal.errorType && (
                    <p>錯誤類型：{card.reveal.errorType}</p>
                  )}
                  {card.reveal.analysis?.correctExplanation && (
                    <p className={reviewStyles.explanation}>
                      {card.reveal.analysis.correctExplanation}
                    </p>
                  )}
                  {card.reveal.analysis?.distractorExplanations && (
                    <ul>
                      {Object.entries(
                        card.reveal.analysis.distractorExplanations,
                      ).map(([k, v]) => (
                        <li key={k}>
                          <strong>{k}</strong>：{v}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {phase === 'reveal' && (
                <div className={reviewStyles.confidence}>
                  <p className={reviewStyles.meta}>記憶程度</p>
                  <div className={reviewStyles.actions}>
                    {(isCorrect ? CONFIDENCE_RIGHT : CONFIDENCE_WRONG).map(
                      (btn) => (
                        <button
                          key={btn.value}
                          type="button"
                          className={styles.primary}
                          disabled={busy}
                          onClick={() => onConfidence(btn.value)}
                        >
                          {btn.label}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              )}

              {phase === 'done' && (
                <div className={reviewStyles.done}>
                  {lastResult && <p>{lastResult}</p>}
                  <button
                    type="button"
                    className={styles.primary}
                    onClick={onNext}
                  >
                    {index + 1 >= cards.length ? '重新整理今日清單' : '下一題'}
                  </button>
                </div>
              )}
            </>
          )}

          {error && <p className={reviewStyles.error}>{error}</p>}
        </section>
      </main>
    </div>
  );
}
