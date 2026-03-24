const GOAL_STORAGE_KEY = "warkla_goal_target";
const CUSTOM_TEMPLATES_STORAGE_KEY = "warkla_custom_templates";

const state = {
  token: localStorage.getItem("warkla_token") || "",
  goalTarget: Number(localStorage.getItem(GOAL_STORAGE_KEY) || 0),
  categories: [],
  timeline: [],
  transactions: [],
  achievements: [],
  dashboard: null,
  customTemplates: [],
  analyticsStats: null,
  analyticsSources: [],
  analyticsComparison: null,
  analyticsAnomalies: [],
  categoryChartMode: "pie",
  achievementsUi: {
    filter: "all",
    sort: "progress",
    query: "",
  },
  history: {
    query: "",
    sort: "newest",
    type: "all",
    category: "all",
    dateFrom: "",
    dateTo: "",
    page: 1,
    perPage: 20,
    total: 0,
    pages: 1,
    hasMore: false,
    loading: false,
    items: [],
  },
  txDetails: {
    transactionId: null,
    receiptObjectUrl: "",
    loading: false,
    editMode: false,
    data: null,
  },
  editingTransactionId: null,
  notifications: {
    dedupeMap: {},
  },
};

const t = window.I18N ? window.I18N.t : (key) => key;
const FIXED_CATEGORIES = [
  "food",
  "transport",
  "entertainment",
  "study",
  "communication",
  "health",
  "housing",
  "other",
];
const CATEGORY_ALIASES = {
  food: "food",
  еда: "food",
  transport: "transport",
  транспорт: "transport",
  entertainment: "entertainment",
  развлечения: "entertainment",
  study: "study",
  учеба: "study",
  "учёба": "study",
  communication: "communication",
  связь: "communication",
  health: "health",
  здоровье: "health",
  housing: "housing",
  жилье: "housing",
  "жильё": "housing",
  other: "other",
  прочее: "other",
};

const WARNING_TEXT_TO_KEY = {
  "today's spending is above your safe daily limit.": "warning_daily_limit_exceeded",
  "todays spending is above your safe daily limit.": "warning_daily_limit_exceeded",
  "forecast is negative. consider reducing daily expenses.": "warning_negative_forecast",
  "no expenses logged today yet. keep tracking to stay in control.": "warning_no_expenses_today",
  "budget is depleted. new expenses can quickly worsen your outlook.": "warning_budget_depleted",
  "budget looks stable for now.": "warning_budget_stable",
  "сегодняшние траты выше безопасного дневного лимита.": "warning_daily_limit_exceeded",
  "прогноз отрицательный. стоит сократить дневные расходы.": "warning_negative_forecast",
  "сегодня расходов еще нет. продолжайте вести учет, чтобы держать контроль.": "warning_no_expenses_today",
  "бюджет на нуле. новые расходы могут быстро ухудшить прогноз.": "warning_budget_depleted",
  "с бюджетом все стабильно на текущий момент.": "warning_budget_stable",
};

function normalizeWarningText(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/[\u2019']/g, "")
    .replace(/\s+/g, " ");
}

function resolveWarningText(dashboard) {
  const warningKey = String(dashboard.warning_key || "").trim();
  if (warningKey) {
    const translated = t(warningKey);
    if (translated && translated !== warningKey) {
      return translated;
    }
  }

  const rawWarning = String(dashboard.warning || "").trim();
  if (!rawWarning) {
    return "";
  }

  const fallbackKey = WARNING_TEXT_TO_KEY[normalizeWarningText(rawWarning)];
  return fallbackKey ? t(fallbackKey) : rawWarning;
}

const el = {
  logoutBtn: document.getElementById("logoutBtn"),
  floatingAddBtn: document.getElementById("floatingAddBtn"),
  floatingAddLabel: document.querySelector("#floatingAddBtn [data-fab-label]"),
  addOverlay: document.getElementById("addOverlay"),
  addOverlayBackdrop: document.getElementById("addOverlayBackdrop"),
  addOverlayCloseBtn: document.getElementById("addOverlayCloseBtn"),
  addOverlayTitle: document.getElementById("addOverlayTitle"),
  navToggleBtn: document.getElementById("navToggleBtn"),
  mainNav: document.getElementById("mainNav"),
  profileToggleBtn: document.getElementById("profileToggleBtn"),
  profilePopover: document.getElementById("profilePopover"),
  profileCloseBtn: document.getElementById("profileCloseBtn"),
  profileAvatarMini: document.getElementById("profileAvatarMini"),
  viewLinks: Array.from(document.querySelectorAll("[data-view-link]")),
  viewItems: Array.from(document.querySelectorAll("[data-view-item]")),
  profileForm: document.getElementById("profileForm"),
  profileMsg: document.getElementById("profileMsg"),
  profileUsername: document.getElementById("profileUsername"),
  profileStipendDay: document.getElementById("profileStipendDay"),
  profileAvatar: document.getElementById("profileAvatar"),
  avatarInput: document.getElementById("avatarInput"),
  avatarUploadBtn: document.getElementById("avatarUploadBtn"),
  txForm: document.getElementById("txForm"),
  txType: document.getElementById("txType"),
  txAmount: document.getElementById("txAmount"),
  txCurrency: document.getElementById("txCurrency"),
  txAmountHint: document.getElementById("txAmountHint"),
  txCategory: document.getElementById("txCategory"),
  txDiscount: document.getElementById("txDiscount"),
  txSource: document.getElementById("txSource"),
  txDate: document.getElementById("txDate"),
  txNote: document.getElementById("txNote"),
  txReceiptAddInput: document.getElementById("txReceiptAddInput"),
  txSubmitBtn: document.getElementById("txSubmitBtn"),
  templatesPanel: document.getElementById("templatesPanel"),
  builtinTemplates: document.getElementById("builtinTemplates"),
  customTemplates: document.getElementById("customTemplates"),
  templateNameInput: document.getElementById("templateNameInput"),
  saveTemplateBtn: document.getElementById("saveTemplateBtn"),
  kpiBalance: document.getElementById("kpiBalance"),
  kpiStipend: document.getElementById("kpiStipend"),
  kpiLimit: document.getElementById("kpiLimit"),
  kpiForecast: document.getElementById("kpiForecast"),
  warning: document.getElementById("warning"),
  warningBox: document.getElementById("warningBox"),
  emptyState: document.getElementById("emptyState"),
  emptyStateAddBtn: document.getElementById("emptyStateAddBtn"),
  txList: document.getElementById("txList"),
  summaryTxList: document.getElementById("summaryTxList"),
  achievements: document.getElementById("achievements"),
  summaryAchievements: document.getElementById("summaryAchievements"),
  achievementsSummaryStats: document.getElementById("achievementsSummaryStats"),
  achievementsFilter: document.getElementById("achievementsFilter"),
  achievementsSort: document.getElementById("achievementsSort"),
  achievementsSearch: document.getElementById("achievementsSearch"),
  achievementsClearFilters: document.getElementById("achievementsClearFilters"),
  categoryChart: document.getElementById("categoryChart"),
  timelineChart: document.getElementById("timelineChart"),
  analyticsStats: document.getElementById("analyticsStats"),
  analyticsInsights: document.getElementById("analyticsInsights"),
  goalForm: document.getElementById("goalForm"),
  goalWidget: document.getElementById("goalWidget"),
  goalInput: document.getElementById("goalInput"),
  goalText: document.getElementById("goalText"),
  goalProgressFill: document.getElementById("goalProgressFill"),
  riskText: document.getElementById("riskText"),
  riskHints: document.getElementById("riskHints"),
  topCategories: document.getElementById("topCategories"),
  quickActionBtns: Array.from(document.querySelectorAll("[data-quick-action]")),
  goHistoryBtn: document.getElementById("goHistoryBtn"),
  goAchievementsBtn: document.getElementById("goAchievementsBtn"),
  historySearch: document.getElementById("historySearch"),
  historySort: document.getElementById("historySort"),
  historyType: document.getElementById("historyType"),
  historyCategory: document.getElementById("historyCategory"),
  historyDateFrom: document.getElementById("historyDateFrom"),
  historyDateTo: document.getElementById("historyDateTo"),
  historyApplyBtn: document.getElementById("historyApplyBtn"),
  historyResetBtn: document.getElementById("historyResetBtn"),
  historyExportCsvBtn: document.getElementById("historyExportCsvBtn"),
  historyExportPdfBtn: document.getElementById("historyExportPdfBtn"),
  historyStatus: document.getElementById("historyStatus"),
  historyError: document.getElementById("historyError"),
  historyErrorText: document.getElementById("historyErrorText"),
  historyRetryBtn: document.getElementById("historyRetryBtn"),
  historyLoadMoreBtn: document.getElementById("historyLoadMoreBtn"),
  txDetailsBackdrop: document.getElementById("txDetailsBackdrop"),
  txDetailsModal: document.getElementById("txDetailsModal"),
  txDetailsCloseBtn: document.getElementById("txDetailsCloseBtn"),
  txDetailsMsg: document.getElementById("txDetailsMsg"),
  txDetailsType: document.getElementById("txDetailsType"),
  txDetailsAmountInput: document.getElementById("txDetailsAmountInput"),
  txDetailsCurrency: document.getElementById("txDetailsCurrency"),
  txDetailsCategorySelect: document.getElementById("txDetailsCategorySelect"),
  txDetailsDiscount: document.getElementById("txDetailsDiscount"),
  txDetailsSourceInput: document.getElementById("txDetailsSourceInput"),
  txDetailsDate: document.getElementById("txDetailsDate"),
  txDetailsNoteInput: document.getElementById("txDetailsNoteInput"),
  txReceiptHint: document.getElementById("txReceiptHint"),
  txReceiptPreview: document.getElementById("txReceiptPreview"),
  txReceiptInput: document.getElementById("txReceiptInput"),
  txReceiptUploadBtn: document.getElementById("txReceiptUploadBtn"),
  txReceiptDownloadBtn: document.getElementById("txReceiptDownloadBtn"),
  txEditBtn: document.getElementById("txEditBtn"),
  txSaveBtn: document.getElementById("txSaveBtn"),
  txCancelEditBtn: document.getElementById("txCancelEditBtn"),
  txDeleteBtn: document.getElementById("txDeleteBtn"),
  categoryChartPieBtn: document.getElementById("categoryChartPieBtn"),
  categoryChartBarBtn: document.getElementById("categoryChartBarBtn"),
  toastStack: document.getElementById("toastStack"),
};

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function money(value, currency = "RUB") {
  const numeric = Number(value || 0);
  const locale = window.I18N && window.I18N.getLanguage && window.I18N.getLanguage() === "ru" ? "ru-RU" : "en-US";
  const resolvedCurrency = ["RUB", "USD"].includes(String(currency || "").toUpperCase())
    ? String(currency || "").toUpperCase()
    : "RUB";
  return new Intl.NumberFormat(locale, { style: "currency", currency: resolvedCurrency }).format(numeric);
}

function capitalizeCategoryLabel(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }

  const normalized = CATEGORY_ALIASES[raw.toLowerCase()] || raw.toLowerCase();
  const i18nLabel = t(`category_${normalized}`);
  if (i18nLabel && i18nLabel !== `category_${normalized}`) {
    return i18nLabel;
  }

  const text = raw;
  if (!text) {
    return "";
  }

  return text
    .split(/\s+/)
    .map((chunk) => (chunk ? chunk.charAt(0).toUpperCase() + chunk.slice(1).toLowerCase() : ""))
    .join(" ");
}

