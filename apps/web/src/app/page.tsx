import Link from 'next/link';
import styles from './page.module.css';

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function Home() {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brand}>TOEIC 錯題記憶庫</div>
        <nav className={styles.nav} aria-label="主要導覽">
          <Link href="/ingest">新增錯題</Link>
          <Link href="/review">複習</Link>
          <Link href="/analytics">統計</Link>
        </nav>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <h1>用最短路徑，記住你真正會再錯的題</h1>
          <p>
            可貼上題目或上傳截圖（Mock OCR），AI 預填解析後一鍵確認加入複習，
            再看「我哪裡一直錯」的弱點統計。
          </p>
          <div className={styles.actions}>
            <Link className={styles.primary} href="/ingest">
              開始輸入錯題
            </Link>
            <Link className={styles.ghost} href="/analytics">
              弱點統計
            </Link>
          </div>
        </section>

        <aside className={styles.meta}>
          <div>測試帳號：test@toeic.local / test1234（前端會自動登入）</div>
          <div>API：{apiBase}</div>
          <div>狀態：Ingest / Review / Analytics 可用</div>
          <div>
            <a href={`${apiBase}/docs`} target="_blank" rel="noreferrer">
              API 文件
            </a>
          </div>
        </aside>
      </main>

      <footer className={styles.footer}>輸入速度第一 · 主動回憶 · 錯誤分類不可省略</footer>
    </div>
  );
}
