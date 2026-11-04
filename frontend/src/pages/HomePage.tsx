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
        <h2 className="card__title">Инструменты</h2>
        <a className="tool" href="#/schedule">
          <span className="tool__name">Расписание матчей</span>
          <span className="tool__text">Картинка с расписанием для публикации в Telegram</span>
          <span className="tool__arrow" aria-hidden="true">
            →
          </span>
        </a>
      </section>

      <section className="card">
        <h2 className="card__title">Состояние системы</h2>
        <BackendStatus />
      </section>

      <footer className="footer">v0.2.0</footer>
    </main>
  );
}
