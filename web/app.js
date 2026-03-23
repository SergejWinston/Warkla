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
};

const t = window.I18N ? window.I18N.t : (key) => key;

const el = {
  logoutBtn: document.getElementById("logoutBtn"),
  floatingAddBtn: document.getElementById("floatingAddBtn"),
  floatingAddLabel: document.querySelector("#floatingAddBtn [data-fab-label]"),
  addOverlay: document.getElementById("addOverlay"),
  addOverlayBackdrop: document.getElementById("addOverlayBackdrop"),
  addOverlayCloseBtn: document.getElementById("addOverlayCloseBtn"),
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
  txAmountHint: document.getElementById("txAmountHint"),
  txCategory: document.getElementById("txCategory"),
  txSource: document.getElementById("txSource"),
  txDate: document.getElementById("txDate"),
  txNote: document.getElementById("txNote"),
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
};

function money(value) {
  const numeric = Number(value || 0);
  const locale = window.I18N && window.I18N.getLanguage && window.I18N.getLanguage() === "ru" ? "ru-RU" : "en-US";
  return new Intl.NumberFormat(locale, { style: "currency", currency: "USD" }).format(numeric);
}

function capitalizeCategoryLabel(value) {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }

  return text
    .split(/\s+/)
    .map((chunk) => (chunk ? chunk.charAt(0).toUpperCase() + chunk.slice(1).toLowerCase() : ""))
    .join(" ");
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
      const iconText = tx.type === "expense" ? "OUT" : "IN";
      return `
        <div class="tx-item ${typeClass}">
          <span class="tx-type-icon ${tx.type}">${iconText}</span>
          <div>
            <strong>${title}</strong>
            <div class="meta">${tx.date || ""} ${tx.note ? "- " + tx.note : ""}</div>
          </div>
          <strong>${sign}${money(tx.amount)}</strong>
        </div>
      `;
    })
    .join("");
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

function achievementCard(item, compact = false) {
  const localized = window.I18N && window.I18N.getAchievementText
    ? window.I18N.getAchievementText(item.key, item.title, item.description)
    : { title: item.title, description: item.description };
  const stateClass = item.unlocked ? "unlocked" : "locked";
  const stateLabel = item.unlocked ? t("achievement_unlocked") : t("achievement_locked");
  const unlockedDate = item.unlocked && item.unlocked_at ? new Date(item.unlocked_at).toLocaleDateString() : "";
  const stateMeta = unlockedDate ? `${stateLabel} • ${unlockedDate}` : stateLabel;

  if (compact) {
    return `
      <div class="badge ${stateClass}">
        <div class="badge-head">
          <span class="achievement-icon ${item.metric}"></span>
          <strong>${localized.title}</strong>
        </div>
        <div class="badge-meta">${stateMeta}</div>
      </div>
    `;
  }

  return `
    <div class="badge ${stateClass}">
      <div class="badge-head">
        <span class="achievement-icon ${item.metric}"></span>
        <strong>${localized.title}</strong>
      </div>
      <div>${localized.description}</div>
      <div class="badge-meta">${stateMeta}</div>
      <div class="achievement-progress">
        <div class="achievement-progress-fill" style="width: ${item.progress_percent}%"></div>
      </div>
      <div class="badge-progress-text">${t("progress")}: ${item.progress_value} / ${item.threshold} (${item.progress_percent}%)</div>
    </div>
  `;
}