function normalizeCategoryValue(value) {
  return CATEGORY_ALIASES[String(value || "").trim().toLowerCase()] || "";
}

function syncCategoryAndSourceByType() {
  const type = el.txType.value;
  const isExpense = type === "expense";

  el.txCategory.disabled = !isExpense;
  el.txCategory.required = isExpense;
  if (!isExpense) {
    el.txCategory.value = "";
  }

  el.txSource.disabled = isExpense;
  el.txSource.required = !isExpense;
  if (isExpense) {
    el.txSource.value = "";
  }

  if (el.txDiscount) {
    el.txDiscount.disabled = !isExpense;
    if (!isExpense) {
      el.txDiscount.checked = false;
    }
  }
}

function notifyInApp(message, options = {}) {
  const text = String(message || "").trim();
  if (!text || !el.toastStack) {
    return;
  }

  const level = ["info", "success", "warning", "danger"].includes(options.level)
    ? options.level
    : "info";
  const dedupeKey = String(options.dedupeKey || "").trim();
  const now = Date.now();

  if (dedupeKey) {
    const lastShown = Number(state.notifications.dedupeMap[dedupeKey] || 0);
    if (now - lastShown < 5000) {
      return;
    }
    state.notifications.dedupeMap[dedupeKey] = now;
  }

  const toast = document.createElement("div");
  toast.className = `in-app-toast is-${level}`;
  toast.setAttribute("role", "status");
  toast.textContent = text;

  el.toastStack.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.add("is-visible");
  });

  const removeToast = () => {
    toast.classList.remove("is-visible");
    window.setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 170);
  };

  toast.addEventListener("click", removeToast);
  window.setTimeout(removeToast, 5200);
}

function resolveNudgeText(warningKey, fallbackText = "") {
  const key = String(warningKey || "").trim();
  if (!key) {
    return String(fallbackText || "").trim();
  }

  const nudgeKey = `nudge_${key}`;
  const translatedNudge = t(nudgeKey);
  if (translatedNudge && translatedNudge !== nudgeKey) {
    return translatedNudge;
  }

  const translatedWarning = t(key);
  if (translatedWarning && translatedWarning !== key) {
    return translatedWarning;
  }

  return String(fallbackText || "").trim();
}

function notifyAchievements(unlockedItems = []) {
  if (!Array.isArray(unlockedItems) || !unlockedItems.length) {
    return;
  }

  unlockedItems.forEach((item) => {
    const title = String(item || "").trim();
    if (!title) {
      return;
    }
    notifyInApp(`${t("notification_achievement_unlocked")}: ${title}`, {
      level: "success",
      dedupeKey: `achievement-${title.toLowerCase()}`,
    });
  });
}

function notifyBudgetWarning(result = {}) {
  const warningStatus = String(result.warning_status || "").trim();
  if (!warningStatus || warningStatus === "success") {
    return;
  }

  const warningKey = String(result.warning_key || "").trim();
  const resolvedText = resolveNudgeText(warningKey, result.warning || "");
  if (!resolvedText) {
    return;
  }

  notifyInApp(resolvedText, {
    level: warningStatus,
    dedupeKey: `warning-${warningStatus}-${warningKey}`,
  });
}

async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(path, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    state.token = "";
    localStorage.removeItem("warkla_token");
    window.location.href = "/login";
    throw new Error(t("session_expired"));
  }

  if (!response.ok) {
    throw new Error(data.error || `${t("request_failed")}: ${response.status}`);
  }
  return data;
}

function syncCanvasSize(canvas, minHeight = 240) {
  const width = Math.max(280, Math.floor(canvas.clientWidth || 280));
  const height = Math.max(minHeight, Math.floor(canvas.clientHeight || minHeight));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

function drawBars(canvas, items) {
  syncCanvasSize(canvas);
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!items.length) {
    ctx.fillStyle = "#7a7f93";
    ctx.font = "600 14px Manrope";
    ctx.fillText(t("no_data_for_chart"), 16, 32);
    return;
  }

  const computed = getComputedStyle(document.documentElement);
  const brand = computed.getPropertyValue("--brand").trim() || "#d85437";
  const text = computed.getPropertyValue("--ink").trim() || "#242834";
  const grid = "rgba(34, 38, 53, 0.08)";

  const max = Math.max(1, ...items.map((item) => Number(item.amount || 0)));
  const topPad = 26;
  const bottomPad = 38;
  const leftPad = 46;
  const rightPad = 10;
  const chartHeight = canvas.height - topPad - bottomPad;
  const chartWidth = canvas.width - leftPad - rightPad;
  const step = chartWidth / Math.max(1, items.length);
  const barWidth = Math.max(16, step - 14);

  ctx.strokeStyle = grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = topPad + (chartHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(leftPad, y);
    ctx.lineTo(canvas.width - rightPad, y);
    ctx.stroke();

    const value = max - (max / 4) * i;
    ctx.fillStyle = text;
    ctx.font = "600 10px Manrope";
    ctx.textAlign = "right";
    ctx.fillText(money(value), leftPad - 6, y + 3);
  }

  items.forEach((item, index) => {
    const value = Number(item.amount || 0);
    const height = Math.max(6, (value / max) * chartHeight);
    const x = leftPad + index * step + (step - barWidth) / 2;
    const y = topPad + chartHeight - height;

    ctx.fillStyle = brand;
    ctx.fillRect(x, y, barWidth, height);

    const categoryLabel = capitalizeCategoryLabel(item.category || "-");
    ctx.fillStyle = text;
    ctx.font = "600 11px Manrope";
    ctx.textAlign = "center";
    ctx.fillText(categoryLabel.slice(0, 10), x + barWidth / 2, canvas.height - 14);

    ctx.font = "700 10px Manrope";
    ctx.fillText(money(value), x + barWidth / 2, y - 5);
  });
}

function drawPie(canvas, items) {
  syncCanvasSize(canvas);
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!items.length) {
    ctx.fillStyle = "#7a7f93";
    ctx.font = "600 14px Manrope";
    ctx.fillText(t("no_data_for_chart"), 16, 32);
    return;
  }

  const total = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  if (!Number.isFinite(total) || total <= 0) {
    ctx.fillStyle = "#7a7f93";
    ctx.font = "600 14px Manrope";
    ctx.fillText(t("no_data_for_chart"), 16, 32);
    return;
  }

  const colors = ["#d85437", "#23957f", "#f18f01", "#5b7cfa", "#a14ad8", "#e35d93", "#53a66f", "#8f5b3f"];
  const legendX = Math.max(16, Math.floor(canvas.width * 0.6));
  const centerX = Math.floor(canvas.width * 0.28);
  const centerY = Math.floor(canvas.height * 0.52);
  const radius = Math.max(40, Math.min(Math.floor(canvas.height * 0.35), Math.floor(canvas.width * 0.2)));

  let startAngle = -Math.PI / 2;
  items.forEach((item, index) => {
    const value = Number(item.amount || 0);
    const angle = (value / total) * Math.PI * 2;
    const color = colors[index % colors.length];

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + angle);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    startAngle += angle;
  });

  ctx.beginPath();
  ctx.fillStyle = "#fff";
  ctx.arc(centerX, centerY, Math.max(15, Math.floor(radius * 0.48)), 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#242834";
  ctx.font = "700 12px Manrope";
  ctx.textAlign = "center";
  ctx.fillText("100%", centerX, centerY + 4);

  ctx.textAlign = "left";
  ctx.font = "600 12px Manrope";
  const maxLegendRows = Math.min(items.length, 7);
  for (let i = 0; i < maxLegendRows; i += 1) {
    const item = items[i];
    const color = colors[i % colors.length];
    const value = Number(item.amount || 0);
    const percent = Math.round((value / total) * 100);
    const y = 24 + i * 26;

    ctx.fillStyle = color;
    ctx.fillRect(legendX, y, 12, 12);

    ctx.fillStyle = "#242834";
    const label = `${capitalizeCategoryLabel(item.category || "-")} ${percent}%`;
    ctx.fillText(label, legendX + 18, y + 10);
  }
}

function renderCategoryChartModeSwitch() {
  if (!el.categoryChartPieBtn || !el.categoryChartBarBtn) {
    return;
  }

  const isPie = state.categoryChartMode === "pie";
  el.categoryChartPieBtn.classList.toggle("is-active", isPie);
  el.categoryChartBarBtn.classList.toggle("is-active", !isPie);
}

function renderCategoryChart() {
  if (state.categoryChartMode === "bar") {
    drawBars(el.categoryChart, state.categories);
  } else {
    drawPie(el.categoryChart, state.categories);
  }
  renderCategoryChartModeSwitch();
}

