import BackendStatus from "../components/BackendStatus";

export default function HomePage() {
  return (
    <main className="page">
      <header className="hero">
        <span className="hero__badge">MLBB · ФОТОПОСТЫ</span>
        <h1 className="hero__title">Stream Post</h1>
        <p className="hero__text">
          Готовьте картинку и текст поста MLBB прямо с телефона: расписание матчей, прогнозы стримера
          и итоги дня — из одних и тех же данных.
        </p>
      </header>

      <section className="card">
        <h2 className="card__title">Инструменты</h2>
        <a className="tool" href="#/schedule">
          <span className="tool__name">Расписание матчей</span>
          <span className="tool__text">Картинка с матчами, временем и форматом BO</span>
          <span className="tool__arrow" aria-hidden="true">
            →
          </span>
        </a>
        <a className="tool" href="#/schedule?mode=predict">
          <span className="tool__name">Предикты</span>
          <span className="tool__text">Выставьте предполагаемый счёт — получится картинка в том же стиле</span>
          <span className="tool__arrow" aria-hidden="true">
            →
          </span>
        </a>
        <a className="tool" href="#/schedule?mode=results">
          <span className="tool__name">Итоги дня</span>
          <span className="tool__text">Финальные результаты матчей с подсветкой победителя</span>
          <span className="tool__arrow" aria-hidden="true">
            →
          </span>
        </a>
        <a className="tool" href="#/schedule?tab=logos">
          <span className="tool__name">Логотипы команд</span>
          <span className="tool__text">Загрузите эмблемы один раз — они сохранятся на устройстве</span>
          <span className="tool__arrow" aria-hidden="true">
            →
          </span>
        </a>
        <a className="tool" href="#/schedule?tab=text">
          <span className="tool__name">Текст поста</span>
          <span className="tool__text">Шаблон с разделителями, списком матчей и ссылкой на стрим — превью, правка и копирование</span>
          <span className="tool__arrow" aria-hidden="true">
            →
          </span>
        </a>
      </section>

      <section className="card">
        <h2 className="card__title">Что дальше</h2>
        <p className="card__text">
          Проект готовит и фотографию, и подпись к ней для трёх типов постов. Подключение к Telegram
          и отправка постов напрямую появятся в следующих версиях.
        </p>
      </section>

      <section className="card">
        <h2 className="card__title">Состояние системы</h2>
        <BackendStatus />
      </section>

      <footer className="footer">v0.5.0</footer>
    </main>
  );
}
