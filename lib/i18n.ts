export const LOCALE = 'ru';

export const messages = {
  nav: {
    dashboard: 'Панель',
    search: 'Поиск',
    watchlist: 'Мой список',
    summaries: 'История сводок',
  },
  metadata: {
    title: 'Signalist',
    description: 'Отслеживайте цены акций в реальном времени, получайте персональные уведомления и изучайте данные компаний.',
  },
  auth: {
    signInTitle: 'С возвращением',
    signUpTitle: 'Регистрация и персонализация',
    email: 'Email',
    emailPlaceholder: 'contact@example.com',
    password: 'Пароль',
    passwordPlaceholder: 'Введите пароль',
    strongPasswordPlaceholder: 'Введите надежный пароль',
    fullName: 'Полное имя',
    fullNamePlaceholder: 'Иван Иванов',
    country: 'Страна',
    investmentGoals: 'Инвестиционные цели',
    investmentGoalsPlaceholder: 'Выберите инвестиционную цель',
    riskTolerance: 'Готовность к риску',
    riskTolerancePlaceholder: 'Выберите уровень риска',
    preferredIndustry: 'Предпочитаемая отрасль',
    preferredIndustryPlaceholder: 'Выберите отрасль',
    signIn: 'Войти',
    signingIn: 'Входим...',
    signUp: 'Начать инвестиционный путь',
    creatingAccount: 'Создаем аккаунт...',
    noAccount: 'Нет аккаунта?',
    createAccount: 'Создать аккаунт',
    hasAccount: 'Уже есть аккаунт?',
    signInLink: 'Войти',
    signInFailed: 'Не удалось войти',
    signInFailedDescription: 'Не удалось выполнить вход.',
    signUpFailed: 'Не удалось зарегистрироваться',
    signUpFailedDescription: 'Не удалось создать аккаунт.',
    emailRequired: 'Email обязателен',
    emailInvalid: 'Введите корректный email',
    passwordRequired: 'Пароль обязателен',
    fullNameRequired: 'Имя обязательно',
    fullNameMinLength: 'Введите минимум 2 символа',
  },
  authAside: {
    testimonial: 'Signalist превратил мой список наблюдения в рабочий инструмент. Уведомления приходят вовремя, и я увереннее принимаю решения на рынке.',
    author: '- Итан Р.',
    role: 'Частный инвестор',
  },
  search: {
    addStock: 'Добавить акцию',
    openSearch: 'Поиск',
    placeholder: 'Искать акции...',
    loading: 'Загружаем акции...',
    noResults: 'Ничего не найдено',
    noStocks: 'Нет доступных акций',
    results: 'Результаты поиска',
    popular: 'Популярные акции',
  },
  watchlist: {
    add: 'Добавить в список',
    remove: 'Удалить',
    adding: 'Добавляем...',
    removing: 'Удаляем...',
    added: '{{symbol}} добавлена в список',
    removed: '{{symbol}} удалена из списка',
    actionFailed: 'Не удалось обновить список',
    pageTitle: 'Мой список',
    pageDescription: 'Компании, которые вы отслеживаете. Эти тикеры используются для персональной дневной сводки по почте.',
    emptyTitle: 'Список пока пуст',
    emptyDescription: 'Откройте поиск, выберите компанию и добавьте ее в список наблюдения.',
    table: {
      company: 'Компания',
      symbol: 'Тикер',
      price: 'Цена',
      change: 'Изменение',
      marketCap: 'Капитализация',
      pe: 'P/E',
      action: 'Действие',
    },
    addTitle: 'Добавить {{symbol}} в список наблюдения',
    removeTitle: 'Удалить {{symbol}} из списка наблюдения',
  },
  country: {
    select: 'Выберите страну...',
    search: 'Искать страну...',
    notFound: 'Страна не найдена.',
    helper: 'Это поможет показывать более релевантные рыночные данные и новости.',
  },
  validation: {
    selectRequired: 'Выберите {{label}}',
  },
  userMenu: {
    logout: 'Выйти',
  },
  telegram: {
    title: 'Telegram-уведомления',
    connected: 'Telegram подключен{{username}}. Дневные сводки будут приходить в Telegram и на email.',
    disconnected: 'Подключите Telegram, чтобы получать дневные сводки не только на email.',
    connect: 'Подключить Telegram',
    reconnect: 'Переподключить Telegram',
    disconnect: 'Отключить',
    connecting: 'Создаем ссылку...',
    disconnecting: 'Отключаем...',
    connectFailed: 'Не удалось создать ссылку Telegram',
    disconnectFailed: 'Не удалось отключить Telegram',
    disconnectedToast: 'Telegram отключен',
  },
  notifications: {
    title: 'Ручная отправка сводки',
    description: 'Запустите дневную сводку прямо сейчас. Signalist проанализирует ваш список, добавит актуальные цены и отправит уведомление на email и в Telegram, если он подключен.',
    trigger: 'Отправить сводку сейчас',
    triggering: 'Запускаем отправку...',
    triggeredToast: 'Сводка поставлена в очередь отправки',
    triggerFailed: 'Не удалось запустить отправку сводки',
    scheduleTitle: 'Расписание уведомлений',
    scheduleDescription: 'Выберите локальное время, когда Signalist будет автоматически отправлять дневную сводку на email и в Telegram.',
    timeLabel: 'Время',
    timezoneLabel: 'Часовой пояс',
    currentSchedule: 'Текущая настройка',
    defaultSchedule: 'По умолчанию',
    changeSchedule: 'Изменить',
    cancelSchedule: 'Отмена',
    saveSchedule: 'Сохранить',
    savingSchedule: 'Сохраняем...',
    scheduleSavedToast: 'Время уведомлений сохранено',
    scheduleSavedInline: 'Сохранено',
    scheduleSaveFailed: 'Не удалось сохранить время уведомлений',
  },
  summaryHistory: {
    pageTitle: 'История сводок',
    pageDescription: 'Сохраненные результаты дневных AI-сводок по компаниям из вашего списка.',
    emptyTitle: 'История пока пуста',
    emptyDescription: 'Запустите дневную сводку вручную или дождитесь автоматической отправки. После генерации здесь появятся сохраненные выводы по компаниям.',
    openWatchlist: 'Перейти к моему списку',
    table: {
      date: 'Дата',
      company: 'Компания',
      summary: 'Краткий вывод',
      rating: 'AI-рейтинг',
      sentiment: 'Тональность',
      impact: 'Влияние',
      price: 'Цена',
    },
    sentiment: {
      positive: 'Позитивная',
      neutral: 'Нейтральная',
      negative: 'Негативная',
      mixed: 'Смешанная',
    },
  },
  aiChat: {
    title: 'AI-аналитик',
    watchlistSubtitle: 'Задавайте вопросы по вашему списку, текущим ценам и свежим новостям.',
    stockSubtitle: 'Контекст: {{symbol}}, ваш список и свежие новости рынка.',
    empty: 'Спросите, что изменилось сегодня, какие риски видны по списку или как понять последние новости.',
    placeholder: 'Например: объясни, что сейчас важно по моему списку...',
    send: 'Спросить',
    thinking: 'Анализируем данные...',
    error: 'Не удалось получить ответ AI. Попробуйте повторить позже.',
    quick: {
      watchlistSummary: 'Проанализируй мой список',
      mainRisks: 'Какие главные риски?',
      whatChanged: 'Что важного изменилось сегодня?',
      stockSummary: 'Проанализируй {{symbol}}',
      stockRisks: 'Какие риски у {{symbol}}?',
      newsImpact: 'Как новости влияют на {{symbol}}?',
    },
  },
  priceChart: {
    title: 'Динамика цен моего списка',
    description: 'Сравнивайте компании из списка по цене или процентному изменению, смотрите новости-маркеры и общий рыночный бенчмарк.',
    refresh: 'Обновить',
    loading: 'Загружаем исторические цены...',
    empty: 'Добавьте компании в список или попробуйте другой период, чтобы увидеть график.',
    modePercent: 'Изменение %',
    modePrice: 'Цена',
    benchmark: 'S&P 500',
    aiInsight: 'AI-вывод по динамике',
    newsMarkers: 'Новости на графике',
    noNewsMarkers: 'За выбранный период значимых новостных маркеров не найдено.',
    unavailable: 'Нет исторических данных по тикерам: {{symbols}}.',
    unknownUnavailableReason: 'причина неизвестна',
    attemptedSymbols: 'Проверялись варианты: {{symbols}}.',
    skipped: 'Чтобы не перегружать график и API, не загружены дополнительные тикеры: {{symbols}}.',
  },
  home: {
    marketOverview: 'Обзор рынка',
    stockHeatmap: 'Тепловая карта акций',
  },
  options: {
    goals: {
      growth: 'Рост капитала',
      income: 'Доход',
      balanced: 'Сбалансированно',
      conservative: 'Консервативно',
    },
    risk: {
      low: 'Низкий',
      medium: 'Средний',
      high: 'Высокий',
    },
    industries: {
      technology: 'Технологии',
      healthcare: 'Здравоохранение',
      finance: 'Финансы',
      energy: 'Энергетика',
      consumerGoods: 'Потребительские товары',
    },
    alertTypes: {
      upper: 'Выше',
      lower: 'Ниже',
    },
    conditions: {
      greater: 'Больше чем (>)',
      less: 'Меньше чем (<)',
    },
  },
  tradingView: {
    financial: 'Финансы',
    technology: 'Технологии',
    services: 'Сервисы',
    stocks: 'Акции',
  },
  email: {
    welcomeSubject: 'Добро пожаловать в Signalist - ваш набор инструментов для рынка готов',
    welcomeText: 'Спасибо за регистрацию в Signalist',
    newsSubject: 'Сводка рыночных новостей за сегодня - {{date}}',
    newsText: 'Сегодняшняя сводка рыночных новостей от Signalist',
    noMarketNews: 'Сегодня рыночных новостей нет. Проверьте обновления завтра.',
  },
  fallbacks: {
    welcomeIntro: 'Спасибо, что присоединились к Signalist. Теперь у вас есть инструменты, чтобы отслеживать рынок и принимать более взвешенные решения.',
    noMarketNews: 'Сегодня рыночных новостей нет.',
    telegramNoMarketNews: '<b>Сводка Signalist</b>\n\nСегодня рыночных новостей нет.',
  },
} as const;

type MessageTree = typeof messages;
type Join<K, P> = K extends string | number
  ? P extends string | number
    ? `${K}.${P}`
    : never
  : never;
type Leaves<T> = T extends string
  ? never
  : {
      [K in keyof T]: T[K] extends string ? K : Join<K, Leaves<T[K]>>;
    }[keyof T];

export type MessageKey = Leaves<MessageTree>;

export function t(key: MessageKey, values?: Record<string, string | number>) {
  const text = key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, messages);

  if (typeof text !== 'string') return key;

  if (!values) return text;

  return Object.entries(values).reduce(
    (result, [name, value]) => result.replaceAll(`{{${name}}}`, String(value)),
    text
  );
}