function drawLine(canvas, items) {
  syncCanvasSize(canvas);
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!items.length) {
    ctx.fillStyle = "#7a7f93";
    ctx.font = "600 14px Manrope";
    ctx.fillText(t("no_data_for_chart"), 16, 32);
    return;
  }

  const computed = getComputedStyle(document.documentElement);
  const mint = computed.getPropertyValue("--mint").trim() || "#2aa286";
  const text = computed.getPropertyValue("--ink").trim() || "#242834";
  const grid = "rgba(34, 38, 53, 0.08)";

  const values = items.map((item) => Number(item.balance || 0));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);

  const topPad = 20;
  const bottomPad = 30;
  const leftPad = 40;
  const rightPad = 12;
  const chartHeight = canvas.height - topPad - bottomPad;
  const chartWidth = canvas.width - leftPad - rightPad;

  ctx.strokeStyle = grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = topPad + (chartHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(leftPad, y);
    ctx.lineTo(canvas.width - rightPad, y);
    ctx.stroke();

    const value = max - (range / 4) * i;
    ctx.fillStyle = text;
    ctx.font = "600 10px Manrope";
    ctx.textAlign = "right";
    ctx.fillText(money(value), leftPad - 6, y + 3);
  }

  ctx.strokeStyle = mint;
  ctx.lineWidth = 3;
  ctx.beginPath();

  items.forEach((item, index) => {
    const x = leftPad + (index / Math.max(1, items.length - 1)) * chartWidth;
    const y = topPad + ((max - Number(item.balance || 0)) / range) * chartHeight;
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();

  ctx.fillStyle = mint;
  items.forEach((item, index) => {
    const x = leftPad + (index / Math.max(1, items.length - 1)) * chartWidth;
    const y = topPad + ((max - Number(item.balance || 0)) / range) * chartHeight;
    ctx.beginPath();
    ctx.arc(x, y, 2.2, 0, Math.PI * 2);
    ctx.fill();
  });
}

function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return t("comparison_no_baseline");
  }

  const numeric = Number(value);
  const sign = numeric > 0 ? "+" : "";
  return `${sign}${numeric.toFixed(1)}%`;
}

function renderTransactions(items, targetElement, limit = null) {
  const normalized = limit ? items.slice(0, limit) : items;
  if (!normalized.length) {
    targetElement.innerHTML = `<p class="sub">${t("no_transactions")}</p>`;
    return;
  }

  targetElement.innerHTML = normalized
    .map((tx) => {
      const sign = tx.type === "expense" ? "-" : "+";
      const title = tx.category ? capitalizeCategoryLabel(tx.category) : tx.source || "item";
      const typeClass = tx.type === "expense" ? "tx-item--expense" : "tx-item--income";
      const iconText = tx.type === "expense" ? "↓" : "↑";
      const typeLabel = tx.type === "expense" ? t("type_expense") : t("type_income");
      const noteLine = tx.note ? `<div class="tx-note">${escapeHtml(tx.note)}</div>` : "";
      const metaLine = [tx.date || "", tx.source ? escapeHtml(tx.source) : ""].filter(Boolean).join(" · ");
      return `
        <button type="button" class="tx-item tx-item--interactive ${typeClass}" data-tx-id="${Number(tx.id || 0)}">
          <div class="tx-main">
            <span class="tx-type-icon ${tx.type}">${iconText}</span>
            <div class="tx-copy">
              <div class="tx-title-row">
                <strong class="tx-title">${escapeHtml(title)}</strong>
                <span class="tx-chip">${escapeHtml(typeLabel)}</span>
              </div>
              <div class="meta">${metaLine || "-"}</div>
              ${noteLine}
            </div>
          </div>
          <strong class="tx-amount">${sign}${money(tx.amount, tx.currency || "RUB")}</strong>
        </button>
      `;
    })
    .join("");
}

function readHistoryControls() {
  state.history.query = el.historySearch ? el.historySearch.value.trim() : "";
  state.history.sort = el.historySort ? el.historySort.value : "newest";
  state.history.type = el.historyType ? el.historyType.value : "all";
  state.history.category = el.historyCategory ? el.historyCategory.value : "all";
  state.history.dateFrom = el.historyDateFrom ? el.historyDateFrom.value : "";
  state.history.dateTo = el.historyDateTo ? el.historyDateTo.value : "";
}

function syncHistoryControlsFromState() {
  if (el.historySearch) {
    el.historySearch.value = state.history.query;
  }
  if (el.historySort) {
    el.historySort.value = state.history.sort;
  }
  if (el.historyType) {
    el.historyType.value = state.history.type;
  }
  if (el.historyCategory) {
    el.historyCategory.value = state.history.category;
  }
  if (el.historyDateFrom) {
    el.historyDateFrom.value = state.history.dateFrom;
  }
  if (el.historyDateTo) {
    el.historyDateTo.value = state.history.dateTo;
  }
}

function setHistoryError(message = "") {
  if (!el.historyError || !el.historyErrorText) {
    return;
  }

  if (!message) {
    el.historyError.hidden = true;
    el.historyErrorText.textContent = "";
    return;
  }

  el.historyError.hidden = false;
  el.historyErrorText.textContent = message;
}

function setHistoryLoading(isLoading) {
  state.history.loading = isLoading;

  const toggleDisabled = (node) => {
    if (node) {
      node.disabled = isLoading;
    }
  };

  toggleDisabled(el.historyApplyBtn);
  toggleDisabled(el.historyResetBtn);
  toggleDisabled(el.historyLoadMoreBtn);
}

function buildHistoryQuery(page = 1) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("per_page", String(state.history.perPage));

  if (state.history.type !== "all") {
    params.set("type", state.history.type);
  }
  if (state.history.category !== "all") {
    params.set("category", state.history.category);
  }
  if (state.history.dateFrom) {
    params.set("date_from", state.history.dateFrom);
  }
  if (state.history.dateTo) {
    params.set("date_to", state.history.dateTo);
  }

  return params.toString();
}

function buildHistoryExportQuery() {
  const params = new URLSearchParams();
  if (state.history.type !== "all") {
    params.set("type", state.history.type);
  }
  if (state.history.category !== "all") {
    params.set("category", state.history.category);
  }
  if (state.history.dateFrom) {
    params.set("date_from", state.history.dateFrom);
  }
  if (state.history.dateTo) {
    params.set("date_to", state.history.dateTo);
  }
  return params.toString();
}

function setHistoryExportLoading(isLoading) {
  if (el.historyExportCsvBtn) {
    el.historyExportCsvBtn.disabled = isLoading;
  }
  if (el.historyExportPdfBtn) {
    el.historyExportPdfBtn.disabled = isLoading;
  }
}

