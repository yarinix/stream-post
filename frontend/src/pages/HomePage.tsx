import BackendStatus from "../components/BackendStatus";

export default function HomePage() {
  return (
    <main className="page">
      <header className="hero">
        <span className="hero__badge">MLBB · Telegram</span>
        <h1 className="hero__title">Stream Post</h1>
        <p className="hero__text">
          Платформа для создания профессиональных публикаций в Telegram для
          киберспортивных стримеров.
        </p>
      </header>

      <section className="card">
        <h2 className="card__title">Состояние системы</h2>
        <BackendStatus />
      </section>

      <footer className="footer">Фундамент проекта · v0.1.0</footer>
    </main>
  );
}
