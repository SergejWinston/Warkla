(function () {
  const STORAGE_KEY = "warkla_lang";

  const achievementsByLanguage = {
    en: {
      operations_1: { title: "First Step", description: "Add your first transaction." },
      operations_5: { title: "Building Momentum", description: "Log 5 transactions." },
      operations_10: { title: "Taking Control", description: "Complete 10 transactions." },
      operations_50: { title: "Financial Rhythm", description: "Log 50 transactions." },
      operations_100: { title: "Accounting Master", description: "Complete 100 transactions." },
      active_days_3: { title: "Consistent Start", description: "Track your budget on 3 different days." },
      active_days_7: { title: "Weekly Discipline", description: "Track your budget on 7 different days." },
      active_days_30: { title: "Monthly Master", description: "Track your budget on 30 different days." },
      expense_operations_10: { title: "Expense Tracker", description: "Log 10 expense transactions." },
      income_operations_5: { title: "Income Logger", description: "Add 5 income transactions." },
      categories_5: { title: "Diversified Spending", description: "Use 5 expense categories." },
      total_expense_500: { title: "Major Spender", description: "Reach 500 total expenses." },
      single_expense_100: { title: "Big Purchase", description: "Log one expense for 100 or more." }
    },
    ru: {
      operations_1: { title: "Первый шаг", description: "Добавь первую операцию." },
      operations_5: { title: "Разгон", description: "Сделай 5 операций." },
      operations_10: { title: "Начало пути", description: "Сделай 10 операций и возьми финансы под контроль." },
      operations_50: { title: "Финансовый ритм", description: "Сделай 50 операций. Учет денег стал привычкой." },
      operations_100: { title: "Мастер учета", description: "Сделай 100 операций. Ты уже профи." },
      active_days_3: { title: "Три дня в ритме", description: "Веди учет минимум 3 разных дня." },
      active_days_7: { title: "Неделя дисциплины", description: "Веди учет минимум 7 разных дней." },
      active_days_30: { title: "Месяц контроля", description: "Будь активен в учете 30 разных дней." },
      expense_operations_10: { title: "Расходы под микроскопом", description: "Сделай 10 расходных операций." },
      income_operations_5: { title: "Доходный поток", description: "Добавь 5 доходных операций." },
      categories_5: { title: "Баланс категорий", description: "Используй 5 разных категорий расходов." },
      total_expense_500: { title: "Крупные траты", description: "Накопи 500 суммарных расходов." },
      single_expense_100: { title: "Серьезная покупка", description: "Сделай одну расходную операцию на 100 или больше." }
    }
  };

  const dictionary = {
    en: {
      menu: "Menu",
      lang_label: "Language",
      menu_summary: "Summary",
      menu_add: "Add",
      menu_analytics: "Analytics",
      menu_history: "History",
      menu_achievements: "Achievements",
      summary_sub: "Your financial pulse in one glance",
      widgets_title: "Smart widgets",
      widgets_sub: "Actionable tips based on your current data",
      empty_title: "Start your budget journey",
      empty_desc: "Add your first transaction and unlock insights, forecasts, and achievements.",
      add_first_transaction: "Add first transaction",
      view_all: "View all",
      goal_title: "Savings goal",
      goal_target: "Target amount",
      set_goal: "Set goal",
      goal_not_set: "Set a target and track your savings progress here.",
      goal_progress: "Progress",
      goal_left: "Left:",
      goal_saved: "Goal saved",
      goal_error: "Enter a valid goal amount.",
      risk_title: "Budget risk",
      risk_good: "Budget looks stable for now.",
      risk_negative_forecast: "Forecast is negative. Consider reducing daily expenses.",
      warning_budget_depleted: "Budget is depleted. New expenses can quickly worsen your outlook.",
      warning_daily_limit_exceeded: "Today's spending is above your safe daily limit.",
      warning_negative_forecast: "Forecast is negative. Consider reducing daily expenses.",
      warning_no_expenses_today: "No expenses logged today yet. Keep tracking to stay in control.",
      warning_budget_stable: "Budget looks stable for now.",
      risk_days_left: "Days to stipend:",
      risk_today_limit: "Safe spend today:",
      risk_forecast: "Month forecast:",
      top_categories: "Top categories",
      top_categories_share: "Share",
      quick_actions: "Quick actions",
      action_coffee: "Coffee expense",
      action_transport: "Transport expense",
      action_income: "Add income",
      fab_add: "Add transaction",
      templates_title: "Templates",
      templates_sub: "Use a preset or create your own",
      templates_empty: "No custom templates yet.",
      template_name: "Template name",
      template_name_required: "Enter a template name.",
      template_amount_required: "Set a valid amount before saving a template.",
      save_template: "Save template",
      template_saved: "Template saved",
      template_deleted: "Template deleted",
      template_coffee: "Coffee",
      template_transport: "Transport",
      template_stipend: "stipend",
      template_value_coffee: "coffee",
      template_value_transport: "transport",
      template_value_stipend: "stipend",
      delete: "Delete",
      logout: "Logout",
      today: "Today",
      balance: "Balance",
      days_to_stipend: "Days to stipend",
      safe_spend_today: "Safe spend today",
      month_forecast: "Month forecast",
      profile_settings: "Profile settings",
      avatar: "Avatar",
      upload_avatar: "Upload avatar",
      username: "Username",
      stipend_day: "Stipend day (1-31)",
      save_profile: "Save profile",
      add_transaction: "Add transaction",
      type: "Type",
      type_expense: "Expense",
      type_income: "Income",
      amount: "Amount",
      category: "Category",
      source: "Source",
      placeholder_category: "food",
      placeholder_source: "scholarship",
      date: "Date",
      note: "Note",
      save: "Save",
      amount_hint: "Enter amount greater than 0",
      amount_validation_error: "Amount must be greater than 0.",
      category_split: "Category split",
      balance_timeline: "Balance timeline",
      analytics_stats_title: "Period stats",
      analytics_insights_title: "Insights",
      stats_total_income: "Total income",
      stats_total_expense: "Total expense",
      stats_daily_avg_expense: "Avg daily expense",
      stats_transactions_per_day: "Transactions per day",
      insight_sources: "Income sources",
      insight_top_source: "Top source",
      insight_comparison: "Period comparison",
      insight_anomalies: "Anomalies",
      insight_none: "No anomalies detected for selected lookback.",
      comparison_no_baseline: "No baseline for percent change yet",
      comparison_income: "Income",
      comparison_expense: "Expense",
      comparison_net: "Net",
      no_data_for_chart: "Not enough data for chart yet.",
      recent_transactions: "Recent transactions",
      history_search_placeholder: "Search notes, categories, source",
      history_sort_newest: "Newest first",
      history_sort_oldest: "Oldest first",
      history_sort_amount_desc: "Amount high to low",
      history_sort_amount_asc: "Amount low to high",
      history_type_all: "All types",
      history_category_all: "All categories",
      history_apply: "Apply",
      history_reset: "Reset",
      history_retry: "Retry",
      history_load_more: "Load more",
      history_loading: "Loading transactions...",
      history_no_matches: "No matches for current search.",
      history_status_visible: "Visible",
      history_status_loaded: "Loaded",
      history_status_total: "Total",
      achievements: "Achievements",
      login_title: "Login",
      login_sub: "Welcome back to your budget world.",
      register_title: "Register",
      register_sub: "Create your account and start tracking.",
      email: "E-mail",
      password: "Password",
      sign_in: "Sign in",
      create_account: "Create account",
      no_account: "No account yet?",
      create_here: "Create one here",
      already_account: "Already have account?",
      go_login: "Go to login",
      no_transactions: "No transactions yet.",
      no_achievements: "No achievements unlocked yet.",
      achievement_locked: "Locked",
      achievement_unlocked: "Unlocked",
      progress: "Progress",
      profile_updated: "Profile updated",
      avatar_uploaded: "Avatar uploaded",
      select_image_first: "Select an image first.",
      session_expired: "Session expired. Please sign in again.",
      saved: "Saved",
      request_failed: "Request failed"
    },
    ru: {
      menu: "Меню",
      lang_label: "Язык",
      menu_summary: "Сводка",
      menu_add: "Добавить",
      menu_analytics: "Аналитика",
      menu_history: "История",
      menu_achievements: "Достижения",
      summary_sub: "Финансовый пульс на одном экране",
      widgets_title: "Умные виджеты",
      widgets_sub: "Практичные подсказки на основе текущих данных",
      empty_title: "Начните вести бюджет",
      empty_desc: "Добавьте первую операцию и получите аналитику, прогноз и достижения.",
      add_first_transaction: "Добавить первую операцию",
      view_all: "Смотреть все",
      goal_title: "Цель накоплений",
      goal_target: "Целевая сумма",
      set_goal: "Сохранить цель",
      goal_not_set: "Задайте цель и отслеживайте прогресс накоплений.",
      goal_progress: "Прогресс",
      goal_left: "Осталось:",
      goal_saved: "Цель сохранена",
      goal_error: "Введите корректную сумму цели.",
      risk_title: "Риск бюджета",
      risk_good: "С бюджетом все стабильно на текущий момент.",
      risk_negative_forecast: "Прогноз отрицательный. Стоит сократить дневные расходы.",
      warning_budget_depleted: "Бюджет на нуле. Новые расходы могут быстро ухудшить прогноз.",
      warning_daily_limit_exceeded: "Сегодняшние траты выше безопасного дневного лимита.",
      warning_negative_forecast: "Прогноз отрицательный. Стоит сократить дневные расходы.",
      warning_no_expenses_today: "Сегодня расходов еще нет. Продолжайте вести учет, чтобы держать контроль.",
      warning_budget_stable: "С бюджетом все стабильно на текущий момент.",
      risk_days_left: "Дней до стипендии:",
      risk_today_limit: "Безопасный лимит сегодня:",
      risk_forecast: "Прогноз на месяц:",
      top_categories: "Топ категорий",
      top_categories_share: "Доля",
      quick_actions: "Быстрые действия",
      action_coffee: "Расход на кофе",
      action_transport: "Расход на транспорт",
      action_income: "Добавить доход",
      fab_add: "Добавить операцию",
      templates_title: "Шаблоны",
      templates_sub: "Используйте базовый шаблон или создайте свой",
      templates_empty: "Пользовательских шаблонов пока нет.",
      template_name: "Название шаблона",
      template_name_required: "Введите название шаблона.",
      template_amount_required: "Укажите корректную сумму перед сохранением шаблона.",
      save_template: "Сохранить шаблон",
      template_saved: "Шаблон сохранен",
      template_deleted: "Шаблон удален",
      template_coffee: "Кофе",
      template_transport: "Транспорт",
      template_stipend: "стипендия",
      template_value_coffee: "кофе",
      template_value_transport: "транспорт",
      template_value_stipend: "стипендия",
      delete: "Удалить",
      logout: "Выйти",
      today: "Сегодня",
      balance: "Баланс",
      days_to_stipend: "Дней до стипендии",
      safe_spend_today: "Безопасный лимит",
      month_forecast: "Прогноз на месяц",
      profile_settings: "Настройки профиля",
      avatar: "Аватар",
      upload_avatar: "Загрузить аватар",
      username: "Имя пользователя",
      stipend_day: "День стипендии (1-31)",
      save_profile: "Сохранить профиль",
      add_transaction: "Добавить операцию",
      type: "Тип",
      type_expense: "Расход",
      type_income: "Доход",
      amount: "Сумма",
      category: "Категория",
      source: "Источник",
      placeholder_category: "еда",
      placeholder_source: "стипендия",
      date: "Дата",
      note: "Комментарий",
      save: "Сохранить",
      amount_hint: "Введите сумму больше 0",
      amount_validation_error: "Сумма должна быть больше 0.",
      category_split: "Разбивка по категориям",
      balance_timeline: "Динамика баланса",
      analytics_stats_title: "Статистика периода",
      analytics_insights_title: "Инсайты",
      stats_total_income: "Доход за период",
      stats_total_expense: "Расход за период",
      stats_daily_avg_expense: "Средний дневной расход",
      stats_transactions_per_day: "Операций в день",
      insight_sources: "Источники дохода",
      insight_top_source: "Топ источник",
      insight_comparison: "Сравнение периодов",
      insight_anomalies: "Аномалии",
      insight_none: "Аномалий за выбранный период не найдено.",
      comparison_no_baseline: "Недостаточно базы для расчета процента",
      comparison_income: "Доход",
      comparison_expense: "Расход",
      comparison_net: "Нетто",
      no_data_for_chart: "Пока недостаточно данных для графика.",
      recent_transactions: "Последние операции",
      history_search_placeholder: "Поиск по комментарию, категории, источнику",
      history_sort_newest: "Сначала новые",
      history_sort_oldest: "Сначала старые",
      history_sort_amount_desc: "Сумма: по убыванию",
      history_sort_amount_asc: "Сумма: по возрастанию",
      history_type_all: "Все типы",
      history_category_all: "Все категории",
      history_apply: "Применить",
      history_reset: "Сброс",
      history_retry: "Повторить",
      history_load_more: "Показать еще",
      history_loading: "Загрузка операций...",
      history_no_matches: "По текущему запросу ничего не найдено.",
      history_status_visible: "Показано",
      history_status_loaded: "Загружено",
      history_status_total: "Всего",
      achievements: "Достижения",
      login_title: "Вход",
      login_sub: "С возвращением в ваш бюджетный мир.",
      register_title: "Регистрация",
      register_sub: "Создайте аккаунт и начните учитывать финансы.",
      email: "Почта",
      password: "Пароль",
      sign_in: "Войти",
      create_account: "Создать аккаунт",
      no_account: "Нет аккаунта?",
      create_here: "Создайте здесь",
      already_account: "Уже есть аккаунт?",
      go_login: "Перейти ко входу",
      no_transactions: "Операций пока нет.",
      no_achievements: "Пока нет открытых достижений.",
      achievement_locked: "Закрыто",
      achievement_unlocked: "Открыто",
      progress: "Прогресс",
      profile_updated: "Профиль обновлен",
      avatar_uploaded: "Аватар загружен",
      select_image_first: "Сначала выберите изображение.",
      session_expired: "Сессия истекла. Войдите снова.",
      saved: "Сохранено",
      request_failed: "Ошибка запроса"
    }
  };

  function getPreferredLanguage() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && dictionary[stored]) {
      return stored;
    }

    const navLang = (navigator.language || "en").toLowerCase();
    if (navLang.startsWith("ru")) {
      return "ru";
    }
    return "en";
  }

  let currentLanguage = getPreferredLanguage();

  function t(key) {
    return dictionary[currentLanguage][key] || dictionary.en[key] || key;
  }

  function applyTranslations(root = document) {
    root.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.dataset.i18n;
      el.textContent = t(key);
    });

    root.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.dataset.i18nPlaceholder;
      el.placeholder = t(key);
    });

    document.documentElement.lang = currentLanguage;
  }

  function setLanguage(lang, notify = true) {
    if (!dictionary[lang]) {
      return;
    }

    currentLanguage = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    applyTranslations();

    document.querySelectorAll("[data-lang-select]").forEach((select) => {
      select.value = lang;
    });

    if (notify) {
      window.dispatchEvent(new CustomEvent("warkla:langchange", { detail: { lang } }));
    }
  }

  function getAchievementText(key, fallbackTitle, fallbackDescription) {
    const localized = achievementsByLanguage[currentLanguage]?.[key];
    if (localized) {
      return localized;
    }
    return {
      title: fallbackTitle || key,
      description: fallbackDescription || "",
    };
  }

  function initLanguageSelectors() {
    document.querySelectorAll("[data-lang-select]").forEach((select) => {
      select.value = currentLanguage;
      select.addEventListener("change", () => {
        setLanguage(select.value);
      });
    });
  }

  window.I18N = {
    t,
    getAchievementText,
    getLanguage: () => currentLanguage,
    setLanguage,
    applyTranslations,
  };

  initLanguageSelectors();
  applyTranslations();
})();