function extractDownloadNameFromDisposition(headerValue, fallbackName) {
  const raw = String(headerValue || "");
  if (!raw) {
    return fallbackName;
  }

  const utf8Match = raw.match(/filename\*=UTF-8''([^;\n]+)/i);
  if (utf8Match && utf8Match[1]) {
    try {
      return decodeURIComponent(utf8Match[1]).replace(/[\\/:*?"<>|]+/g, "_");
    } catch (_) {
      return utf8Match[1].replace(/[\\/:*?"<>|]+/g, "_");
    }
  }

  const simpleMatch = raw.match(/filename="?([^";\n]+)"?/i);
  if (simpleMatch && simpleMatch[1]) {
    return simpleMatch[1].replace(/[\\/:*?"<>|]+/g, "_");
  }

  return fallbackName;
}

function triggerBlobDownload(blob, fileName) {
  const safeName = String(fileName || "export_file").trim() || "export_file";

  if (typeof navigator !== "undefined" && typeof navigator.msSaveOrOpenBlob === "function") {
    navigator.msSaveOrOpenBlob(blob, safeName);
    return;
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = safeName;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);

  try {
    anchor.click();
  } finally {
    // Revoke with a small delay so browsers have time to start the download.
    window.setTimeout(() => {
      URL.revokeObjectURL(url);
      if (anchor.parentNode) {
        anchor.parentNode.removeChild(anchor);
      }
    }, 1500);
  }
}

async function downloadHistoryExport(format) {
  const normalizedFormat = format === "pdf" ? "pdf" : "csv";
  readHistoryControls();
  setHistoryExportLoading(true);

  try {
    const params = new URLSearchParams(buildHistoryExportQuery());
    params.set("format", normalizedFormat);
    params.set("access_token", state.token);
    params.set("_ts", String(Date.now()));
    const targetUrl = new URL("/api/transactions/export/download", window.location.origin);
    targetUrl.search = params.toString();

    const frameId = "exportDownloadFrame";
    let frame = document.getElementById(frameId);
    if (!frame) {
      frame = document.createElement("iframe");
      frame.id = frameId;
      frame.style.display = "none";
      document.body.appendChild(frame);
    }

    frame.src = targetUrl.toString();
  } finally {
    window.setTimeout(() => setHistoryExportLoading(false), 400);
  }
}

function getClientSearchResult(items) {
  const query = state.history.query.trim().toLowerCase();
  if (!query) {
    return [...items];
  }

  return items.filter((tx) => {
    const haystack = [
      tx.note || "",
      tx.category || "",
      tx.source || "",
      tx.date || "",
      String(tx.amount || ""),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
}

function sortHistoryItems(items) {
  const sorted = [...items];
  const byDate = (a, b) => {
    const aDate = new Date(a.date || 0).getTime();
    const bDate = new Date(b.date || 0).getTime();
    if (aDate !== bDate) {
      return bDate - aDate;
    }
    return Number(b.id || 0) - Number(a.id || 0);
  };

  switch (state.history.sort) {
    case "oldest":
      sorted.sort((a, b) => -byDate(a, b));
      break;
    case "amount-desc":
      sorted.sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0));
      break;
    case "amount-asc":
      sorted.sort((a, b) => Number(a.amount || 0) - Number(b.amount || 0));
      break;
    default:
      sorted.sort(byDate);
      break;
  }

  return sorted;
}

function renderHistoryStatus(visibleCount) {
  if (!el.historyStatus) {
    return;
  }

  const loadedCount = state.history.items.length;
  if (state.history.loading) {
    el.historyStatus.textContent = t("history_loading");
    return;
  }

  el.historyStatus.textContent = `${t("history_status_visible")}: ${visibleCount} · ${t("history_status_loaded")}: ${loadedCount} · ${t("history_status_total")}: ${state.history.total}`;
}

function renderHistoryList() {
  const searched = getClientSearchResult(state.history.items);
  const sorted = sortHistoryItems(searched);

  if (!sorted.length) {
    const key = state.history.items.length > 0 ? "history_no_matches" : "no_transactions";
    el.txList.innerHTML = `<p class="sub">${t(key)}</p>`;
  } else {
    renderTransactions(sorted, el.txList);
  }

  renderHistoryStatus(sorted.length);

  if (el.historyLoadMoreBtn) {
    const showLoadMore = state.history.hasMore && !state.history.loading;
    el.historyLoadMoreBtn.hidden = !showLoadMore;
  }
}

function updateHistoryCategoryOptions() {
  if (!el.historyCategory) {
    return;
  }

  const options = new Map();
  options.set("all", t("history_category_all"));

  FIXED_CATEGORIES.forEach((key) => {
    options.set(key, capitalizeCategoryLabel(key));
  });

  const collect = (value) => {
    const normalized = String(value || "").trim();
    if (!normalized) {
      return;
    }
    options.set(normalized, capitalizeCategoryLabel(normalized));
  };

  state.categories.forEach((item) => collect(item.category));
  state.transactions.forEach((item) => collect(item.category));
  state.history.items.forEach((item) => collect(item.category));
  if (state.history.category !== "all") {
    collect(state.history.category);
  }

  el.historyCategory.innerHTML = Array.from(options.entries())
    .map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`)
    .join("");

  el.historyCategory.value = options.has(state.history.category) ? state.history.category : "all";
}

function mergeHistoryItems(current, incoming) {
  const seen = new Set();
  const merged = [];

  [...current, ...incoming].forEach((item) => {
    const key = Number(item.id || 0);
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    merged.push(item);
  });

  return merged;
}

async function loadHistoryPage(page = 1, append = false) {
  readHistoryControls();
  setHistoryError("");
  setHistoryLoading(true);

  if (!append) {
    el.txList.innerHTML = `<p class="sub">${t("history_loading")}</p>`;
    renderHistoryStatus(0);
  }

  try {
    const query = buildHistoryQuery(page);
    const response = await api(`/api/transactions?${query}`);
    const incoming = response.items || [];

    state.history.page = Number(response.page || page);
    state.history.pages = Number(response.pages || 1);
    state.history.total = Number(response.total || incoming.length);
    state.history.hasMore = state.history.page < state.history.pages;
    state.history.items = append ? mergeHistoryItems(state.history.items, incoming) : incoming;

    updateHistoryCategoryOptions();
    renderHistoryList();
  } catch (error) {
    state.history.hasMore = false;
    setHistoryError(error.message || t("request_failed"));
    renderHistoryStatus(getClientSearchResult(state.history.items).length);
  } finally {
    setHistoryLoading(false);
    renderHistoryStatus(getClientSearchResult(state.history.items).length);
    if (el.historyLoadMoreBtn) {
      el.historyLoadMoreBtn.hidden = !(state.history.hasMore && !state.history.loading);
    }
  }
}

function hydrateHistoryFromDashboard(transactionsPayload) {
  const items = transactionsPayload.items || [];
  state.history.page = Number(transactionsPayload.page || 1);
  state.history.pages = Number(transactionsPayload.pages || 1);
  state.history.total = Number(transactionsPayload.total || items.length);
  state.history.hasMore = state.history.page < state.history.pages;
  state.history.items = items;
  syncHistoryControlsFromState();
  updateHistoryCategoryOptions();
  renderHistoryList();
}

function renderAdvancedAnalytics() {
  if (!el.analyticsStats || !el.analyticsInsights) {
    return;
  }

  const stats = state.analyticsStats;
  if (!stats) {
    el.analyticsStats.innerHTML = `<p class="sub">${t("no_data_for_chart")}</p>`;
    el.analyticsInsights.innerHTML = `<p class="sub">${t("no_data_for_chart")}</p>`;
    return;
  }

  const metrics = [
    { label: t("stats_total_income"), value: money(stats.total_income) },
    { label: t("stats_total_expense"), value: money(stats.total_expense) },
    { label: t("stats_daily_avg_expense"), value: money(stats.daily_avg_expense) },
    { label: t("stats_transactions_per_day"), value: String(stats.transactions_per_day) },
  ];

  el.analyticsStats.innerHTML = metrics
    .map(
      (item) => `
        <div class="analytics-metric">
          <span class="analytics-metric-label">${item.label}</span>
          <strong class="analytics-metric-value">${item.value}</strong>
        </div>
      `,
    )
    .join("");

  const topSource = state.analyticsSources.length ? state.analyticsSources[0] : null;
  const cmp = state.analyticsComparison;
  const anomaliesCount = state.analyticsAnomalies.length;

  const insightBlocks = [];
  insightBlocks.push(`
    <div class="analytics-insight">
      <strong>${t("insight_sources")}</strong>
      <div>${t("insight_top_source")}: ${topSource ? `${topSource.source} (${money(topSource.amount)})` : "-"}</div>
    </div>
  `);

  if (cmp && cmp.change) {
    insightBlocks.push(`
      <div class="analytics-insight">
        <strong>${t("insight_comparison")}</strong>
        <div>${t("comparison_income")}: ${formatPercent(cmp.change.income_pct)}</div>
        <div>${t("comparison_expense")}: ${formatPercent(cmp.change.expense_pct)}</div>
        <div>${t("comparison_net")}: ${formatPercent(cmp.change.net_pct)}</div>
      </div>
    `);
  }

  insightBlocks.push(`
    <div class="analytics-insight">
      <strong>${t("insight_anomalies")}</strong>
      <div>${anomaliesCount > 0 ? `${anomaliesCount}` : t("insight_none")}</div>
    </div>
  `);

  el.analyticsInsights.innerHTML = insightBlocks.join("");
}

function localizeAchievement(item) {
  if (window.I18N && window.I18N.getAchievementText) {
    return window.I18N.getAchievementText(item.key, item.title, item.description);
  }
  return { title: item.title, description: item.description };
}

function getAchievementStatus(item) {
  if (item.unlocked) {
    return "unlocked";
  }

  return Number(item.progress_percent || 0) > 0 ? "in-progress" : "locked";
}

function toAchievementDate(dateText) {
  if (!dateText) {
    return null;
  }

  const date = new Date(dateText);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatAchievementDate(dateText) {
  const date = toAchievementDate(dateText);
  if (!date) {
    return "";
  }

  const locale = window.I18N && window.I18N.getLanguage && window.I18N.getLanguage() === "ru" ? "ru-RU" : "en-US";
  const dayMs = 24 * 60 * 60 * 1000;
  const now = new Date();
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dateMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayDiff = Math.floor((nowMidnight - dateMidnight) / dayMs);

  if (dayDiff === 0) {
    return `${date.toLocaleDateString(locale)} · ${t("achievement_today")}`;
  }
  if (dayDiff === 1) {
    return `${date.toLocaleDateString(locale)} · ${t("achievement_yesterday")}`;
  }

  return date.toLocaleDateString(locale);
}

function getAchievementHint(item, status) {
  if (status === "unlocked") {
    return t("achievement_completed_hint");
  }

  const remaining = Math.max(0, Number(item.threshold || 0) - Number(item.progress_value || 0));
  if (remaining <= 1) {
    return t("achievement_one_left");
  }
  if (Number(item.progress_percent || 0) >= 80) {
    return t("achievement_near_goal");
  }

  return t("achievement_keep_going");
}

function achievementCard(item, compact = false) {
  const localized = window.I18N && window.I18N.getAchievementText
    ? window.I18N.getAchievementText(item.key, item.title, item.description)
    : { title: item.title, description: item.description };
  const status = getAchievementStatus(item);
  const stateClass = `state-${status}`;
  const stateLabel =
    status === "unlocked"
      ? t("achievement_unlocked")
      : status === "in-progress"
        ? t("achievement_in_progress")
        : t("achievement_locked");
  const unlockedDate = item.unlocked && item.unlocked_at ? formatAchievementDate(item.unlocked_at) : "";
  const stateMeta = unlockedDate ? `${stateLabel} • ${unlockedDate}` : stateLabel;
  const progressPercent = Math.max(0, Math.min(100, Number(item.progress_percent || 0)));
  const nearCompleteClass = !item.unlocked && progressPercent >= 80 ? "near-complete" : "";
  const description = escapeHtml(localized.description || "");
  const title = escapeHtml(localized.title || item.key);
  const hint = getAchievementHint(item, status);

  const cardLabel = `${localized.title}. ${stateLabel}. ${t("progress")}: ${item.progress_value} / ${item.threshold} (${progressPercent}%)`;

  if (compact) {
    return `
      <div class="badge ${stateClass} ${nearCompleteClass}" tabindex="0" role="listitem" aria-label="${escapeHtml(cardLabel)}">
        <div class="badge-head">
          <span class="achievement-icon ${item.metric}" aria-hidden="true"></span>
          <strong>${title}</strong>
          <span class="badge-percent-pill">${progressPercent}%</span>
        </div>
        <div class="badge-meta">${stateMeta}</div>
      </div>
    `;
  }

  return `
    <div class="badge ${stateClass} ${nearCompleteClass}" tabindex="0" role="listitem" aria-label="${escapeHtml(cardLabel)}">
      <div class="badge-topline">
        <span class="badge-state-pill">${stateLabel}</span>
        <span class="badge-percent-pill">${progressPercent}%</span>
      </div>
      <div class="badge-head">
        <span class="achievement-icon ${item.metric}" aria-hidden="true"></span>
        <strong>${title}</strong>
      </div>
      <div>${description}</div>
      <div class="badge-meta">${stateMeta}</div>
      <div class="achievement-progress">
        <div class="achievement-progress-fill" style="width: ${progressPercent}%"></div>
      </div>
      <div class="badge-progress-text">${t("progress")}: ${item.progress_value} / ${item.threshold} (${progressPercent}%)</div>
      <div class="badge-hint">${hint}</div>
    </div>
  `;
}

function sortAchievements(items, sortMode = "progress") {
  const normalized = [...items];

  if (sortMode === "title") {
    normalized.sort((a, b) => {
      const aTitle = localizeAchievement(a).title || a.key;
      const bTitle = localizeAchievement(b).title || b.key;
      return aTitle.localeCompare(bTitle);
    });
    return normalized;
  }

  if (sortMode === "recent") {
    normalized.sort((a, b) => {
      const aDate = toAchievementDate(a.unlocked_at);
      const bDate = toAchievementDate(b.unlocked_at);
      const aUnlocked = a.unlocked ? 1 : 0;
      const bUnlocked = b.unlocked ? 1 : 0;
      if (aUnlocked !== bUnlocked) {
        return bUnlocked - aUnlocked;
      }
      if (aDate && bDate && aDate.getTime() !== bDate.getTime()) {
        return bDate.getTime() - aDate.getTime();
      }
      return Number(b.progress_percent || 0) - Number(a.progress_percent || 0);
    });
    return normalized;
  }

  normalized.sort((a, b) => {
    if (a.unlocked !== b.unlocked) {
      return Number(b.unlocked) - Number(a.unlocked);
    }
    const progressDiff = Number(b.progress_percent || 0) - Number(a.progress_percent || 0);
    if (progressDiff !== 0) {
      return progressDiff;
    }
    return Number(a.threshold || 0) - Number(b.threshold || 0);
  });
  return normalized;
}

function filterAchievements(items, filterMode = "all", query = "") {
  const normalizedQuery = query.trim().toLowerCase();

  return items.filter((item) => {
    const status = getAchievementStatus(item);
    if (filterMode !== "all" && status !== filterMode) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const localized = localizeAchievement(item);
    const haystack = `${localized.title || ""} ${localized.description || ""}`.toLowerCase();
    return haystack.includes(normalizedQuery);
  });
}

function renderAchievements(items, targetElement, options = {}) {
  const { compact = false, limit = null, filter = "all", sort = "progress", query = "" } = options;
  const filtered = filterAchievements(items, filter, query);
  const sorted = sortAchievements(filtered, sort);
  const normalized = limit ? sorted.slice(0, limit) : sorted;

  if (!normalized.length) {
    const emptyKey = items.length > 0 ? "achievements_no_matches" : "no_achievements";
    targetElement.innerHTML = `<p class="sub">${t(emptyKey)}</p>`;
    return;
  }

  targetElement.innerHTML = normalized.map((item) => achievementCard(item, compact)).join("");
}

function renderAchievementsSummary(items) {
  if (!el.achievementsSummaryStats) {
    return;
  }

  const total = items.length;
  if (!total) {
    el.achievementsSummaryStats.innerHTML = `<p class="sub">${t("no_achievements")}</p>`;
    return;
  }

  const unlockedCount = items.filter((item) => item.unlocked).length;
  const completion = Math.round((unlockedCount / total) * 100);
  const next = sortAchievements(
    items.filter((item) => !item.unlocked),
    "progress",
  )[0];

  let nextText = "-";
  if (next) {
    const localized = localizeAchievement(next);
    const remaining = Math.max(0, Number(next.threshold || 0) - Number(next.progress_value || 0));
    nextText = `${localized.title} · ${remaining}`;
  }

  el.achievementsSummaryStats.innerHTML = `
    <div class="achievement-summary-item">
      <span class="achievement-summary-label">${t("achievements_summary_unlocked")}</span>
      <strong class="achievement-summary-value">${unlockedCount}/${total}</strong>
    </div>
    <div class="achievement-summary-item">
      <span class="achievement-summary-label">${t("achievements_summary_completion")}</span>
      <strong class="achievement-summary-value">${completion}%</strong>
    </div>
    <div class="achievement-summary-item">
      <span class="achievement-summary-label">${t("achievements_summary_next")}</span>
      <strong class="achievement-summary-value">${escapeHtml(nextText)}</strong>
    </div>
  `;
}

function syncAchievementControls() {
  if (el.achievementsFilter) {
    el.achievementsFilter.value = state.achievementsUi.filter;
  }
  if (el.achievementsSort) {
    el.achievementsSort.value = state.achievementsUi.sort;
  }
  if (el.achievementsSearch) {
    el.achievementsSearch.value = state.achievementsUi.query;
  }
}

function renderAchievementsPanel() {
  renderAchievementsSummary(state.achievements);
  renderAchievements(state.achievements, el.achievements, {
    compact: false,
    filter: state.achievementsUi.filter,
    sort: state.achievementsUi.sort,
    query: state.achievementsUi.query,
  });
  renderAchievements(state.achievements, el.summaryAchievements, {
    compact: true,
    limit: 3,
    sort: "progress",
  });
}

function renderTopCategories(items) {
  if (!items.length) {
    el.topCategories.innerHTML = `<p class="sub">${t("no_transactions")}</p>`;
    return;
  }

  const total = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const top = [...items]
    .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))
    .slice(0, 4);

  el.topCategories.innerHTML = top
    .map((item, index) => {
      const amount = Number(item.amount || 0);
      const percent = total > 0 ? Math.round((amount / total) * 100) : 0;
      return `
        <div class="category-rank-item">
          <div class="category-rank-head">
            <span class="category-rank-index">#${index + 1}</span>
            <strong class="category-rank-name">${capitalizeCategoryLabel(item.category || "-")}</strong>
            <strong class="category-rank-amount">${money(amount)}</strong>
          </div>
          <div class="category-rank-meta">
            <span>${t("top_categories_share")}</span>
            <span>${percent}%</span>
          </div>
          <div class="category-rank-track" aria-hidden="true">
            <div class="category-rank-fill" style="width: ${percent}%"></div>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderRiskWidget(dashboard) {
  const warning = resolveWarningText(dashboard);
  const todayLimit = Number(dashboard.today_limit || 0);
  const forecast = Number(dashboard.month_end_forecast || 0);
  const days = Number(dashboard.days_to_stipend || 0);

  if (warning) {
    el.riskText.textContent = warning;
  } else if (forecast < 0) {
    el.riskText.textContent = t("risk_negative_forecast");
  } else {
    el.riskText.textContent = t("risk_good");
  }

  const hints = [];
  if (days > 0) {
    hints.push(`${t("risk_days_left")} ${days}`);
  }
  hints.push(`${t("risk_today_limit")} ${money(todayLimit)}`);
  hints.push(`${t("risk_forecast")} ${money(forecast)}`);

  el.riskHints.innerHTML = hints.map((line) => `<li>${line}</li>`).join("");
}

function renderGoalWidget(dashboard) {
  const balance = Number(dashboard.current_balance || 0);
  const target = Number(state.goalTarget || 0);

  if (target <= 0) {
    el.goalText.textContent = t("goal_not_set");
    el.goalProgressFill.style.width = "0%";
    el.goalInput.value = "";
    return;
  }

  const progress = Math.max(0, Math.min(100, Math.round((balance / target) * 100)));
  const left = Math.max(0, target - balance);
  el.goalProgressFill.style.width = `${progress}%`;
  el.goalText.textContent = `${t("goal_progress")}: ${money(balance)} / ${money(target)} (${progress}%) • ${t("goal_left")} ${money(left)}`;
  el.goalInput.value = String(target);
}

function renderWarningsAndEmptyState(transactions, dashboard) {
  const warningText = resolveWarningText(dashboard);
  const warningStatus = String(dashboard.warning_status || "").trim() || "success";
  const allowedStatuses = new Set(["info", "success", "warning", "danger"]);
  const statusClass = allowedStatuses.has(warningStatus) ? warningStatus : "success";

  el.warningBox.classList.remove("is-info", "is-success", "is-warning", "is-danger");
  el.warningBox.classList.add(`is-${statusClass}`);

  el.warning.textContent = warningText;
  el.warningBox.hidden = !warningText;
  el.emptyState.hidden = transactions.length > 0;
}

function defaultAvatarDataUrl() {
  const svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 72 72' width='72' height='72'><rect width='72' height='72' fill='%23efe5d0'/><rect x='18' y='12' width='36' height='28' fill='%23f4b896'/><rect x='18' y='12' width='36' height='8' fill='%23b85c38'/><rect x='24' y='22' width='4' height='4' fill='%231f1928'/><rect x='44' y='22' width='4' height='4' fill='%231f1928'/><rect x='30' y='31' width='12' height='2' fill='%231f1928'/><rect x='16' y='40' width='40' height='24' fill='%235983d6'/><rect x='8' y='44' width='8' height='16' fill='%23f4b896'/><rect x='56' y='44' width='8' height='16' fill='%23f4b896'/></svg>";
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function renderProfile(profile) {
  el.profileUsername.value = profile.username || "";
  el.profileStipendDay.value = String(profile.stipend_day || 25);
  const avatar = profile.avatar_data_url || defaultAvatarDataUrl();
  el.profileAvatar.src = avatar;
  el.profileAvatarMini.src = avatar;
}

function openProfilePopover() {
  el.profilePopover.hidden = false;
  el.profileToggleBtn.setAttribute("aria-expanded", "true");
}

function closeProfilePopover() {
  el.profilePopover.hidden = true;
  el.profileToggleBtn.setAttribute("aria-expanded", "false");
}

function closeNavMenu() {
  el.mainNav.classList.remove("is-open");
  el.navToggleBtn.setAttribute("aria-expanded", "false");
}

function updateBodyOverlayState() {
  const hasVisibleOverlay =
    (el.addOverlay && !el.addOverlay.hidden) ||
    (el.txDetailsModal && !el.txDetailsModal.hidden);
  document.body.classList.toggle("overlay-open", Boolean(hasVisibleOverlay));
}

function openAddOverlay() {
  if (!el.addOverlay || !el.addOverlayBackdrop) {
    return;
  }

  setTxMessage("");
  el.addOverlay.hidden = false;
  el.addOverlayBackdrop.hidden = false;
  updateBodyOverlayState();
}

function closeAddOverlay() {
  if (!el.addOverlay || !el.addOverlayBackdrop) {
    return;
  }

  el.addOverlay.hidden = true;
  el.addOverlayBackdrop.hidden = true;
  setTransactionFormMode(null);
  updateBodyOverlayState();
}

function resetReceiptPreview() {
  if (state.txDetails.receiptObjectUrl) {
    URL.revokeObjectURL(state.txDetails.receiptObjectUrl);
    state.txDetails.receiptObjectUrl = "";
  }
  if (el.txReceiptPreview) {
    el.txReceiptPreview.src = "";
    el.txReceiptPreview.hidden = true;
  }
  if (el.txReceiptDownloadBtn) {
    el.txReceiptDownloadBtn.hidden = true;
  }
}

function setTxDetailsMessage(message = "") {
  if (!el.txDetailsMsg) {
    return;
  }
  el.txDetailsMsg.textContent = message;
}

function setTxDetailsEditMode(isEditing) {
  state.txDetails.editMode = Boolean(isEditing);

  const disableFields = !state.txDetails.editMode;
  if (el.txDetailsAmountInput) {
    el.txDetailsAmountInput.disabled = disableFields;
  }
  if (el.txDetailsCategorySelect) {
    el.txDetailsCategorySelect.disabled = disableFields;
  }
  if (el.txDetailsSourceInput) {
    el.txDetailsSourceInput.disabled = disableFields;
  }
  if (el.txDetailsDiscount) {
    el.txDetailsDiscount.disabled = disableFields;
  }
  if (el.txDetailsNoteInput) {
    el.txDetailsNoteInput.disabled = disableFields;
  }

  if (el.txEditBtn) {
    el.txEditBtn.hidden = state.txDetails.editMode;
  }
  if (el.txSaveBtn) {
    el.txSaveBtn.hidden = !state.txDetails.editMode;
  }
  if (el.txCancelEditBtn) {
    el.txCancelEditBtn.hidden = !state.txDetails.editMode;
  }

  if (state.txDetails.editMode && state.txDetails.data) {
    const isExpense = state.txDetails.data.type === "expense";
    if (el.txDetailsCategorySelect) {
      el.txDetailsCategorySelect.disabled = !isExpense;
    }
    if (el.txDetailsDiscount) {
      el.txDetailsDiscount.disabled = !isExpense;
      if (!isExpense) {
        el.txDetailsDiscount.checked = false;
      }
    }
  }
}

function populateTxDetailsForm(details) {
  state.txDetails.data = details;
  el.txDetailsType.textContent = details.type === "expense" ? t("type_expense") : t("type_income");
  el.txDetailsCurrency.textContent = details.currency || "RUB";
  el.txDetailsDate.textContent = detailsValue(details.date);

  if (el.txDetailsAmountInput) {
    el.txDetailsAmountInput.value = details.amount != null ? String(details.amount) : "";
  }
  if (el.txDetailsCategorySelect) {
    el.txDetailsCategorySelect.value = normalizeCategoryValue(details.category);
  }
  if (el.txDetailsDiscount) {
    el.txDetailsDiscount.checked = details.type === "expense" && Boolean(details.is_discount);
  }
  if (el.txDetailsSourceInput) {
    el.txDetailsSourceInput.value = details.source || "";
  }
  if (el.txDetailsNoteInput) {
    el.txDetailsNoteInput.value = details.note || "";
  }
}

function detailsValue(value) {
  const text = String(value == null ? "" : value).trim();
  return text || "-";
}

async function fetchReceiptBlob(transactionId) {
  const response = await fetch(`/api/transactions/${transactionId}/receipt`, {
    headers: {
      Authorization: `Bearer ${state.token}`,
    },
  });

  if (!response.ok) {
    throw new Error(t("details_receipt_load_failed"));
  }

  return response.blob();
}

async function renderReceiptPreview(transactionId, hasReceipt) {
  resetReceiptPreview();

  if (!hasReceipt) {
    el.txReceiptHint.textContent = t("details_receipt_missing");
    return;
  }

  try {
    const blob = await fetchReceiptBlob(transactionId);
    state.txDetails.receiptObjectUrl = URL.createObjectURL(blob);
    el.txReceiptPreview.src = state.txDetails.receiptObjectUrl;
    el.txReceiptPreview.hidden = false;
    el.txReceiptDownloadBtn.hidden = false;
    el.txReceiptHint.textContent = t("details_receipt_attached");
  } catch (error) {
    el.txReceiptHint.textContent = error.message || t("details_receipt_load_failed");
  }
}

function openTxDetailsModal() {
  if (!el.txDetailsModal || !el.txDetailsBackdrop) {
    return;
  }
  el.txDetailsModal.hidden = false;
  el.txDetailsBackdrop.hidden = false;
  updateBodyOverlayState();
}

function closeTxDetailsModal() {
  if (!el.txDetailsModal || !el.txDetailsBackdrop) {
    return;
  }

  state.txDetails.transactionId = null;
  state.txDetails.data = null;
  setTxDetailsMessage("");
  resetReceiptPreview();
  if (el.txReceiptInput) {
    el.txReceiptInput.value = "";
  }

  el.txDetailsModal.hidden = true;
  el.txDetailsBackdrop.hidden = true;
  setTxDetailsEditMode(false);
  updateBodyOverlayState();
}

async function openTransactionDetails(transactionId) {
  const resolvedId = Number(transactionId || 0);
  if (!resolvedId) {
    return;
  }

  state.txDetails.transactionId = resolvedId;
  state.txDetails.loading = true;
  openTxDetailsModal();
  setTxDetailsMessage(t("details_loading"));

  try {
    const details = await api(`/api/transactions/${resolvedId}`);
    populateTxDetailsForm(details);
    setTxDetailsEditMode(false);

    await renderReceiptPreview(resolvedId, Boolean(details.receipt_attached));
    setTxDetailsMessage("");
  } catch (error) {
    setTxDetailsMessage(error.message || t("details_load_failed"));
    resetReceiptPreview();
  } finally {
    state.txDetails.loading = false;
  }
}

function getBuiltInTemplates() {
  return [
    {
      id: "coffee",
      name: t("template_coffee"),
      payload: { type: "expense", amount: 4, currency: "RUB", category: "food", source: "", note: "" },
    },
    {
      id: "transport",
      name: t("template_transport"),
      payload: { type: "expense", amount: 8, currency: "RUB", category: "transport", source: "", note: "" },
    },
    {
      id: "stipend",
      name: t("template_stipend"),
      payload: { type: "income", amount: 150, currency: "RUB", category: "", source: t("template_value_stipend"), note: "" },
    },
  ];
}

function loadCustomTemplates() {
  try {
    const raw = localStorage.getItem(CUSTOM_TEMPLATES_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item) => item && item.name && item.payload && item.payload.type);
  } catch (_error) {
    return [];
  }
}

function saveCustomTemplates() {
  localStorage.setItem(CUSTOM_TEMPLATES_STORAGE_KEY, JSON.stringify(state.customTemplates));
}

function setTemplateMessage(message = "") {
  let messageEl = document.getElementById("templateMsg");

  if (!message) {
    if (messageEl) {
      messageEl.remove();
    }
    return;
  }

  if (!messageEl) {
    messageEl = document.createElement("p");
    messageEl.id = "templateMsg";
    messageEl.className = "msg";
    el.templatesPanel.appendChild(messageEl);
  }

  messageEl.textContent = message;
}

function setTxMessage(message = "") {
  let messageEl = document.getElementById("txMsg");

  if (!message) {
    if (messageEl) {
      messageEl.remove();
    }
    return;
  }

  if (!messageEl) {
    messageEl = document.createElement("p");
    messageEl.id = "txMsg";
    messageEl.className = "msg";
    el.txForm.insertAdjacentElement("afterend", messageEl);
  }

  messageEl.textContent = message;
}

function setGoalMessage(message = "") {
  let messageEl = document.getElementById("goalMsg");

  if (!message) {
    if (messageEl) {
      messageEl.remove();
    }
    return;
  }

  if (!messageEl) {
    messageEl = document.createElement("p");
    messageEl.id = "goalMsg";
    messageEl.className = "msg";
    el.goalForm.insertAdjacentElement("afterend", messageEl);
  }

  messageEl.textContent = message;
}

function setTransactionFormMode(editingTransactionId = null) {
  state.editingTransactionId = editingTransactionId ? Number(editingTransactionId) : null;
  const isEditing = Boolean(state.editingTransactionId);

  if (el.addOverlayTitle) {
    el.addOverlayTitle.textContent = isEditing ? t("edit_transaction") : t("add_transaction");
  }

  if (el.txSubmitBtn) {
    el.txSubmitBtn.textContent = isEditing ? t("save_changes") : t("save");
  }
}

function applyTransactionTemplate(payload) {
  if (!payload) {
    return;
  }

  setTransactionFormMode(null);
  el.txType.value = payload.type || "expense";
  el.txAmount.value = payload.amount != null ? String(payload.amount) : "";
  el.txCurrency.value = payload.currency || "RUB";
  el.txCategory.value = normalizeCategoryValue(payload.category);
  if (el.txDiscount) {
    el.txDiscount.checked = Boolean(payload.is_discount);
  }
  el.txSource.value = payload.source || "";
  el.txNote.value = payload.note || "";
  syncCategoryAndSourceByType();
  validateAmountInput();
  openAddOverlay();
  el.txAmount.focus();
}

function renderTemplateLists() {
  const builtIn = getBuiltInTemplates();
  el.builtinTemplates.innerHTML = builtIn
    .map((item) => {
      return `
        <button class="template-chip" type="button" data-template-id="${item.id}" data-template-scope="builtin">
          ${item.name}
        </button>
      `;
    })
    .join("");

  if (!state.customTemplates.length) {
    el.customTemplates.innerHTML = `<p class="sub">${t("templates_empty")}</p>`;
    return;
  }

  el.customTemplates.innerHTML = state.customTemplates
    .map((item) => {
      return `
        <div class="template-custom-item" data-template-id="${item.id}" data-template-scope="custom">
          <button class="template-chip" type="button">${item.name}</button>
          <button class="template-delete" type="button" data-template-delete="${item.id}">${t("delete")}</button>
        </div>
      `;
    })
    .join("");
}

function createCustomTemplate() {
  const name = el.templateNameInput.value.trim();
  if (!name) {
    setTemplateMessage(t("template_name_required"));
    return;
  }

  const amountValue = Number(el.txAmount.value);
  if (!Number.isFinite(amountValue) || amountValue <= 0) {
    setTemplateMessage(t("template_amount_required"));
    return;
  }

  const template = {
    id: String(Date.now()),
    name,
    payload: {
      type: el.txType.value,
      amount: amountValue,
      currency: (el.txCurrency.value || "RUB").toUpperCase(),
      category: normalizeCategoryValue(el.txCategory.value),
      is_discount: el.txType.value === "expense" && Boolean(el.txDiscount && el.txDiscount.checked),
      source: el.txSource.value.trim(),
      note: el.txNote.value.trim(),
    },
  };

  state.customTemplates.unshift(template);
  saveCustomTemplates();
  el.templateNameInput.value = "";
  setTemplateMessage(t("template_saved"));
  renderTemplateLists();
}

function removeCustomTemplate(id) {
  const before = state.customTemplates.length;
  state.customTemplates = state.customTemplates.filter((item) => item.id !== id);
  if (state.customTemplates.length === before) {
    return;
  }

  saveCustomTemplates();
  setTemplateMessage(t("template_deleted"));
  renderTemplateLists();
}

function setView(viewKey) {
  el.viewItems.forEach((item) => {
    item.classList.toggle("is-hidden", item.dataset.viewItem !== viewKey);
  });

  el.viewLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.viewLink === viewKey);
  });

  closeNavMenu();

  if (viewKey === "analytics") {
    renderCategoryChart();
    drawLine(el.timelineChart, state.timeline);
    renderAdvancedAnalytics();
  }
}

async function refreshDashboard() {
  const profile = await api("/api/profile");
  renderProfile(profile);

  const [dashboard, categories, timeline, transactions, achievements, stats, sources, comparison, anomalies] = await Promise.all([
    api("/api/dashboard"),
    api("/api/analytics/categories"),
    api("/api/analytics/timeline"),
    api("/api/transactions?per_page=20"),
    api("/api/achievements"),
    api("/api/analytics/stats"),
    api("/api/analytics/sources"),
    api("/api/analytics/comparison?period=month"),
    api("/api/analytics/anomalies?lookback=90"),
  ]);

  state.dashboard = dashboard;
  state.categories = categories.items || [];
  state.timeline = timeline.items || [];
  state.transactions = transactions.items || [];
  state.achievements = achievements.items || [];
  state.analyticsStats = stats || null;
  state.analyticsSources = sources.items || [];
  state.analyticsComparison = comparison || null;
  state.analyticsAnomalies = anomalies.items || [];

  el.kpiBalance.textContent = money(dashboard.current_balance);
  el.kpiStipend.textContent = String(dashboard.days_to_stipend);
  el.kpiLimit.textContent = money(dashboard.today_limit);
  el.kpiForecast.textContent = money(dashboard.month_end_forecast);

  renderWarningsAndEmptyState(state.transactions, dashboard);
  renderGoalWidget(dashboard);
  renderRiskWidget(dashboard);
  renderTopCategories(state.categories);
  hydrateHistoryFromDashboard(transactions);
  renderTransactions(state.transactions, el.summaryTxList, 5);
  syncAchievementControls();
  renderAchievementsPanel();
  renderAdvancedAnalytics();
  renderCategoryChart();
  drawLine(el.timelineChart, state.timeline);
}

function applyQuickAction(actionKey) {
  const presets = {
    coffee: { type: "expense", amount: 4, currency: "RUB", category: "food", is_discount: false, source: "", note: "" },
    transport: { type: "expense", amount: 8, currency: "RUB", category: "transport", is_discount: false, source: "", note: "" },
    income: { type: "income", amount: 150, currency: "RUB", category: "", is_discount: false, source: t("template_value_stipend"), note: "" },
  };

  const preset = presets[actionKey];
  if (!preset) {
    return;
  }

  applyTransactionTemplate(preset);
}

function validateAmountInput() {
  const value = Number(el.txAmount.value);
  const isValid = Number.isFinite(value) && value > 0;

  if (el.txAmount.value.trim() === "") {
    el.txAmount.classList.remove("invalid");
    return;
  }

  el.txAmount.classList.toggle("invalid", !isValid);
}

function renderFloatingAddLabel() {
  if (!el.floatingAddBtn || !el.floatingAddLabel) {
    return;
  }

  const label = t("fab_add");
  el.floatingAddLabel.textContent = label;
  el.floatingAddLabel.hidden = false;
  el.floatingAddBtn.setAttribute("aria-label", label);
}

el.profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  el.profileMsg.textContent = "";

  const payload = {
    username: el.profileUsername.value.trim(),
    stipend_day: Number(el.profileStipendDay.value),
  };

  try {
    const result = await api("/api/profile", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    renderProfile(result.profile);
    el.profileMsg.textContent = result.message || t("profile_updated");
    await refreshDashboard();
  } catch (error) {
    el.profileMsg.textContent = error.message;
  }
});

el.avatarUploadBtn.addEventListener("click", async () => {
  el.profileMsg.textContent = "";
  const file = el.avatarInput.files && el.avatarInput.files[0];
  if (!file) {
    el.profileMsg.textContent = t("select_image_first");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    const result = await api("/api/profile/avatar", {
      method: "POST",
      body: formData,
    });
    if (result.avatar_data_url) {
      el.profileAvatar.src = result.avatar_data_url;
      el.profileAvatarMini.src = result.avatar_data_url;
    }
    el.profileMsg.textContent = result.message || t("avatar_uploaded");
  } catch (error) {
    el.profileMsg.textContent = error.message;
  }
});

el.txForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setTxMessage("");

  const amountValue = Number(el.txAmount.value);
  if (!Number.isFinite(amountValue) || amountValue <= 0) {
    setTxMessage(t("amount_validation_error"));
    el.txAmount.focus();
    return;
  }

  const txType = el.txType.value;
  const normalizedCategory = normalizeCategoryValue(el.txCategory.value);
  if (txType === "expense" && !normalizedCategory) {
    setTxMessage(t("category_required_for_expense"));
    el.txCategory.focus();
    return;
  }

  const payload = {
    type: txType,
    amount: amountValue,
    currency: (el.txCurrency.value || "RUB").toUpperCase(),
    category: txType === "expense" ? normalizedCategory : null,
    is_discount: txType === "expense" && Boolean(el.txDiscount && el.txDiscount.checked),
    source: el.txSource.value.trim() || null,
    note: el.txNote.value.trim() || null,
    date: el.txDate.value || null,
  };

  try {
    const isEditing = Boolean(state.editingTransactionId);
    const path = isEditing ? `/api/transactions/${state.editingTransactionId}` : "/api/transactions";
    const method = isEditing ? "PATCH" : "POST";

    const result = await api(path, {
      method,
      body: JSON.stringify(payload),
    });

    const receiptFile = el.txReceiptAddInput && el.txReceiptAddInput.files ? el.txReceiptAddInput.files[0] : null;
    if (!isEditing && receiptFile && result.transaction && result.transaction.id) {
      const receiptForm = new FormData();
      receiptForm.append("file", receiptFile);
      await api(`/api/transactions/${result.transaction.id}/receipt`, {
        method: "POST",
        body: receiptForm,
      });
    }

    el.txForm.reset();
    if (el.txReceiptAddInput) {
      el.txReceiptAddInput.value = "";
    }
    syncCategoryAndSourceByType();
    const warningKey = result.warning_key ? String(result.warning_key).trim() : "";
    const defaultMessage = isEditing ? t("details_updated") : t("saved");
    const responseMessage = warningKey ? t(warningKey) : (result.warning || defaultMessage);
    setTxMessage(responseMessage);
    notifyAchievements(result.new_achievements || []);
    notifyBudgetWarning(result);
    validateAmountInput();
    closeAddOverlay();
    await refreshDashboard();
  } catch (error) {
    setTxMessage(error.message);
  }
});

el.goalForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const target = Number(el.goalInput.value);

  if (!Number.isFinite(target) || target <= 0) {
    setGoalMessage(t("goal_error"));
    return;
  }

  state.goalTarget = Math.round(target);
  localStorage.setItem(GOAL_STORAGE_KEY, String(state.goalTarget));
  setGoalMessage(t("goal_saved"));

  if (state.dashboard) {
    renderGoalWidget(state.dashboard);
  }
});