function renderAchievements(items, targetElement, compact = false, limit = null) {
  const normalized = limit ? items.slice(0, limit) : items;
  if (!normalized.length) {
    targetElement.innerHTML = `<p class="sub">${t("no_achievements")}</p>`;
    return;
  }

  targetElement.innerHTML = normalized.map((item) => achievementCard(item, compact)).join("");
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
  const warningKey = String(dashboard.warning_key || "").trim();
  const warning = warningKey ? t(warningKey) : String(dashboard.warning || "").trim();
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
  const warningKey = String(dashboard.warning_key || "").trim();
  const warningText = warningKey ? t(warningKey) : String(dashboard.warning || "").trim();
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

function openAddOverlay() {
  if (!el.addOverlay || !el.addOverlayBackdrop) {
    return;
  }

  setTxMessage("");
  el.addOverlay.hidden = false;
  el.addOverlayBackdrop.hidden = false;
  document.body.classList.add("overlay-open");
}

function closeAddOverlay() {
  if (!el.addOverlay || !el.addOverlayBackdrop) {
    return;
  }

  el.addOverlay.hidden = true;
  el.addOverlayBackdrop.hidden = true;
  document.body.classList.remove("overlay-open");
}

function getBuiltInTemplates() {
  return [
    {
      id: "coffee",
      name: t("template_coffee"),
      payload: { type: "expense", amount: 4, category: t("template_value_coffee"), source: "", note: "" },
    },
    {
      id: "transport",
      name: t("template_transport"),
      payload: { type: "expense", amount: 8, category: t("template_value_transport"), source: "", note: "" },
    },
    {
      id: "stipend",
      name: t("template_stipend"),
      payload: { type: "income", amount: 150, category: "", source: t("template_value_stipend"), note: "" },
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

function applyTransactionTemplate(payload) {
  if (!payload) {
    return;
  }

  el.txType.value = payload.type || "expense";
  el.txAmount.value = payload.amount != null ? String(payload.amount) : "";
  el.txCategory.value = payload.category || "";
  el.txSource.value = payload.source || "";
  el.txNote.value = payload.note || "";
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
      category: el.txCategory.value.trim(),
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
    drawBars(el.categoryChart, state.categories);
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
  renderTransactions(state.transactions, el.txList);
  renderTransactions(state.transactions, el.summaryTxList, 5);
  renderAchievements(state.achievements, el.achievements);
  renderAchievements(state.achievements, el.summaryAchievements, true, 3);
  renderAdvancedAnalytics();
  drawBars(el.categoryChart, state.categories);
  drawLine(el.timelineChart, state.timeline);
}

function applyQuickAction(actionKey) {
  const presets = {
    coffee: { type: "expense", amount: 4, category: t("template_value_coffee"), source: "", note: "" },
    transport: { type: "expense", amount: 8, category: t("template_value_transport"), source: "", note: "" },
    income: { type: "income", amount: 150, category: "", source: t("template_value_stipend"), note: "" },
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

  const payload = {
    type: el.txType.value,
    amount: amountValue,
    category: capitalizeCategoryLabel(el.txCategory.value) || null,
    source: el.txSource.value.trim() || null,
    note: el.txNote.value.trim() || null,
    date: el.txDate.value || null,
  };

  try {
    const result = await api("/api/transactions", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    el.txForm.reset();
    const warningKey = result.warning_key ? String(result.warning_key).trim() : "";
    const responseMessage = warningKey ? t(warningKey) : (result.warning || t("saved"));
    setTxMessage(responseMessage);
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

window.addEventListener("warkla:langchange", () => {
  renderFloatingAddLabel();
  renderTemplateLists();

  if (state.dashboard) {
    renderGoalWidget(state.dashboard);
    renderRiskWidget(state.dashboard);
    renderTopCategories(state.categories);
    renderTransactions(state.transactions, el.txList);
    renderTransactions(state.transactions, el.summaryTxList, 5);
    renderAchievements(state.achievements, el.achievements);
    renderAchievements(state.achievements, el.summaryAchievements, true, 3);
    renderAdvancedAnalytics();
    drawBars(el.categoryChart, state.categories);
    drawLine(el.timelineChart, state.timeline);
  }

  setGoalMessage("");
});

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
  }
});

el.emptyStateAddBtn.addEventListener("click", () => {
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
    drawBars(el.categoryChart, state.categories);
    drawLine(el.timelineChart, state.timeline);
  }, 120);
});

(async function bootstrap() {
  if (!state.token) {
    window.location.href = "/login";
    return;
  }

  el.logoutBtn.hidden = false;
  state.customTemplates = loadCustomTemplates();
  renderFloatingAddLabel();
  renderTemplateLists();
  closeAddOverlay();
  el.profileAvatarMini.src = defaultAvatarDataUrl();
  setView("summary");

  try {
    await refreshDashboard();
  } catch (_error) {
    state.token = "";
    localStorage.removeItem("warkla_token");
    window.location.href = "/login";
  }
})();
