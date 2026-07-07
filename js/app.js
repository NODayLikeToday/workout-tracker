// ============================================
// APP STATE
// ============================================
const state = {
  view: "home",        // home | log | history | progress
  sessions: [],
  currentSession: null,
  currentSets: [],
  loading: false,
  toast: null,
  progressExercise: null,
  progressData: [],
  historyDetail: null,
};

function setState(updates) {
  Object.assign(state, updates);
  render();
}

// ============================================
// TOAST
// ============================================
function showToast(msg, type = "success") {
  setState({ toast: { msg, type } });
  setTimeout(() => setState({ toast: null }), 3000);
}

// ============================================
// RENDER ROUTER
// ============================================
function render() {
  const app = document.getElementById("app");
  
  // Toast
  const toastEl = document.getElementById("toast");
  if (state.toast) {
    toastEl.textContent = state.toast.msg;
    toastEl.className = `toast toast--${state.toast.type} toast--show`;
  } else {
    toastEl.className = "toast";
  }

  // Nav active state
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.toggle("nav-btn--active", btn.dataset.view === state.view);
  });

  // View
  switch (state.view) {
    case "home":    app.innerHTML = renderHome(); break;
    case "log":     app.innerHTML = renderLog(); break;
    case "history": app.innerHTML = renderHistory(); break;
    case "progress":app.innerHTML = renderProgress(); break;
  }

  bindEvents();
}

// ============================================
// HOME VIEW
// ============================================
function renderHome() {
  const today = new Date();
  const dayType = getDayType(today);
  const dayName = getDayName(today);
  const workout = WORKOUT_DATA[dayType];

  const recentSessions = state.sessions.slice(0, 5);

  return `
    <div class="view">
      <div class="home-hero" style="--day-color: ${workout.color}">
        <div class="home-hero__eyebrow">${dayName}</div>
        <div class="home-hero__day">${workout.label}</div>
        <div class="home-hero__sub">${workout.subtitle}</div>
        ${dayType !== "rest" ? `
          <button class="btn btn--primary btn--lg" data-action="start-workout" data-daytype="${dayType}">
            Start Today's Workout
          </button>
        ` : `
          <div class="rest-badge">Rest Day — Recovery Active</div>
          <button class="btn btn--ghost" data-action="start-workout" data-daytype="push">
            Log anyway
          </button>
        `}
      </div>

      ${recentSessions.length > 0 ? `
        <section class="section">
          <h2 class="section-title">Recent Sessions</h2>
          <div class="session-list">
            ${recentSessions.map(s => renderSessionCard(s)).join("")}
          </div>
        </section>
      ` : `
        <div class="empty-state">
          <div class="empty-state__icon">🏋️</div>
          <div class="empty-state__text">No sessions yet. Start your first workout above.</div>
        </div>
      `}
    </div>
  `;
}

function renderSessionCard(session) {
  const workout = WORKOUT_DATA[session.day_type] || WORKOUT_DATA.push;
  const date = new Date(session.session_date + "T12:00:00");
  const dateStr = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const duration = session.duration_minutes
    ? `${session.duration_minutes}m${session.duration_seconds ? ` ${session.duration_seconds}s` : ""}`
    : "";

  return `
    <div class="session-card" data-action="view-session" data-id="${session.id}" style="--day-color: ${workout.color}">
      <div class="session-card__accent"></div>
      <div class="session-card__body">
        <div class="session-card__top">
          <span class="session-card__type">${workout.label}</span>
          <span class="session-card__date">${dateStr}</span>
        </div>
        <div class="session-card__meta">
          ${duration ? `<span>⏱ ${duration}</span>` : ""}
          ${session.walked_today ? `<span>🚶 ${session.miles_walked || "?"} mi</span>` : ""}
        </div>
      </div>
    </div>
  `;
}