el.txAmount.addEventListener("input", validateAmountInput);

el.txType.addEventListener("change", () => {
  syncCategoryAndSourceByType();
});

window.addEventListener("warkla:langchange", () => {
  renderFloatingAddLabel();
  renderTemplateLists();
  setTransactionFormMode(state.editingTransactionId);
  syncCategoryAndSourceByType();

  if (state.dashboard) {
    renderGoalWidget(state.dashboard);
    renderRiskWidget(state.dashboard);
    renderTopCategories(state.categories);
    updateHistoryCategoryOptions();
    renderHistoryList();
    renderTransactions(state.transactions, el.summaryTxList, 5);
    syncAchievementControls();
    renderAchievementsPanel();
    renderAdvancedAnalytics();
    renderCategoryChart();
    drawLine(el.timelineChart, state.timeline);
  }

  setGoalMessage("");
});

if (el.historySearch) {
  el.historySearch.addEventListener("input", () => {
    state.history.query = el.historySearch.value.trim();
    renderHistoryList();
  });
}

if (el.historySort) {
  el.historySort.addEventListener("change", () => {
    state.history.sort = el.historySort.value;
    renderHistoryList();
  });
}

if (el.historyApplyBtn) {
  el.historyApplyBtn.addEventListener("click", async () => {
    await loadHistoryPage(1, false);
  });
}

