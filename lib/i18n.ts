export const LOCALE = 'ru';

export const messages = {
  nav: {
    dashboard: 'Панель',
    search: 'Поиск',
    watchlist: 'Список наблюдения',
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
    remove: 'Удалить из списка',
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
