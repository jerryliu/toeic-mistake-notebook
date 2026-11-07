'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import {
  analyzeQuestion,
  confirmQuestion,
  ensureLoggedIn,
  getApiBase,
  getQuestion,
  pollJob,
  type QuestionDetail,
} from '../../../lib/api';
import styles from '../../page.module.css';
import confirmStyles from './confirm.module.css';

const ERROR_TYPES = [
  'vocab',
  'pos',
  'collocation',
  'grammar',
  'meaning',
  'locate',
  'time',
  'careless',
  'distract',
];

export default function QuestionConfirmPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [detail, setDetail] = useState<QuestionDetail | null>(null);
  const [part, setPart] = useState(5);
  const [correctOption, setCorrectOption] = useState('A');
  const [userOption, setUserOption] = useState('B');
  const [errorType, setErrorType] = useState('vocab');
  const [explanation, setExplanation] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    await ensureLoggedIn();
    const data = await getQuestion(id);
    setDetail(data);
    setPart(data.question.part ?? 5);
    if (data.question.correctOption) setCorrectOption(data.question.correctOption);
    if (data.question.userOption) setUserOption(data.question.userOption);
    setErrorType(
      data.question.errorType ??
        data.analysis?.errorType ??
        'vocab',
    );
    setExplanation(data.analysis?.correctExplanation ?? '');
    return data;
  }, [id]);

  useEffect(() => {
    refresh().catch((err) => setError((err as Error).message));
  }, [refresh]);

  async function onAnalyze() {
    setBusy(true);
    setError(null);
    setMessage('AI 解析中…');
    try {
      const { jobId, queueMode } = await analyzeQuestion(id);
      setMessage(`analyze job ${jobId}（${queueMode}）`);
      const job = await pollJob(jobId);
      if (job.status === 'failed') {
        throw new Error(job.errorMessage || '分析失敗');
      }
      await refresh();
      setMessage('解析完成，請確認後加入複習');
    } catch (err) {
      setError((err as Error).message);
      setMessage(null);
    } finally {
      setBusy(false);
    }
  }

  async function onConfirm() {
    setBusy(true);
    setError(null);
    try {
      const data = await confirmQuestion(id, {
        part,
        correctOption,
        userOption,
        errorType,
        correctExplanation: explanation,
      });
      setDetail(data);
      setMessage(
        `已加入複習 · next_review_at=${data.question.nextReviewAt ?? 'now'}`,
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!detail && !error) {
    return <div className={styles.main}>載入中…</div>;
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          TOEIC 錯題記憶庫
        </Link>
        <nav className={styles.nav}>
          <Link href="/ingest">新增錯題</Link>
        </nav>
      </header>

      <main className={styles.main}>
        <section className={confirmStyles.panel}>
          <h1>確認並加入複習</h1>
          <p className={confirmStyles.meta}>
            狀態：{detail?.question.status ?? '—'} · ID：{id}
          </p>

          {detail?.question.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className={confirmStyles.preview}
              src={`${getApiBase()}${detail.question.imageUrl}`}
              alt="題目截圖"
            />
          )}

          <label>
            題幹
            <textarea
              rows={3}
              value={detail?.question.stem ?? ''}
              readOnly
            />
          </label>

          <ul className={confirmStyles.options}>
            {detail?.options.map((o) => (
              <li key={o.label}>
                <strong>{o.label}.</strong> {o.content}
              </li>
            ))}
          </ul>

          <div className={confirmStyles.grid}>
            <label>
              Part
              <select value={part} onChange={(e) => setPart(Number(e.target.value))}>
                <option value={5}>5</option>
                <option value={6}>6</option>
                <option value={7}>7</option>
              </select>
            </label>
            <label>
              正解
              <select
                value={correctOption}
                onChange={(e) => setCorrectOption(e.target.value)}
              >
                {['A', 'B', 'C', 'D'].map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label>
              我的答案
              <select
                value={userOption}
                onChange={(e) => setUserOption(e.target.value)}
              >
                {['A', 'B', 'C', 'D'].map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label>
              錯誤類型
              <select
                value={errorType}
                onChange={(e) => setErrorType(e.target.value)}
              >
                {ERROR_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            正解解釋
            <textarea
              rows={5}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="執行 AI 解析後會預填，可直接改"
            />
          </label>

          {detail?.analysis?.confidence && (
            <p className={confirmStyles.meta}>
              AI confidence：{detail.analysis.confidence} · type：
              {detail.analysis.questionType}
            </p>
          )}

          <div className={confirmStyles.actions}>
            <button
              className={styles.ghost}
              type="button"
              disabled={busy}
              onClick={onAnalyze}
            >
              AI 解析
            </button>
            <button
              className={styles.primary}
              type="button"
              disabled={busy || detail?.question.status === 'ready'}
              onClick={onConfirm}
            >
              確認並加入複習
            </button>
          </div>

          {message && <p className={confirmStyles.ok}>{message}</p>}
          {error && <p className={confirmStyles.error}>{error}</p>}
        </section>
      </main>
    </div>
  );
}