if (el.historyResetBtn) {
  el.historyResetBtn.addEventListener("click", async () => {
    state.history.query = "";
    state.history.sort = "newest";
    state.history.type = "all";
    state.history.category = "all";
    state.history.dateFrom = "";
    state.history.dateTo = "";
    syncHistoryControlsFromState();
    await loadHistoryPage(1, false);
  });
}

if (el.historyLoadMoreBtn) {
  el.historyLoadMoreBtn.addEventListener("click", async () => {
    if (!state.history.hasMore || state.history.loading) {
      return;
    }
    await loadHistoryPage(state.history.page + 1, true);
  });
}

if (el.historyExportCsvBtn) {
  el.historyExportCsvBtn.addEventListener("click", async () => {
    try {
      await downloadHistoryExport("csv");
      setTxMessage(t("history_export_ready"));
    } catch (error) {
      setTxMessage(error.message || t("history_export_failed"));
    }
  });
}

if (el.historyExportPdfBtn) {
  el.historyExportPdfBtn.addEventListener("click", async () => {
    try {
      await downloadHistoryExport("pdf");
      setTxMessage(t("history_export_ready"));
    } catch (error) {
      setTxMessage(error.message || t("history_export_failed"));
    }
  });
}

if (el.historyRetryBtn) {
  el.historyRetryBtn.addEventListener("click", async () => {
    await loadHistoryPage(Math.max(1, state.history.page), false);
  });
}