// ============================================
// LOG VIEW
// ============================================
function renderLog() {
  const session = state.currentSession;
  if (!session) return `<div class="view"><p>No active session.</p></div>`;

  const workout = WORKOUT_DATA[session.day_type];
  const setsByExercise = groupBy(state.currentSets, "exercise_name");

  return `
    <div class="view">
      <div class="log-header" style="--day-color: ${workout.color}">
        <div class="log-header__info">
          <div class="log-header__type">${workout.label} Day</div>
          <div class="log-header__sub">${workout.subtitle}</div>
        </div>
        <button class="btn btn--finish" data-action="finish-session">Finish</button>
      </div>

      <!-- Session meta -->
      <div class="session-meta-form card">
        <div class="form-row">
          <label class="form-label">Duration</label>
          <div class="duration-inputs">
            <input type="number" class="input input--sm" id="dur-min" placeholder="Min"
              value="${session.duration_minutes || ""}" min="0" max="180" data-action="update-duration">
            <span class="duration-sep">:</span>
            <input type="number" class="input input--sm" id="dur-sec" placeholder="Sec"
              value="${session.duration_seconds || ""}" min="0" max="59" data-action="update-duration">
          </div>
        </div>
        <div class="form-row">
          <label class="form-label checkbox-label">
            <input type="checkbox" id="walked-cb" ${session.walked_today ? "checked" : ""} data-action="toggle-walked">
            <span>Walked today</span>
          </label>
          ${session.walked_today ? `
            <input type="number" class="input input--sm" id="miles-input" placeholder="Miles"
              value="${session.miles_walked || ""}" step="0.1" min="0" data-action="update-miles">
          ` : ""}
        </div>
        <div class="form-row">
          <label class="form-label">Session notes</label>
          <textarea class="input textarea" id="session-notes" placeholder="How did it feel overall?"
            data-action="update-session-notes">${session.notes || ""}</textarea>
        </div>
      </div>

      <!-- Exercises -->
      <section class="section">
        <h2 class="section-title">Exercises</h2>
        
        <!-- Add exercise -->
        <div class="add-exercise card">
          <select class="input" id="exercise-select">
            <option value="">— Pick an exercise —</option>
            ${workout.exercises.map(ex => `<option value="${ex}">${ex}</option>`).join("")}
            <option value="__custom">+ Custom exercise</option>
          </select>
          <input type="text" class="input hidden" id="custom-exercise" placeholder="Exercise name">
          <button class="btn btn--secondary" data-action="add-exercise-set">Add Set</button>
        </div>

        <!-- Sets by exercise -->
        ${Object.entries(setsByExercise).map(([exName, sets]) => `
          <div class="exercise-group">
            <div class="exercise-group__header">
              <span class="exercise-group__name">${exName}</span>
              <span class="exercise-group__count">${sets.length} set${sets.length !== 1 ? "s" : ""}</span>
            </div>
            ${sets.map((set, i) => renderSetRow(set, i)).join("")}
            <button class="btn btn--ghost btn--sm add-set-btn" 
              data-action="add-set-to-exercise" data-exercise="${exName}">
              + Add set
            </button>
          </div>
        `).join("")}

        ${Object.keys(setsByExercise).length === 0 ? `
          <div class="empty-state empty-state--sm">
            <div class="empty-state__text">Pick an exercise above to start logging sets.</div>
          </div>
        ` : ""}
      </section>
    </div>
  `;
}

function renderSetRow(set, index) {
  return `
    <div class="set-row" data-set-id="${set.id}">
      <div class="set-row__num">${index + 1}</div>
      <div class="set-row__fields">
        <div class="set-row__inputs">
          <div class="input-group">
            <input type="number" class="input input--sm" placeholder="Reps"
              value="${set.reps || ""}" min="1"
              data-action="update-set" data-field="reps" data-id="${set.id}">
            <label class="input-label">reps</label>
          </div>
          <div class="input-group">
            <input type="number" class="input input--sm" placeholder="lbs"
              value="${set.weight_lbs || ""}" min="0" step="2.5"
              data-action="update-set" data-field="weight_lbs" data-id="${set.id}">
            <label class="input-label">lbs</label>
          </div>
        </div>
        <div class="effort-select">
          ${EFFORT_LEVELS.map(e => `
            <button class="effort-btn ${set.effort_level === e.value ? "effort-btn--active" : ""}"
              data-action="set-effort" data-id="${set.id}" data-effort="${e.value}"
              title="${e.label}">
              ${e.icon}
            </button>
          `).join("")}
        </div>
        <input type="text" class="input input--sm input--full" placeholder="Notes (optional)"
          value="${set.notes || ""}"
          data-action="update-set" data-field="notes" data-id="${set.id}">
      </div>
      <button class="btn-delete" data-action="delete-set" data-id="${set.id}" title="Remove set">×</button>
    </div>
  `;
}

