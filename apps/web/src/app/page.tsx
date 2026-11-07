import styles from './page.module.css';

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function Home() {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brand}>TOEIC 錯題記憶庫</div>
        <nav className={styles.nav} aria-label="主要導覽">
          <span>錯題</span>
          <span>複習</span>
          <span>統計</span>
        </nav>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <h1>用最短路徑，記住你真正會再錯的題</h1>
          <p>
            Phase 1 骨架已就緒：貼上或上傳題目、AI 解析、複習排程與弱點統計將在後續里程碑接上。
            目前可用測試帳號登入 API，並在此確認 PWA 殼層。
          </p>
          <div className={styles.actions}>
            <a className={styles.primary} href={`${apiBase}/docs`} target="_blank" rel="noreferrer">
              開啟 API 文件
            </a>
            <a className={styles.ghost} href={`${apiBase}/health`} target="_blank" rel="noreferrer">
              健康檢查
            </a>
          </div>
        </section>

        <aside className={styles.meta}>
          <div>測試帳號：test@toeic.local / test1234</div>
          <div>API：{apiBase}</div>
          <div>狀態：Scaffold（尚未實作 OCR／AI／複習 UI）</div>
        </aside>
      </main>

      <footer className={styles.footer}>輸入速度第一 · 主動回憶 · 錯誤分類不可省略</footer>
    </div>
  );
}