if (el.achievementsFilter) {
  el.achievementsFilter.addEventListener("change", () => {
    state.achievementsUi.filter = el.achievementsFilter.value;
    renderAchievementsPanel();
  });
}

if (el.achievementsSort) {
  el.achievementsSort.addEventListener("change", () => {
    state.achievementsUi.sort = el.achievementsSort.value;
    renderAchievementsPanel();
  });
}

if (el.achievementsSearch) {
  el.achievementsSearch.addEventListener("input", () => {
    state.achievementsUi.query = el.achievementsSearch.value.trim();
    renderAchievementsPanel();
  });
}

if (el.achievementsClearFilters) {
  el.achievementsClearFilters.addEventListener("click", () => {
    state.achievementsUi.filter = "all";
    state.achievementsUi.sort = "progress";
    state.achievementsUi.query = "";
    syncAchievementControls();
    renderAchievementsPanel();
  });
}

el.logoutBtn.addEventListener("click", () => {
  state.token = "";
  localStorage.removeItem("warkla_token");
  window.location.href = "/login";
});

el.viewLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    setView(link.dataset.viewLink);
  });
});

el.navToggleBtn.addEventListener("click", () => {
  const willOpen = !el.mainNav.classList.contains("is-open");
  el.mainNav.classList.toggle("is-open", willOpen);
  el.navToggleBtn.setAttribute("aria-expanded", willOpen ? "true" : "false");
});