// ============================================
// HISTORY VIEW
// ============================================
function renderHistory() {
  if (state.historyDetail) {
    return renderHistoryDetail(state.historyDetail);
  }

  return `
    <div class="view">
      <h1 class="page-title">History</h1>
      ${state.sessions.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state__icon">📋</div>
          <div class="empty-state__text">No sessions logged yet.</div>
        </div>
      ` : `
        <div class="session-list">
          ${state.sessions.map(s => `
            <div class="session-card session-card--detail" 
              data-action="view-history-detail" data-id="${s.id}"
              style="--day-color: ${(WORKOUT_DATA[s.day_type] || WORKOUT_DATA.push).color}">
              <div class="session-card__accent"></div>
              <div class="session-card__body">
                <div class="session-card__top">
                  <span class="session-card__type">${(WORKOUT_DATA[s.day_type] || WORKOUT_DATA.push).label}</span>
                  <span class="session-card__date">${formatDate(s.session_date)}</span>
                </div>
                <div class="session-card__meta">
                  ${s.duration_minutes ? `<span>⏱ ${s.duration_minutes}m${s.duration_seconds ? ` ${s.duration_seconds}s` : ""}</span>` : ""}
                  ${s.walked_today ? `<span>🚶 ${s.miles_walked || "?"} mi</span>` : ""}
                </div>
                ${s.notes ? `<div class="session-card__notes">${s.notes}</div>` : ""}
              </div>
            </div>
          `).join("")}
        </div>
      `}
    </div>
  `;
}

function renderHistoryDetail(detail) {
  const { session, sets } = detail;
  const workout = WORKOUT_DATA[session.day_type] || WORKOUT_DATA.push;
  const setsByExercise = groupBy(sets, "exercise_name");

  return `
    <div class="view">
      <div class="detail-header">
        <button class="btn btn--ghost btn--sm" data-action="back-history">← Back</button>
        <button class="btn btn--danger btn--sm" data-action="delete-session" data-id="${session.id}">Delete</button>
      </div>

      <div class="log-header" style="--day-color: ${workout.color}">
        <div class="log-header__info">
          <div class="log-header__type">${workout.label} Day</div>
          <div class="log-header__sub">${formatDate(session.session_date)}</div>
        </div>
      </div>

      <div class="stats-row">
        ${session.duration_minutes ? `
          <div class="stat-pill">⏱ ${session.duration_minutes}m${session.duration_seconds ? ` ${session.duration_seconds}s` : ""}</div>
        ` : ""}
        ${session.walked_today ? `
          <div class="stat-pill">🚶 ${session.miles_walked || "?"} mi walked</div>
        ` : ""}
        <div class="stat-pill">💪 ${sets.length} sets total</div>
      </div>

      ${session.notes ? `<div class="card session-notes-display">${session.notes}</div>` : ""}

      ${Object.entries(setsByExercise).map(([exName, exSets]) => `
        <div class="exercise-group">
          <div class="exercise-group__header">
            <span class="exercise-group__name">${exName}</span>
          </div>
          <div class="sets-table">
            <div class="sets-table__header">
              <span>Set</span><span>Reps</span><span>Weight</span><span>Effort</span>
            </div>
            ${exSets.map((set, i) => `
              <div class="sets-table__row">
                <span>${i + 1}</span>
                <span>${set.reps || "—"}</span>
                <span>${set.weight_lbs ? `${set.weight_lbs} lbs` : "—"}</span>
                <span>${set.effort_level ? EFFORT_LEVELS.find(e => e.value === set.effort_level)?.icon || "—" : "—"}</span>
              </div>
              ${set.notes ? `<div class="set-note">${set.notes}</div>` : ""}
            `).join("")}
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

// ============================================
// PROGRESS VIEW
// ============================================
function renderProgress() {
  const allExercises = [
    ...new Set([
      ...Object.values(WORKOUT_DATA).flatMap(w => w.exercises),
    ])
  ].filter(Boolean).sort();

  return `
    <div class="view">
      <h1 class="page-title">Progress</h1>

      <div class="card">
        <label class="form-label">Track an exercise</label>
        <select class="input" id="progress-exercise-select" data-action="select-progress-exercise">
          <option value="">— Choose exercise —</option>
          ${allExercises.map(ex => `
            <option value="${ex}" ${state.progressExercise === ex ? "selected" : ""}>${ex}</option>
          `).join("")}
        </select>
      </div>

      ${state.progressExercise && state.progressData.length > 0 ? `
        <div class="chart-container card">
          <div class="chart-title">${state.progressExercise} — Max Weight Over Time</div>
          ${renderChart(state.progressData)}
        </div>
        <div class="progress-stats">
          ${renderProgressStats(state.progressData)}
        </div>
      ` : state.progressExercise ? `
        <div class="empty-state">
          <div class="empty-state__text">No data logged for ${state.progressExercise} yet.</div>
        </div>
      ` : ""}
    </div>
  `;
}

function renderChart(data) {
  if (data.length < 2) {
    return `<div class="chart-single">Only one data point so far — keep logging!</div>`;
  }

  const W = 340, H = 200, PAD = { top: 20, right: 20, bottom: 40, left: 45 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const weights = data.map(d => d.max_weight);
  const minW = Math.min(...weights) * 0.9;
  const maxW = Math.max(...weights) * 1.05;

  const xScale = i => PAD.left + (i / (data.length - 1)) * innerW;
  const yScale = w => PAD.top + innerH - ((w - minW) / (maxW - minW)) * innerH;

  const points = data.map((d, i) => `${xScale(i)},${yScale(d.max_weight)}`).join(" ");
  const areaPoints = `${PAD.left},${PAD.top + innerH} ${points} ${xScale(data.length - 1)},${PAD.top + innerH}`;

  // Y axis labels
  const yTicks = 4;
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => {
    const val = minW + (i / yTicks) * (maxW - minW);
    const y = yScale(val);
    return `<text x="${PAD.left - 6}" y="${y + 4}" text-anchor="end" class="chart-tick">${Math.round(val)}</text>
            <line x1="${PAD.left}" y1="${y}" x2="${PAD.left + innerW}" y2="${y}" class="chart-grid"/>`;
  });

  // X axis labels (show up to 5)
  const step = Math.max(1, Math.floor((data.length - 1) / 4));
  const xLabels = data.filter((_, i) => i % step === 0 || i === data.length - 1).map((d, idx) => {
    const realIdx = data.indexOf(d);
    const date = new Date(d.date + "T12:00:00");
    const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `<text x="${xScale(realIdx)}" y="${H - 8}" text-anchor="middle" class="chart-tick">${label}</text>`;
  });

  // Data dots
  const dots = data.map((d, i) => `
    <circle cx="${xScale(i)}" cy="${yScale(d.max_weight)}" r="4" class="chart-dot"/>
  `);

  return `
    <svg viewBox="0 0 ${W} ${H}" class="chart-svg">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/>
        </linearGradient>
      </defs>
      ${yLabels.join("")}
      <polygon points="${areaPoints}" fill="url(#areaGrad)"/>
      <polyline points="${points}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round"/>
      ${dots.join("")}
      ${xLabels.join("")}
    </svg>
  `;
}

function renderProgressStats(data) {
  if (data.length === 0) return "";
  const first = data[0].max_weight;
  const last = data[data.length - 1].max_weight;
  const max = Math.max(...data.map(d => d.max_weight));
  const diff = last - first;
  const sign = diff >= 0 ? "+" : "";

  return `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-card__val">${first} lbs</div>
        <div class="stat-card__label">Starting</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__val">${last} lbs</div>
        <div class="stat-card__label">Current</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__val">${max} lbs</div>
        <div class="stat-card__label">Best</div>
      </div>
      <div class="stat-card stat-card--accent">
        <div class="stat-card__val">${sign}${diff} lbs</div>
        <div class="stat-card__label">Total gain</div>
      </div>
    </div>
  `;
}

// ============================================
// EVENTS
// ============================================
let debounceTimers = {};

function bindEvents() {
  document.querySelectorAll("[data-action]").forEach(el => {
    // Avoid double-binding
    if (el._bound) return;
    el._bound = true;

    const action = el.dataset.action;

    if (action === "update-set" || action === "update-duration" || 
        action === "update-miles" || action === "update-session-notes") {
      el.addEventListener("input", handleAction);
      el.addEventListener("change", handleAction);
    } else if (action === "select-progress-exercise") {
      el.addEventListener("change", handleAction);
    } else {
      el.addEventListener("click", handleAction);
      el.addEventListener("change", handleAction);
    }
  });

  // Special: custom exercise toggle
  const exSelect = document.getElementById("exercise-select");
  if (exSelect) {
    exSelect.addEventListener("change", () => {
      const custom = document.getElementById("custom-exercise");
      if (custom) {
        custom.classList.toggle("hidden", exSelect.value !== "__custom");
      }
    });
  }
}

async function handleAction(e) {
  const el = e.currentTarget;
  const action = el.dataset.action;

  switch (action) {
    case "start-workout":
      await startWorkout(el.dataset.daytype);
      break;

    case "finish-session":
      setState({ view: "home" });
      showToast("Workout saved!");
      loadSessions();
      break;

    case "add-exercise-set": {
      const select = document.getElementById("exercise-select");
      const custom = document.getElementById("custom-exercise");
      let name = select?.value;
      if (name === "__custom") name = custom?.value?.trim();
      if (!name) { showToast("Pick an exercise first", "error"); return; }
      await addSet(name);
      break;
    }

    case "add-set-to-exercise":
      await addSet(el.dataset.exercise);
      break;

    case "update-set": {
      const { id, field } = el.dataset;
      let val = el.value;
      if (field === "reps" || field === "weight_lbs") val = val ? parseFloat(val) : null;
      debounce(`set-${id}-${field}`, () => DB.updateSet(id, { [field]: val }), 800);
      break;
    }

    case "set-effort": {
      const { id, effort } = el.dataset;
      await DB.updateSet(id, { effort_level: effort });
      const sets = await DB.getSessionSets(state.currentSession.id);
      setState({ currentSets: sets });
      break;
    }

    case "delete-set": {
      await DB.deleteSet(el.dataset.id);
      const sets = await DB.getSessionSets(state.currentSession.id);
      setState({ currentSets: sets });
      break;
    }

    case "toggle-walked": {
      const checked = el.checked;
      await DB.updateSession(state.currentSession.id, { walked_today: checked, miles_walked: checked ? state.currentSession.miles_walked : null });
      setState({ currentSession: { ...state.currentSession, walked_today: checked } });
      break;
    }

    case "update-miles": {
      const miles = parseFloat(el.value) || null;
      debounce("miles", () => DB.updateSession(state.currentSession.id, { miles_walked: miles }), 800);
      setState({ currentSession: { ...state.currentSession, miles_walked: miles } });
      break;
    }

    case "update-duration": {
      const mins = parseInt(document.getElementById("dur-min")?.value) || 0;
      const secs = parseInt(document.getElementById("dur-sec")?.value) || 0;
      debounce("duration", () => DB.updateSession(state.currentSession.id, { duration_minutes: mins, duration_seconds: secs }), 800);
      break;
    }

    case "update-session-notes": {
      const notes = el.value;
      debounce("session-notes", () => DB.updateSession(state.currentSession.id, { notes }), 1000);
      break;
    }

    case "view-session":
      setState({ view: "log" });
      break;

    case "view-history-detail": {
      const detail = await DB.getSessionWithSets(el.dataset.id);
      setState({ historyDetail: detail });
      break;
    }

    case "back-history":
      setState({ historyDetail: null });
      break;

    case "delete-session": {
      if (!confirm("Delete this session and all its sets?")) return;
      await DB.deleteSession(el.dataset.id);
      await loadSessions();
      setState({ historyDetail: null });
      showToast("Session deleted");
      break;
    }

    case "select-progress-exercise": {
      const ex = el.value;
      if (!ex) { setState({ progressExercise: null, progressData: [] }); return; }
      const rawSets = await DB.getExerciseHistory(ex);
      // Group by date, take max weight per day
      const byDate = {};
      rawSets.forEach(s => {
        const date = s.created_at?.split("T")[0];
        if (!date) return;
        if (!byDate[date] || (s.weight_lbs && s.weight_lbs > byDate[date].max_weight)) {
          byDate[date] = { date, max_weight: s.weight_lbs || 0 };
        }
      });
      const progressData = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
      setState({ progressExercise: ex, progressData });
      break;
    }
  }
}

// ============================================
// WORKOUT ACTIONS
// ============================================
async function startWorkout(dayType) {
  const session = await DB.createSession({
    day_type: dayType,
    session_date: new Date().toISOString().split("T")[0],
    walked_today: false,
  });
  setState({ currentSession: session, currentSets: [], view: "log" });
}

async function addSet(exerciseName) {
  const existingSets = state.currentSets.filter(s => s.exercise_name === exerciseName);
  const setNumber = existingSets.length + 1;

  // Suggest last weight for this exercise
  const lastSet = [...existingSets].reverse().find(s => s.weight_lbs);
  const defaultWeight = lastSet?.weight_lbs || DEFAULT_WEIGHTS[exerciseName] || null;

  const newSet = await DB.addSet({
    session_id: state.currentSession.id,
    exercise_name: exerciseName,
    set_number: setNumber,
    weight_lbs: defaultWeight,
  });

  setState({ currentSets: [...state.currentSets, newSet] });
}

// ============================================
// UTILS
// ============================================
function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const k = item[key];
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});
}

function formatDate(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function debounce(key, fn, delay) {
  clearTimeout(debounceTimers[key]);
  debounceTimers[key] = setTimeout(fn, delay);
}

async function loadSessions() {
  const sessions = await DB.getSessions(50);
  setState({ sessions });
}

// ============================================
// NAV
// ============================================
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const view = btn.dataset.view;
    if (view === "history") setState({ historyDetail: null });
    setState({ view });
  });
});

// ============================================
// BOOT
// ============================================
(async () => {
  await loadSessions();
  render();
})();
