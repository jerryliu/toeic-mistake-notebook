'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  ensureLoggedIn,
  getWeaknesses,
  type WeaknessesResponse,
} from '../../lib/api';
import styles from '../page.module.css';
import analyticsStyles from './analytics.module.css';

type Range = '7d' | '30d';

function pct(accuracy: number | null) {
  if (accuracy == null) return '—';
  return `${Math.round(accuracy * 100)}%`;
}

export default function AnalyticsPage() {
  const [range, setRange] = useState<Range>('7d');
  const [data, setData] = useState<WeaknessesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (selected: Range) => {
    setLoading(true);
    setError(null);
    try {
      await ensureLoggedIn();
      const res = await getWeaknesses(selected);
      setData(res);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(range);
  }, [load, range]);

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          TOEIC 錯題記憶庫
        </Link>
        <nav className={styles.nav}>
          <Link href="/ingest">新增錯題</Link>
          <Link href="/review">複習</Link>
          <Link href="/analytics">統計</Link>
        </nav>
      </header>

      <main className={styles.main}>
        <section className={analyticsStyles.panel}>
          <div className={analyticsStyles.top}>
            <div>
              <h1>我哪裡一直錯</h1>
              <p className={analyticsStyles.lead}>
                只看錯誤模式與複習負荷，不做分數預測。
              </p>
            </div>
            <div className={analyticsStyles.range}>
              <button
                type="button"
                className={range === '7d' ? styles.primary : styles.ghost}
                onClick={() => setRange('7d')}
              >
                近 7 天
              </button>
              <button
                type="button"
                className={range === '30d' ? styles.primary : styles.ghost}
                onClick={() => setRange('30d')}
              >
                近 30 天
              </button>
            </div>
          </div>

          {loading && <p className={analyticsStyles.muted}>載入中…</p>}
          {error && <p className={analyticsStyles.error}>{error}</p>}

          {data && !loading && (
            <>
              <p className={analyticsStyles.summary}>{data.summaryLine}</p>

              <div className={analyticsStyles.metrics}>
                <div>
                  <span>區間複習次數</span>
                  <strong>{data.reviews.inRange}</strong>
                </div>
                <div>
                  <span>近 7 天複習</span>
                  <strong>{data.reviews.last7Days}</strong>
                </div>
                <div>
                  <span>待複習</span>
                  <strong>{data.queue.dueCount}</strong>
                </div>
                <div>
                  <span>已入隊題數</span>
                  <strong>{data.queue.readyCount}</strong>
                </div>
              </div>

              <section className={analyticsStyles.block}>
                <h2>各 Part</h2>
                <ul className={analyticsStyles.list}>
                  {data.byPart.map((row) => (
                    <li key={row.part}>
                      <div className={analyticsStyles.rowHead}>
                        <strong>Part {row.part}</strong>
                        <span>
                          {row.questionCount} 題 · 正確率 {pct(row.accuracy)}
                        </span>
                      </div>
                      <div className={analyticsStyles.barTrack}>
                        <div
                          className={analyticsStyles.barFill}
                          style={{
                            width: `${Math.round((row.accuracy ?? 0) * 100)}%`,
                          }}
                        />
                      </div>
                      <p className={analyticsStyles.muted}>
                        區間複習 {row.reviewCount} 次 · 答對 {row.correctCount}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>

              <section className={analyticsStyles.block}>
                <h2>錯誤類型分布</h2>
                {data.byErrorType.length === 0 ? (
                  <p className={analyticsStyles.muted}>尚無錯誤分類資料</p>
                ) : (
                  <ul className={analyticsStyles.list}>
                    {data.byErrorType.map((row) => (
                      <li key={row.errorType}>
                        <div className={analyticsStyles.rowHead}>
                          <strong>{row.label}</strong>
                          <span>
                            {row.count} · {Math.round(row.share * 100)}%
                          </span>
                        </div>
                        <div className={analyticsStyles.barTrack}>
                          <div
                            className={analyticsStyles.barFillAccent}
                            style={{
                              width: `${Math.round(row.share * 100)}%`,
                            }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className={analyticsStyles.block}>
                <h2>連續答對</h2>
                <ul className={analyticsStyles.plainList}>
                  <li>目前連續答對：{data.streak.currentCorrectStreak}</li>
                  <li>
                    區間內最長連續答對：{data.streak.bestCorrectStreakInRange}
                  </li>
                  <li>
                    單卡最高 repetition：{data.streak.maxRepetitionOnCard}
                  </li>
                  <li>
                    已達連續 3 次以上的卡：{data.streak.cardsAtStreak3Plus}
                  </li>
                </ul>
              </section>

              <p className={analyticsStyles.muted}>
                草稿／分析中：{data.queue.pendingDraftCount} · 全部題目：
                {data.queue.totalQuestions}
              </p>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