el.profileToggleBtn.addEventListener("click", () => {
  if (el.profilePopover.hidden) {
    openProfilePopover();
  } else {
    closeProfilePopover();
  }
});

el.profileCloseBtn.addEventListener("click", () => {
  closeProfilePopover();
});

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  if (!el.profilePopover.hidden && !el.profilePopover.contains(target) && !el.profileToggleBtn.contains(target)) {
    closeProfilePopover();
  }

  if (el.mainNav.classList.contains("is-open") && !el.mainNav.contains(target) && !el.navToggleBtn.contains(target)) {
    closeNavMenu();
  }

  if (!el.addOverlay.hidden && target === el.addOverlayBackdrop) {
    closeAddOverlay();
  }

  if (el.txDetailsModal && el.txDetailsBackdrop && !el.txDetailsModal.hidden && target === el.txDetailsBackdrop) {
    closeTxDetailsModal();
  }

  const txItem = target.closest("[data-tx-id]");
  if (txItem) {
    const txId = Number(txItem.getAttribute("data-tx-id") || 0);
    if (txId > 0) {
      openTransactionDetails(txId);
      return;
    }
  }

  const deleteButton = target.closest("[data-template-delete]");
  if (deleteButton) {
    removeCustomTemplate(deleteButton.dataset.templateDelete);
    return;
  }

  const templateButton = target.closest(".template-chip");
  if (templateButton && templateButton.closest(".template-custom-item")) {
    const templateId = templateButton.closest(".template-custom-item").dataset.templateId;
    const template = state.customTemplates.find((item) => item.id === templateId);
    if (template) {
      applyTransactionTemplate(template.payload);
      setTemplateMessage("");
    }
    return;
  }

  if (templateButton && templateButton.dataset.templateScope === "builtin") {
    const templateId = templateButton.dataset.templateId;
    const template = getBuiltInTemplates().find((item) => item.id === templateId);
    if (template) {
      applyTransactionTemplate(template.payload);
      setTemplateMessage("");
    }
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeProfilePopover();
    closeNavMenu();
    closeAddOverlay();
    closeTxDetailsModal();
  }
});

if (el.txDetailsCloseBtn) {
  el.txDetailsCloseBtn.addEventListener("click", () => {
    closeTxDetailsModal();
  });
}

if (el.txReceiptUploadBtn) {
  el.txReceiptUploadBtn.addEventListener("click", async () => {
    const txId = Number(state.txDetails.transactionId || 0);
    if (!txId) {
      return;
    }

    const file = el.txReceiptInput && el.txReceiptInput.files ? el.txReceiptInput.files[0] : null;
    if (!file) {
      setTxDetailsMessage(t("select_image_first"));
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      await api(`/api/transactions/${txId}/receipt`, {
        method: "POST",
        body: formData,
      });
      setTxDetailsMessage(t("details_receipt_uploaded"));
      await openTransactionDetails(txId);
      await refreshDashboard();
    } catch (error) {
      setTxDetailsMessage(error.message || t("details_receipt_upload_failed"));
    }
  });
}

if (el.txReceiptDownloadBtn) {
  el.txReceiptDownloadBtn.addEventListener("click", async () => {
    const txId = Number(state.txDetails.transactionId || 0);
    if (!txId) {
      return;
    }

    try {
      const blob = await fetchReceiptBlob(txId);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      const extByMime = {
        "image/png": "png",
        "image/webp": "webp",
        "image/jpeg": "jpg",
      };
      const ext = extByMime[(blob.type || "").toLowerCase()] || "jpg";
      anchor.download = `receipt_${txId}.${ext}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setTxDetailsMessage(error.message || t("details_receipt_load_failed"));
    }
  });
}

if (el.txEditBtn) {
  el.txEditBtn.addEventListener("click", () => {
    if (!state.txDetails.data) {
      return;
    }

    setTxDetailsEditMode(true);
    if (el.txDetailsAmountInput) {
      el.txDetailsAmountInput.focus();
    }
  });
}

if (el.txCancelEditBtn) {
  el.txCancelEditBtn.addEventListener("click", () => {
    if (!state.txDetails.data) {
      return;
    }

    populateTxDetailsForm(state.txDetails.data);
    setTxDetailsEditMode(false);
    setTxDetailsMessage("");
  });
}

if (el.txSaveBtn) {
  el.txSaveBtn.addEventListener("click", async () => {
    const txId = Number(state.txDetails.transactionId || 0);
    if (!txId || !state.txDetails.data) {
      return;
    }

    const amountValue = Number(el.txDetailsAmountInput ? el.txDetailsAmountInput.value : 0);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setTxDetailsMessage(t("amount_validation_error"));
      return;
    }

    const isExpense = state.txDetails.data.type === "expense";
    const normalizedCategory = normalizeCategoryValue(el.txDetailsCategorySelect ? el.txDetailsCategorySelect.value : "");
    if (isExpense && !normalizedCategory) {
      setTxDetailsMessage(t("category_required_for_expense"));
      return;
    }

    const payload = {
      amount: amountValue,
      category: isExpense ? normalizedCategory : null,
      is_discount: isExpense && Boolean(el.txDetailsDiscount && el.txDetailsDiscount.checked),
      source: el.txDetailsSourceInput ? el.txDetailsSourceInput.value.trim() || null : null,
      note: el.txDetailsNoteInput ? el.txDetailsNoteInput.value.trim() || null : null,
    };

    try {
      const result = await api(`/api/transactions/${txId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      const updated = result.transaction || (await api(`/api/transactions/${txId}`));
      populateTxDetailsForm(updated);
      setTxDetailsEditMode(false);
      setTxDetailsMessage(t("details_updated"));
      notifyAchievements(result.new_achievements || []);
      notifyBudgetWarning(result);
      await refreshDashboard();
    } catch (error) {
      setTxDetailsMessage(error.message || t("details_load_failed"));
    }
  });
}

if (el.txDeleteBtn) {
  el.txDeleteBtn.addEventListener("click", async () => {
    const txId = Number(state.txDetails.transactionId || 0);
    if (!txId) {
      return;
    }

    if (!window.confirm(t("details_delete_confirm"))) {
      return;
    }

    try {
      await api(`/api/transactions/${txId}`, {
        method: "DELETE",
      });
      closeTxDetailsModal();
      await refreshDashboard();
      setTxMessage(t("details_deleted"));
    } catch (error) {
      setTxDetailsMessage(error.message || t("details_delete_failed"));
    }
  });
}

el.emptyStateAddBtn.addEventListener("click", () => {
  setTransactionFormMode(null);
  syncCategoryAndSourceByType();
  openAddOverlay();
  el.txAmount.focus();
});

el.quickActionBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    applyQuickAction(btn.dataset.quickAction);
  });
});

el.goHistoryBtn.addEventListener("click", () => {
  setView("history");
});

el.goAchievementsBtn.addEventListener("click", () => {
  setView("achievements");
});

if (el.floatingAddBtn) {
  el.floatingAddBtn.addEventListener("click", () => {
    setTransactionFormMode(null);
    syncCategoryAndSourceByType();
    openAddOverlay();
    el.txAmount.focus();
  });
}

if (el.addOverlayCloseBtn) {
  el.addOverlayCloseBtn.addEventListener("click", () => {
    closeAddOverlay();
  });
}

if (el.saveTemplateBtn) {
  el.saveTemplateBtn.addEventListener("click", () => {
    createCustomTemplate();
  });
}

let resizeTimer = null;
window.addEventListener("resize", () => {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    renderCategoryChart();
    drawLine(el.timelineChart, state.timeline);
  }, 120);
});

if (el.categoryChartPieBtn) {
  el.categoryChartPieBtn.addEventListener("click", () => {
    state.categoryChartMode = "pie";
    renderCategoryChart();
  });
}

if (el.categoryChartBarBtn) {
  el.categoryChartBarBtn.addEventListener("click", () => {
    state.categoryChartMode = "bar";
    renderCategoryChart();
  });
}

(async function bootstrap() {
  if (!state.token) {
    window.location.href = "/login";
    return;
  }

  el.logoutBtn.hidden = false;
  state.customTemplates = loadCustomTemplates();
  renderFloatingAddLabel();
  renderTemplateLists();
  setTransactionFormMode(null);
  syncCategoryAndSourceByType();
  closeAddOverlay();
  el.profileAvatarMini.src = defaultAvatarDataUrl();
  syncAchievementControls();
  setView("summary");

  try {
    await refreshDashboard();
  } catch (_error) {
    state.token = "";
    localStorage.removeItem("warkla_token");
    window.location.href = "/login";
  }
})();
