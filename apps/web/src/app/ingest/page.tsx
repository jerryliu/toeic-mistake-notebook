'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import {
  createQuestion,
  ensureLoggedIn,
  pollJob,
  uploadOcr,
} from '../../lib/api';
import styles from '../page.module.css';
import ingestStyles from './ingest.module.css';

const EMPTY_OPTIONS = [
  { label: 'A', content: '' },
  { label: 'B', content: '' },
  { label: 'C', content: '' },
  { label: 'D', content: '' },
];

export default function IngestPage() {
  const router = useRouter();
  const [stem, setStem] = useState('');
  const [options, setOptions] = useState(EMPTY_OPTIONS);
  const [correctOption, setCorrectOption] = useState('A');
  const [userOption, setUserOption] = useState('B');
  const [part, setPart] = useState(5);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  async function onPasteSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setHint(null);
    try {
      await ensureLoggedIn();
      const filled = options.filter((o) => o.content.trim());
      if (filled.length < 2) {
        throw new Error('至少填兩個選項');
      }
      const detail = await createQuestion({
        stem: stem.trim(),
        options: filled,
        correctOption,
        userOption,
        part,
      });
      router.push(`/questions/${detail.question.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onUpload(file: File | null) {
    if (!file) return;
    setBusy(true);
    setError(null);
    setHint('上傳中，Mock OCR 處理…');
    try {
      await ensureLoggedIn();
      const res = await uploadOcr(file);
      setHint(`OCR job ${res.jobId}（${res.queueMode}）`);
      await pollJob(res.jobId);
      router.push(`/questions/${res.question.question.id}`);
    } catch (err) {
      setError((err as Error).message);
      setHint(null);
    } finally {
      setBusy(false);
    }
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
        <section className={ingestStyles.panel}>
          <h1>快速輸入</h1>
          <p className={ingestStyles.lead}>貼上題幹選項，或上傳截圖（Mock OCR）。</p>

          <form className={ingestStyles.form} onSubmit={onPasteSubmit}>
            <label>
              Part
              <select
                value={part}
                onChange={(e) => setPart(Number(e.target.value))}
              >
                <option value={5}>Part 5</option>
                <option value={6}>Part 6</option>
                <option value={7}>Part 7</option>
              </select>
            </label>

            <label>
              題幹
              <textarea
                required
                rows={4}
                value={stem}
                onChange={(e) => setStem(e.target.value)}
                placeholder="貼上題目…"
              />
            </label>

            {options.map((opt, idx) => (
              <label key={opt.label}>
                選項 {opt.label}
                <input
                  value={opt.content}
                  onChange={(e) => {
                    const next = [...options];
                    next[idx] = { ...opt, content: e.target.value };
                    setOptions(next);
                  }}
                  placeholder={`選項 ${opt.label}`}
                />
              </label>
            ))}

            <div className={ingestStyles.row}>
              <label>
                正解
                <select
                  value={correctOption}
                  onChange={(e) => setCorrectOption(e.target.value)}
                >
                  {options.map((o) => (
                    <option key={o.label} value={o.label}>
                      {o.label}
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
                  {options.map((o) => (
                    <option key={o.label} value={o.label}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button className={styles.primary} type="submit" disabled={busy}>
              {busy ? '處理中…' : '建立並前往確認'}
            </button>
          </form>

          <div className={ingestStyles.divider}>或</div>

          <label className={ingestStyles.upload}>
            上傳截圖 OCR
            <input
              type="file"
              accept="image/*"
              disabled={busy}
              onChange={(e) => onUpload(e.target.files?.[0] ?? null)}
            />
          </label>

          {hint && <p className={ingestStyles.hint}>{hint}</p>}
          {error && <p className={ingestStyles.error}>{error}</p>}
        </section>
      </main>
    </div>
  );
}
