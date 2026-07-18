// Flight Core Operational Memory Challenge Logic

// Global System Error Boundary Handlers
window.addEventListener("error", (e) => {
  handleGlobalError(e.error || new Error(e.message));
});

window.addEventListener("unhandledrejection", (e) => {
  handleGlobalError(e.reason || new Error("Unhandled Promise rejection"));
});

function handleGlobalError(err) {
  console.error("Global Fault Intercepted:", err);
  const overlay = document.getElementById("error-boundary-overlay");
  const logEl = document.getElementById("error-boundary-log");
  if (overlay && logEl) {
    logEl.textContent = `${err ? err.name : "Error"}: ${err ? err.message : "Unknown error"}\n\nStack:\n${err ? err.stack : "Not available"}`;
    overlay.style.display = "flex";
  }
}

// HTML Escaping Helper to Prevent XSS
function escapeHTML(str) {
  if (str === null || str === undefined) return "";
  const s = String(str);
  return s.replace(/[&<>"']/g, (m) => {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return map[m];
  });
}

// Safe LocalStorage Loading Utilities
function getSafeStorageInt(key, defaultValue) {
  try {
    const val = localStorage.getItem(key);
    if (val === null) return defaultValue;
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  } catch (e) {
    console.warn(`Error reading localStorage key "${key}":`, e);
    return defaultValue;
  }
}

function getSafeStorageFloat(key, defaultValue) {
  try {
    const val = localStorage.getItem(key);
    if (val === null) return defaultValue;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? defaultValue : parsed;
  } catch (e) {
    console.warn(`Error reading localStorage key "${key}":`, e);
    return defaultValue;
  }
}

function getSafeStorageHistory() {
  try {
    const raw = localStorage.getItem("flightcore_history");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Failed to parse flightcore_history from localStorage:", e);
    return [];
  }
}

// ==========================================
// 1. DATA POOLS (RNG pools to minimize repetition)
// ==========================================

const CHECKLIST_POOLS = [
  {
    name: "APU Ignition Cycle",
    steps: ["BATTERY SWITCH ON", "APU FIRE TEST SELECT", "APU GEN SWITCH OFF", "APU MASTER RUN ENGAGE", "APU START TRIGGER"]
  },
  {
    name: "Engine Start Sequence",
    steps: ["FUEL PUMPS ACTIVE", "BEACON LIGHT ON", "ENG 2 STARTER ENGAGE", "FUEL CUTOFF VALVE OPEN", "GENERATOR 2 ONLINE"]
  },
  {
    name: "Pre-Takeoff Checklist",
    steps: ["FLAPS SET 15 DEG", "AUTO THROTTLE ARMED", "TRANSPONDER SET ALT", "PARKING BRAKE RELEASE", "TAKEOFF CONFIG CHECK"]
  },
  {
    name: "Landing Prep Checklist",
    steps: ["LANDING GEAR DOWN", "AUTOBRAKE SET MEDIUM", "SPEEDBRAKE ARMED", "FLAPS FULL EXTEND", "TAXI LIGHTS ON"]
  },
  {
    name: "Cabin Depressurization",
    steps: ["OXYGEN MASKS DON", "EMERGENCY DESCENT INI", "PASSENGER SYNC DEPLOY", "ATC EMERGENCY DECLARE", "CREW BRIEFING DONE"]
  },
  {
    name: "Wind Shear Escape",
    steps: ["MAX THRUST TOGA SET", "AUTOPILOT DISCONNECT", "PITCH 15 DEG UP", "HOLD FLAPS AND GEAR", "MONITOR PATH TREND"]
  },
  {
    name: "Engine Fire Protocol",
    steps: ["THRUST LEVER IDLE", "FUEL SHUTOFF ENGAGE", "ENGINE FIRE SWITCH PULL", "DISCHARGE BOTTLE 1", "MONITOR EGT DECLINE"]
  },
  {
    name: "Pushback & Taxi",
    steps: ["BEACON LIGHT ON", "PARKING BRAKE RELEASE", "TAXI CLEARANCE RECEIVED", "NAV LIGHTS ON", "BRAKE TEMP CHECK"]
  },
  {
    name: "Rejected Takeoff",
    steps: ["THRUST LEVERS IDLE", "REVERSE THRUST APPLY", "MAX BRAKING APPLY", "SPOILERS DEPLOY", "ATC NOTIFY STOP"]
  },
  {
    name: "Go-Around Procedure",
    steps: ["TOGA THRUST SET", "POSITIVE RATE GEAR UP", "FLAPS RETRACT SCHEDULE", "AUTOPILOT ENGAGE", "ATC MISSED DECLARE"]
  },
  {
    name: "TCAS RA Response",
    steps: ["AUTOPILOT DISCONNECT", "FOLLOW RA COMMAND", "ATC ADVISE RA", "MONITOR TRAFFIC", "RESUME CLEARANCE ATC"]
  },
  {
    name: "Hydraulic Failure",
    steps: ["AFFECTED SYS IDENTIFY", "HYD PUMP SWITCH OFF", "ALTERNATE GEAR CHECK", "BRAKE ACCUMULATOR ARM", "LAND ASAP DECLARE"]
  },
  {
    name: "Pressurization Check",
    steps: ["OUTFLOW VALVE AUTO", "PACK FLOW VERIFY", "DIFF PRESSURE CHECK", "CABIN ALTITUDE SET", "PRESSURIZATION AUTO"]
  },
  {
    name: "Fuel Management",
    steps: ["FUEL QTY CROSS CHECK", "CROSSFEED VALVE CHECK", "CENTER TANK PUMP ON", "FUEL BALANCE MONITOR", "LOG FUEL REMAINING"]
  },
  {
    name: "VFR Departure",
    steps: ["ALTIMETER SET QNH", "TRANSPONDER ALT MODE", "LIGHTS STROBES ON", "FUEL SELECTOR BOTH", "CARB HEAT OFF"]
  },
  {
    name: "Instrument Approach Briefing",
    steps: ["APPROACH CHART REVIEW", "MINS DA MDA SET", "NAV FREQ IDENT VERIFY", "MISSED APCH BRIEFED", "LANDING SPEEDS SET"]
  },
  {
    name: "After Landing Checklist",
    steps: ["REVERSE THRUST OFF", "FLAPS RETRACT FULL", "STROBES OFF", "APU START INITIATE", "GROUND SPOILERS DISARM"]
  }
];

const INSTRUMENT_METRIC_POOLS = [
  { label: "IAS", name: "Indicated Airspeed", min: 100, max: 340, unit: "KT", color: "#4895EF" },
  { label: "ALT", name: "Altimeter", min: 1500, max: 12000, unit: "FT", color: "#E2953C" },
  { label: "N1", name: "Fan Speed RPM", min: 45, max: 98, unit: "%", color: "#4A7C59" },
  { label: "EGT", name: "Exhaust Gas Temp", min: 200, max: 850, unit: "°C", color: "#A54657" },
  { label: "FF", name: "Fuel Flow", min: 1200, max: 5800, unit: "PPH", color: "#9D4EDD" },
  { label: "OIL", name: "Oil Pressure", min: 25, max: 95, unit: "PSI", color: "#56CFE1" },
  { label: "VIB", name: "Engine Vibration", min: 0.2, max: 4.8, unit: "MIL", color: "#70E000" },
  { label: "BAT", name: "DC Bus Voltage", min: 22, max: 32, unit: "V", color: "#FFD700" }
];

const ATC_POOLS = {
  callsigns: ["CLIPPER 402", "AIR FORCE ONE", "SPEEDBIRD 117", "LUFTHANSA 440", "DELTA 905", "UNITED 248", "NAVY 801", "FLAGSHIP 332",
              "AMERICAN 612", "CATHAY 889", "EMIRATES 202", "QANTAS 455", "KOREAN AIR 74", "SWISS 103", "VIRGIN 330", "HEAVY METAL 1"],
  facilities: ["SEATTLE CENTER", "CHICAGO TOWER", "LONDON APPROACH", "BOSTON CENTER", "MIAMI GROUND", "LA DEP CON", "TOKYO CONTROL", "JFK TOWER",
               "DUBAI CONTROL", "PARIS APPROACH", "SYDNEY TOWER", "HONG KONG CTR", "TORONTO GROUND", "FRANKFURT APPR", "DENVER CENTER", "PHOENIX TOWER"],
  frequencies: ["121.90", "124.75", "118.10", "132.85", "128.05", "134.40", "119.50", "127.30",
                "123.45", "125.60", "129.70", "131.85", "135.10", "137.80", "122.35", "130.55"],
  squawks: ["4201", "7200", "1200", "7700", "3352", "6401", "0422", "5015",
            "2577", "4401", "3602", "5120", "0631", "7301", "1503", "4720"]
};

const FAULT_POOLS = [
  { symptom: "RAPID CABIN DEPRESSURIZATION", system: "PNEUMATIC MANIFOLD", action: "DON OXYGEN MASKS" },
  { symptom: "EGT EXCESS HIGH LIMIT", system: "FUEL CONTROL MODULE", action: "RETARD THROTTLE DETENT" },
  { symptom: "DUAL ENGINE ROTOR LOCK", system: "EMERGENCY APU GENERATOR", action: "PITCH STABILIZE GLIDE" },
  { symptom: "HYDRAULIC RESERVOIR EMPTY", system: "FLUID TRANSFER VALVE", action: "ENGAGE STANDBY FLUIDS" },
  { symptom: "WING FLAPS ASYMMETRY", system: "FLAP POWER ACTUATOR", action: "MATCH CONTRALATERAL" },
  { symptom: "ELECTRICAL BUS OVERLOAD", system: "CROSSFEED ISOLATOR", action: "RESET ENGINE GENERATOR" },
  { symptom: "UNRELIABLE AIRSPEED INDICATION", system: "PITOT HEAT CIRCUIT", action: "APPLY PITOT HEAT" },
  { symptom: "SMOKE IN COCKPIT DETECTED", system: "ELECTRICAL WIRING BUS", action: "ISOLATE ELECTRICAL BUS" },
  { symptom: "RUNAWAY STABILIZER TRIM", system: "TRIM MOTOR ACTUATOR", action: "CUTOUT SWITCHES PULL" },
  { symptom: "ENGINE OIL PRESSURE LOW", system: "OIL PUMP SCAVENGE LINE", action: "ENGINE SHUTDOWN PREP" },
  { symptom: "AIRFRAME ICING SEVERE", system: "PNEUMATIC BLEED AIR", action: "MANUAL DEICE ACTIVATE" },
  { symptom: "GENERATOR BUS DROPOUT", system: "MAIN GENERATOR RELAY", action: "BATTERY BUS ISOLATE" },
  { symptom: "WINDSHEAR ENCOUNTER ON APPROACH", system: "WINDSHEAR DETECTION SYSTEM", action: "EXECUTE ESCAPE MANEUVER" },
  { symptom: "TCAS RA CLIMB ISSUED", system: "TRAFFIC COLLISION AVOIDANCE", action: "FOLLOW RA DISCONNECT AP" },
  { symptom: "FLAP OVERSPEED EXCEEDANCE", system: "FLAP LOAD RELIEF CIRCUIT", action: "REDUCE AIRSPEED BELOW VFE" },
  { symptom: "AUTOPILOT UNCOMMANDED DISCONNECT", system: "FLIGHT CONTROL COMPUTER", action: "MANUAL CONTROL ENGAGE" },
  { symptom: "FUEL IMBALANCE ASYMMETRY", system: "CROSSFEED VALVE SYSTEM", action: "OPEN CROSSFEED BALANCE" },
  { symptom: "BIRD STRIKE ENGINE DAMAGE", system: "FAN BLADE CONTAINMENT RING", action: "ASSESS THRUST CAPABILITY" },
  { symptom: "GROUND PROXIMITY WARNING SOUNDED", system: "TERRAIN AWARENESS SYSTEM", action: "MAX THRUST PULL UP" },
  { symptom: "DOOR SEAL PRESSURE LOSS", system: "FUSELAGE PRESSURE SEAL", action: "VERIFY DOOR LATCHED CLOSED" }
];

// ==========================================
// 2. STATE MANAGER
// ==========================================

let sessionRound = 0;
let sessionScore = 0;
let streak = 0;
let level = 1;
let sessionMaxStreak = 0;
let activeModule = null;
let recentlyPlayedModules = []; // Holds last 2 modules to implement "No 3x Repeat"
let selectedModules = ["checklist", "instruments", "atc", "fault"];
let sessionLength = FlightCore.safeNumber(localStorage.getItem("flightcore_session_length"), 8, { min: 1, max: 50 });
let startingStreak = FlightCore.safeNumber(localStorage.getItem("flightcore_starting_streak"), 4, { min: 0, max: 100 });
let timerMultiplier = FlightCore.safeNumber(localStorage.getItem("flightcore_timer_multiplier"), 1, { min: 0.1, max: 10 });

let currentRndExpected = null;
let currentRndInput = null;
let studyTimer = null;
let studyDurationRemaining = 0;
let briefingStartTime = 0;
let isTimerPaused = false;
let pausedAccum = 0;
let pauseStart = 0;

let focusedInputId = null;
let activeKeypadBuffer = "";

let roundByRoundHistory = []; // Session history
// Corrupt or tampered storage must never crash boot — safeParse guarantees an array.
let globalHistory = FlightCore.safeParse(localStorage.getItem("flightcore_history"), []);
let dailyStreak = FlightCore.safeNumber(localStorage.getItem("flightcore_daily_streak"), 0, { min: 0 });

// Tracks pool indices used this session to prevent within-session repeats
let usedFaultIndices = [];
let usedChecklistIndices = [];
let usedATCIndices = {}; // { callsigns: Set, facilities: Set, frequencies: Set, squawks: Set }

// ==========================================
// 3. AUDIO SYNTH (Muted)
// ==========================================

function playSound(type) {
  // Silent no-op
}

function triggerHaptic(type) {
  // Silent no-op
}

// Persist to localStorage without ever throwing. Private mode / quota-exceeded
// must not crash the session — we warn once and continue.
function safeStorageSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.warn(`Flight Core: unable to persist "${key}" (storage blocked or full).`, e);
    return false;
  }
}


const APP_CONFIG = Object.freeze(Object.assign({
  APP_ENV: "local",
  TELEMETRY_ENABLED: false,
  TELEMETRY_ENDPOINT: ""
}, window.FlightCoreConfig || {}));

function validateRuntimeConfig() {
  if (APP_CONFIG.APP_ENV === "production") {
    const stripeKey = String(APP_CONFIG.STRIPE_PUBLISHABLE_KEY || "");
    const supabaseUrl = String(APP_CONFIG.SUPABASE_URL || "");
    if (stripeKey.startsWith("pk_test_") || /localhost|127\.0\.0\.1/i.test(supabaseUrl)) {
      handleGlobalError(new Error("Production runtime config is using a non-production service key or URL."));
      return false;
    }
  }
  return true;
}

function updateEnvironmentBadge() {
  const badge = document.getElementById("environment-badge");
  if (!badge) return;
  const env = APP_CONFIG.APP_ENV || "local";
  if (env === "production") {
    badge.hidden = true;
    return;
  }
  badge.textContent = env.toUpperCase();
  badge.hidden = false;
}

const Telemetry = {
  isEnabled() {
    return APP_CONFIG.TELEMETRY_ENABLED === true && localStorage.getItem("flightcore_telemetry_opt_out") !== "1";
  },
  setEnabled(enabled) {
    safeStorageSet("flightcore_telemetry_opt_out", enabled ? "0" : "1");
  },
  emit(eventName, props = {}) {
    if (!this.isEnabled() || !APP_CONFIG.TELEMETRY_ENDPOINT) return false;
    const payload = JSON.stringify({ event: String(eventName || "unknown"), env: APP_CONFIG.APP_ENV || "local", ts: new Date().toISOString(), props });
    try {
      if (navigator.sendBeacon) return navigator.sendBeacon(APP_CONFIG.TELEMETRY_ENDPOINT, new Blob([payload], { type: "application/json" }));
      fetch(APP_CONFIG.TELEMETRY_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true }).catch(() => {});
      return true;
    } catch (e) {
      console.warn("Flight Core: telemetry emit failed.", e);
      return false;
    }
  }
};
// ==========================================
// 4. LEVEL & MODULE CONTROLS
// ==========================================

function updateLevelAndHUD() {
  level = FlightCore.computeLevel(streak);
  document.getElementById("hud-level").textContent = `LVL: ${String(level).padStart(2, "0")}`;
  document.getElementById("hud-round").textContent = `${String(sessionRound).padStart(2, "0")}/${String(sessionLength).padStart(2, "0")}`;
  document.getElementById("hud-score").textContent = String(sessionScore).padStart(5, "0");
  
  // Render streak chevrons
  const chevronContainer = document.getElementById("hud-streak-container");
  chevronContainer.innerHTML = "";
  // Display streak up to 5 chevrons
  const activeChevrons = streak % 5;
  const totalChevrons = 5;
  for (let i = 0; i < totalChevrons; i++) {
    const chev = document.createElement("div");
    chev.className = "chevron" + (i < activeChevrons ? " active" : "");
    chevronContainer.appendChild(chev);
  }
  
  // Update real-time horizontal progress dots
  renderRoundStepTracker();
}

function renderRoundStepTracker() {
  const container = document.getElementById("hud-round-dots");
  if (!container) return;
  
  container.innerHTML = "";
  
  // Create dots representing session rounds
  for (let r = 1; r <= sessionLength; r++) {
    const dot = document.createElement("div");
    dot.className = "round-dot";
    
    // Check if this round's performance is already recorded in history
    const pastRound = roundByRoundHistory.find(h => h.round === r);
    
    dot.setAttribute("role", "listitem");
    if (pastRound) {
      if (pastRound.grade === "perfect" || pastRound.grade === "good") {
        dot.classList.add("completed-success");
        dot.setAttribute("aria-label", `Round ${r}: success`);
      } else if (pastRound.grade === "partial") {
        dot.classList.add("completed-warning");
        dot.setAttribute("aria-label", `Round ${r}: partial`);
      } else {
        dot.classList.add("completed-error");
        dot.setAttribute("aria-label", `Round ${r}: failed`);
      }
    } else if (r === sessionRound && sessionRound > 0) {
      dot.classList.add("active");
      dot.setAttribute("aria-label", `Round ${r}: active`);
    } else {
      dot.classList.add("upcoming");
      dot.setAttribute("aria-label", `Round ${r}: upcoming`);
    }

    container.appendChild(dot);
  }
}

function selectNextModule() {
  // Pure "No 3x Repeat" selection with empty-pool safeguard (never undefined).
  let selected = FlightCore.selectModule(selectedModules, recentlyPlayedModules);
  // Absolute last-resort fallback if the active selection is somehow empty.
  if (!selected) selected = "checklist";

  // Track recently played
  recentlyPlayedModules.push(selected);
  if (recentlyPlayedModules.length > 2) {
    recentlyPlayedModules.shift();
  }
  
  activeModule = selected;
  document.getElementById("hud-module").textContent = selected.toUpperCase();
  return selected;
}

// ==========================================
// 5. DATA GENERATION FOR MODULES
// ==========================================

// The pure generation, scoring and selection logic lives in core.js
// (window.FlightCore). These thin wrappers bind it to the live session state
// (current `level`, the within-session "used pool" trackers, and the HUD).
function generateChecklistData() {
  const data = FlightCore.generateChecklist(CHECKLIST_POOLS, level, usedChecklistIndices);
  usedChecklistIndices.push(data.chosenIdx);
  return { title: data.title, expected: data.expected, pool: data.pool };
}

function generateInstrumentsData() {
  return FlightCore.generateInstruments(INSTRUMENT_METRIC_POOLS, level);
}

function generateATCData() {
  const data = FlightCore.generateATC(ATC_POOLS, level, usedATCIndices);
  usedATCIndices = data.usedState; // capture the (possibly freshly-created) tracker
  return { expected: data.expected, displayText: data.displayText };
}

function generateFaultData() {
  const data = FlightCore.generateFault(FAULT_POOLS, level, usedFaultIndices);
  usedFaultIndices.push(data.chosenIdx);
  return { symptom: data.symptom, expected: data.expected, pool: data.pool };
}

// Utility shuffler — delegates to the pure engine (returns a new array).
function shuffle(array) {
  return FlightCore.shuffle(array);
}

// ==========================================
// 6. SCREEN SYSTEM (Transitions & Setup)
// ==========================================

function showScreen(screenId) {
  const screens = ["screen-home", "screen-study", "screen-test", "screen-feedback", "screen-debrief"];
  screens.forEach(s => {
    const el = document.getElementById(s);
    if (s === screenId) {
      el.classList.add("active");
    } else {
      el.classList.remove("active");
    }
  });

  // Hide keypad and text inputs by default unless needed
  document.getElementById("custom-keypad").style.display = "none";
  document.getElementById("custom-text-keypad").style.display = "none";

  // Toggle desktop sidebar between static and live panels
  const isActiveSession = screenId === "screen-study" || screenId === "screen-test" || screenId === "screen-feedback";
  const staticPanel = document.getElementById("sidebar-static-panel");
  const livePanel = document.getElementById("sidebar-live-panel");
  if (staticPanel) staticPanel.style.display = isActiveSession ? "none" : "flex";
  if (livePanel) livePanel.style.display = isActiveSession ? "flex" : "none";
  if (isActiveSession) updateSidebarLiveStats();

  // Automatically toggle abort header based on screen
  updateHeaderControls(screenId);
}

function updateSidebarLiveStats() {
  const scoreEl = document.getElementById("live-stat-score");
  const streakEl = document.getElementById("live-stat-streak");
  const roundEl = document.getElementById("live-stat-round");
  const levelEl = document.getElementById("live-stat-level");
  const moduleEl = document.getElementById("live-stat-module");
  const historyEl = document.getElementById("live-round-history");

  if (scoreEl) scoreEl.textContent = String(sessionScore).padStart(5, "0");
  if (streakEl) streakEl.textContent = streak;
  if (roundEl) roundEl.textContent = `${sessionRound}/${sessionLength}`;
  if (levelEl) levelEl.textContent = `LVL ${level}`;
  if (moduleEl) moduleEl.textContent = activeModule ? activeModule.toUpperCase() : "—";

  if (historyEl) {
    historyEl.innerHTML = "";
    const recentRounds = roundByRoundHistory.slice(-5);
    recentRounds.forEach(r => {
      const row = document.createElement("div");
      row.style.cssText = "display:flex;justify-content:space-between;align-items:center;font-size:0.65rem;padding:4px 0;border-bottom:1px solid var(--border-subtle);";
      const gradeColor = r.grade === "perfect" || r.grade === "good" ? "var(--success-emerald)" : r.grade === "partial" ? "var(--accent-amber)" : "var(--error-rose)";
      row.innerHTML = `<span style="color:var(--text-muted)">R${String(r.round).padStart(2,"0")} ${r.module.toUpperCase()}</span><span style="font-weight:700;color:${gradeColor}">${r.accuracy}%</span>`;
      historyEl.appendChild(row);
    });
    if (recentRounds.length === 0) {
      historyEl.innerHTML = `<div style="font-size:0.6rem;color:var(--text-muted)">No rounds completed yet</div>`;
    }
  }
}

// Start Round
function startRound() {
  sessionRound++;
  updateLevelAndHUD();
  
  const module = selectNextModule();
  
  // Generate module data
  if (module === "checklist") {
    currentRndExpected = generateChecklistData();
  } else if (module === "instruments") {
    currentRndExpected = generateInstrumentsData();
  } else if (module === "atc") {
    currentRndExpected = generateATCData();
  } else if (module === "fault") {
    currentRndExpected = generateFaultData();
  }
  
  setupStudyScreen(module);
  showScreen("screen-study");
}

// ==========================================
// 7. STUDY/BRIEFING SEQUENCE
// ==========================================

function setupStudyScreen(module) {
  isTimerPaused = false;
  const pauseIcon = document.getElementById("study-pause-icon");
  if (pauseIcon) {
    pauseIcon.innerHTML = `
      <rect x="6" y="4" width="4" height="16"></rect>
      <rect x="14" y="4" width="4" height="16"></rect>
    `;
  }
  const pausedOverlay = document.getElementById("paused-overlay");
  if (pausedOverlay) {
    pausedOverlay.style.display = "none";
  }

  // Hide all briefing content blocks first
  document.getElementById("briefing-checklist").style.display = "none";
  document.getElementById("briefing-instruments").style.display = "none";
  document.getElementById("briefing-atc").style.display = "none";
  document.getElementById("briefing-fault").style.display = "none";
  
  // Title adjust
  const titleEl = document.getElementById("study-type-title");
  
  if (module === "checklist") {
    titleEl.textContent = "MEMORIZE CHECKLIST ORDER";
    document.getElementById("briefing-checklist").style.display = "block";
    document.getElementById("checklist-title-brief").textContent = currentRndExpected.title;
    
    const listBrief = document.getElementById("checklist-list-brief");
    listBrief.innerHTML = "";
    currentRndExpected.expected.forEach(step => {
      const li = document.createElement("li");
      li.textContent = step;
      listBrief.appendChild(li);
    });
  } 
  else if (module === "instruments") {
    titleEl.textContent = "SCAN INSTRUMENT TELEMETRY";
    document.getElementById("briefing-instruments").style.display = "block";
    
    const gridBrief = document.getElementById("instruments-grid-brief");
    gridBrief.innerHTML = "";
    currentRndExpected.expected.forEach(g => {
      gridBrief.appendChild(createGaugeHTML(g, false));
    });
  } 
  else if (module === "atc") {
    titleEl.textContent = "RETAIN COM TRANSMISSION";
    document.getElementById("briefing-atc").style.display = "block";
    document.getElementById("atc-string-brief").textContent = currentRndExpected.displayText;
  } 
  else if (module === "fault") {
    titleEl.textContent = "DIAGNOSE FAULT PROTOCOL";
    document.getElementById("briefing-fault").style.display = "block";
    document.getElementById("fault-symptom-brief").textContent = `SYMPTOM: ${currentRndExpected.symptom}`;
    
    const flowBrief = document.getElementById("fault-flow-brief");
    flowBrief.innerHTML = "";
    const headers = ["1. SYSTEM FAILURE", "2. MITIGATION ACTION"];
    for (let i = 1; i <= 2; i++) {
      const node = document.createElement("div");
      node.className = "fault-step-node";
      node.innerHTML = `
        <span class="fault-step-title">${headers[i-1]}</span>
        <span class="fault-step-content">${currentRndExpected.expected[i]}</span>
      `;
      flowBrief.appendChild(node);
    }
  }
  
  // Study timer dynamic setup (shorter as levels scale up, scaled by user's timer duration setting)
  let studySecs = 10;
  if (module === "checklist") {
    studySecs = Math.max(12 - level, 6);
  } else if (module === "instruments") {
    studySecs = Math.max(8 - (level * 0.75), 3.5);
  } else if (module === "atc") {
    studySecs = Math.max(10 - (level * 0.8), 4);
  } else if (module === "fault") {
    studySecs = Math.max(10 - (level * 0.8), 4.5);
  }
  studySecs = studySecs * timerMultiplier;
  
  briefingStartTime = Date.now();
  pausedAccum = 0;
  pauseStart = 0;
  studyDurationRemaining = studySecs;

  const timerBar = document.getElementById("study-timer-bar");
  const timerDisplay = document.getElementById("study-timer-display");
  timerBar.style.width = "100%";
  timerDisplay.textContent = `${studyDurationRemaining.toFixed(2)}s`;

  if (studyTimer) clearInterval(studyTimer);

  const intervalTime = 50; // update every 50ms for smooth animation

  const speedBonusBadge = document.getElementById("study-speed-bonus");
  if (speedBonusBadge) speedBonusBadge.style.display = "inline-flex";

  let lowTimeWarned = false;
  studyTimer = setInterval(() => {
    if (isTimerPaused) return;
    studyDurationRemaining = Math.max(studySecs - (Date.now() - briefingStartTime - pausedAccum) / 1000, 0);
    const widthPct = studySecs > 0 ? Math.min(Math.max((studyDurationRemaining / studySecs) * 100, 0), 100) : 0;
    timerBar.style.width = `${widthPct}%`;
    timerDisplay.textContent = `${studyDurationRemaining.toFixed(2)}s`;
    if (speedBonusBadge) speedBonusBadge.textContent = `+${Math.round(studyDurationRemaining * 50)} EARLY`;

    // Low-time warning: turn bar amber and pulse tag when ≤ 3 s remain
    if (studyDurationRemaining <= 3 && !lowTimeWarned) {
      lowTimeWarned = true;
      timerBar.style.backgroundColor = "var(--accent-amber)";
      timerDisplay.style.color = "var(--accent-amber)";
      triggerHaptic("warning");
    } else if (studyDurationRemaining > 3) {
      timerBar.style.backgroundColor = "var(--accent-blue)";
      timerDisplay.style.color = "";
      lowTimeWarned = false;
    }

    if (studyDurationRemaining <= 0) {
      timerBar.style.backgroundColor = "";
      timerDisplay.style.color = "";
      clearInterval(studyTimer);
      commenceTest();
    }
  }, intervalTime);
}

// Clean text and numbers only for Instruments
function createGaugeHTML(g, isBlanked = false) {
  const container = document.createElement("div");
  container.className = "gauge-card" + (isBlanked ? " blanked" : "");
  if (isBlanked) {
    container.setAttribute("data-label", g.label);
  }
  
  const percent = FlightCore.gaugePercent(g.val, g.min, g.max);
  
  let rangeBarHTML = "";
  if (!isBlanked) {
    let indicatorClass = "normal";
    if (percent <= 10 || percent >= 90) {
      indicatorClass = "warning";
    }
    rangeBarHTML = `
      <div class="gauge-range-bar">
        <div class="gauge-range-indicator ${indicatorClass}" style="left: ${percent}%;"></div>
      </div>
    `;
  } else {
    rangeBarHTML = `
      <div class="gauge-range-bar" style="background: rgba(255,255,255,0.02);"></div>
    `;
  }
  
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; width: 100%; font-size: 0.65rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 8px;">
      <span style="color: ${g.color || 'var(--accent-blue)'};">${g.label}</span>
      <span>${g.unit}</span>
    </div>
    <div class="gauge-value-display" style="font-size: 1.5rem; font-weight: 800; color: var(--text-primary); margin: 6px 0; letter-spacing: -0.5px;">
      ${isBlanked ? "???" : g.val}
    </div>
    <div class="gauge-name" style="font-size: 0.58rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.3px; text-align: center; margin-bottom: 4px;">
      ${g.name}
    </div>
    ${rangeBarHTML}
  `;
  
  return container;
}

// ==========================================
// 8. TEST/RECALL SEQUENCE
// ==========================================

function commenceTest() {
  if (studyTimer) clearInterval(studyTimer);
  playSound("click");

  // Hide speed bonus badge and reset timer bar colour
  const speedBonusBadge = document.getElementById("study-speed-bonus");
  if (speedBonusBadge) speedBonusBadge.style.display = "none";
  const timerBar = document.getElementById("study-timer-bar");
  if (timerBar) timerBar.style.backgroundColor = "";
  const timerDisplay = document.getElementById("study-timer-display");
  if (timerDisplay) timerDisplay.style.color = "";

  // Reset input state variables
  focusedInputId = null;
  activeKeypadBuffer = "";
  
  // Hide all test content blocks first
  document.getElementById("test-checklist").style.display = "none";
  document.getElementById("test-instruments").style.display = "none";
  document.getElementById("test-atc").style.display = "none";
  document.getElementById("test-fault").style.display = "none";
  
  const labelEl = document.getElementById("test-type-label");
  
  if (activeModule === "checklist") {
    labelEl.textContent = "SEQUENCE MASTER CHECKLIST";
    document.getElementById("test-checklist").style.display = "block";
    
    currentRndInput = []; // User clicks blocks in order
    renderChecklistTestLayout();
  } 
  else if (activeModule === "instruments") {
    labelEl.textContent = "RECALL TELEMETRY VALUES";
    document.getElementById("test-instruments").style.display = "block";
    
    currentRndInput = {}; // Key value map of gauge IAS, ALT etc
    renderInstrumentsTestLayout();
  } 
  else if (activeModule === "atc") {
    labelEl.textContent = "ENTER RADIO SPECS";
    document.getElementById("test-atc").style.display = "block";
    
    currentRndInput = { callsign: "", facility: "", freq: "", squawk: "" };
    renderATCTestLayout();
  } 
  else if (activeModule === "fault") {
    labelEl.textContent = "MITIGATE DIAGNOSTIC CHAIN";
    document.getElementById("test-fault").style.display = "block";
    
    currentRndInput = ["", ""]; // Slot 1: system, Slot 2: action
    renderFaultTestLayout();
  }
  
  showScreen("screen-test");
}

// Checklist Sorter Layout
function renderChecklistTestLayout() {
  const slotsContainer = document.getElementById("checklist-slots");
  slotsContainer.innerHTML = "";
  
  // Render empty slot placeholders
  for (let i = 0; i < currentRndExpected.expected.length; i++) {
    const slot = document.createElement("div");
    slot.className = "checklist-slot";
    slot.innerHTML = `
      <span class="checklist-slot-index">${String(i + 1).padStart(2, "0")}</span>
      <span class="checklist-slot-content" id="checklist-slot-text-${i}" style="color: var(--text-muted);">[VACANT]</span>
    `;
    slotsContainer.appendChild(slot);
  }
  
  renderChecklistPool();
}

function renderChecklistPool() {
  const poolContainer = document.getElementById("checklist-pool");
  poolContainer.innerHTML = "";
  
  // Once every slot is filled, stop offering pool items — selecting more than
  // the slot count would index a non-existent slot element and throw.
  const slotsFull = currentRndInput.length >= currentRndExpected.expected.length;

  let visibleIndex = 0;
  // Load remaining steps that haven't been selected yet
  currentRndExpected.pool.forEach(item => {
    if (!slotsFull && !currentRndInput.includes(item)) {
      visibleIndex++;
      const el = document.createElement("div");
      el.className = "sortable-item";
      el.setAttribute("role", "button");
      el.setAttribute("tabindex", "0");
      el.setAttribute("aria-label", item);
      el.innerHTML = `
        <span>${item}</span>
        <span class="shortcut-badge" style="font-size: 0.6rem; opacity: 0.4; font-weight: 700; border: 1px solid var(--border-subtle); padding: 1px 4px; border-radius: 4px; margin-left: 8px;">${visibleIndex}</span>
      `;
      const currentVal = item;
      const handleChecklistItemClick = () => {
        playSound("click");
        // Add to input array
        currentRndInput.push(currentVal);

        // Update slots
        const slotIdx = currentRndInput.length - 1;
        const slotText = document.getElementById(`checklist-slot-text-${slotIdx}`);
        if (slotText) {
          slotText.textContent = currentVal;
          slotText.style.color = "var(--text-white)";
        }

        // Re-render remaining pool
        renderChecklistPool();
      };
      el.addEventListener("click", handleChecklistItemClick);
      el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleChecklistItemClick(); } });
      poolContainer.appendChild(el);
    }
  });
  
  // Add an undo/clear helper button if items are selected
  if (currentRndInput.length > 0) {
    const undo = document.createElement("button");
    undo.className = "btn btn-danger btn-block";
    undo.style.minHeight = "36px";
    undo.style.marginTop = "8px";
    undo.textContent = "⌫ RESET LAST CHOICE";
    undo.addEventListener("click", () => {
      playSound("click");
      const removed = currentRndInput.pop();
      const slotIdx = currentRndInput.length;
      const slotText = document.getElementById(`checklist-slot-text-${slotIdx}`);
      if (slotText) {
        slotText.textContent = "[VACANT]";
        slotText.style.color = "var(--text-muted)";
      }
      renderChecklistPool();
    });
    poolContainer.appendChild(undo);
  }
}

// Instruments Layout
function renderInstrumentsTestLayout() {
  const grid = document.getElementById("instruments-grid-test");
  grid.innerHTML = "";
  
  currentRndExpected.expected.forEach((g, idx) => {
    const card = createGaugeHTML(g, true); // Blanked layout
    
    // Append a corner keyboard shortcut badge
    const badge = document.createElement("span");
    badge.className = "gauge-shortcut-badge";
    badge.style.position = "absolute";
    badge.style.top = "6px";
    badge.style.left = "6px";
    badge.style.fontSize = "0.55rem";
    badge.style.opacity = "0.35";
    badge.style.fontWeight = "700";
    badge.style.border = "1px solid var(--border-subtle)";
    badge.style.padding = "1px 3px";
    badge.style.borderRadius = "3px";
    badge.textContent = idx + 1;
    card.appendChild(badge);
    card.style.position = "relative";
    
    // Tap to select / focus gauge to input!
    card.addEventListener("click", () => {
      playSound("click");
      document.querySelectorAll(".gauge-card").forEach(c => c.classList.remove("active-step"));
      card.classList.add("active-step");
      
      focusGaugeInput(g.label, card);
    });
    
    grid.appendChild(card);
  });
}

function focusGaugeInput(label, cardEl) {
  focusedInputId = label;
  activeKeypadBuffer = currentRndInput[label] || "";
  
  // Display dynamic integrated keypad
  document.getElementById("custom-keypad").style.display = "block";
  document.getElementById("keypad-input-label").textContent = `ACTIVE GAUGE: ${label}`;
  document.getElementById("keypad-preview-value").textContent = activeKeypadBuffer || "---";
  
  // Auto highlight decimal point option based on gauge type
  const isFloat = label === "VIB" || label === "BAT";
  document.getElementById("keypad-dot").style.opacity = isFloat ? "1" : "0.3";
  document.getElementById("keypad-dot").style.pointerEvents = isFloat ? "auto" : "none";
}

// ATC Layout
function renderATCTestLayout() {
  // Set focus handlers on individual ATC boxes
  const fields = ["callsign", "facility", "freq", "squawk"];
  
  fields.forEach(f => {
    const el = document.getElementById(`atc-input-${f}`);
    el.value = "";
    el.className = "input-terminal";
    
    el.addEventListener("click", () => {
      playSound("click");
      document.querySelectorAll(".input-terminal").forEach(i => i.classList.remove("active-input"));
      el.classList.add("active-input");
      
      focusATCField(f, el);
    });
  });
}

function focusATCField(field, inputEl) {
  focusedInputId = field;
  
  if (field === "freq" || field === "squawk") {
    // Show numeric keypad
    document.getElementById("custom-text-keypad").style.display = "none";
    document.getElementById("custom-keypad").style.display = "block";
    document.getElementById("keypad-input-label").textContent = `INPUT: ${field.toUpperCase()}`;
    activeKeypadBuffer = currentRndInput[field] || "";
    document.getElementById("keypad-preview-value").textContent = activeKeypadBuffer || "---";
    
    const isFloat = field === "freq";
    document.getElementById("keypad-dot").style.opacity = isFloat ? "1" : "0.3";
    document.getElementById("keypad-dot").style.pointerEvents = isFloat ? "auto" : "none";
  } 
  else {
    // Show quick-select options for text elements (Callsign/Facility) to avoid full typing on mobile
    document.getElementById("custom-keypad").style.display = "none";
    document.getElementById("custom-text-keypad").style.display = "block";
    document.getElementById("text-keypad-input-label").textContent = `CHOOSE: ${field.toUpperCase()}`;
    document.getElementById("text-keypad-preview-value").textContent = currentRndInput[field] || "---";
    
    renderATCQuickSelectOptions(field, inputEl);
  }
}

function renderATCQuickSelectOptions(field, inputEl) {
  const optionsContainer = document.getElementById("text-keypad-options");
  optionsContainer.innerHTML = "";
  
  // Pick options list (correct one and 3 distractors)
  const correct = currentRndExpected.expected[field];
  let pool = field === "callsign" ? ATC_POOLS.callsigns : ATC_POOLS.facilities;
  
  let options = [correct];
  while (options.length < Math.min(4, pool.length)) {
    const opt = pool[Math.floor(Math.random() * pool.length)];
    if (!options.includes(opt)) {
      options.push(opt);
    }
  }
  options = shuffle(options);
  
  options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.className = "keypad-btn";
    btn.style.height = "44px";
    btn.style.fontSize = "0.75rem";
    btn.innerHTML = `<span style="opacity: 0.4; font-size: 0.6rem; margin-right: 6px; font-weight: 700; border: 1px solid var(--border-subtle); padding: 1px 4px; border-radius: 4px;">${idx + 1}</span> ${opt}`;
    const currentVal = opt;
    btn.addEventListener("click", () => {
      playSound("click");
      currentRndInput[field] = currentVal;
      inputEl.value = currentVal;
      document.getElementById("text-keypad-preview-value").textContent = currentVal;
      
      // Auto-advance to the next field in the ATC chain
      setTimeout(() => {
        if (field === "callsign") {
          const nextEl = document.getElementById("atc-input-facility");
          if (nextEl) nextEl.click();
        } else if (field === "facility") {
          const nextEl = document.getElementById("atc-input-freq");
          if (nextEl) nextEl.click();
        } else if (field === "freq") {
          // freq normally advances via the numeric keypad, but keep the
          // quick-select path consistent so squawk is never skipped.
          const nextEl = document.getElementById("atc-input-squawk");
          if (nextEl) nextEl.click();
        }
      }, 150);
    });
    optionsContainer.appendChild(btn);
  });
}

// Fault Layout
function renderFaultTestLayout() {
  document.getElementById("fault-symptom-test-label").textContent = `SYMPTOM: ${currentRndExpected.symptom}`;
  
  const slotsContainer = document.getElementById("fault-slots");
  slotsContainer.innerHTML = "";
  
  const headers = ["1. SYSTEM FAILURE", "2. MITIGATION ACTION"];
  for (let i = 0; i < 2; i++) {
    const slot = document.createElement("div");
    slot.className = "fault-step-node";
    slot.setAttribute("id", `fault-slot-container-${i}`);
    slot.innerHTML = `
      <span class="fault-step-title" style="color: var(--accent-cyan);">${headers[i]}</span>
      <span class="fault-step-content" id="fault-slot-text-${i}" style="color: var(--text-muted);">[VACANT - TAP CHOSEN UNIT]</span>
    `;
    
    // Clicking slot focuses it so we know where to inject option
    slot.addEventListener("click", () => {
      playSound("click");
      document.querySelectorAll(".fault-step-node").forEach(n => n.classList.remove("active-step"));
      slot.classList.add("active-step");
      focusedInputId = i;
      renderFaultPool();
    });
    
    slotsContainer.appendChild(slot);
  }
  
  // Auto focus first vacant slot
  document.getElementById("fault-slot-container-0").classList.add("active-step");
  focusedInputId = 0;
  
  renderFaultPool();
}

function renderFaultPool() {
  const poolContainer = document.getElementById("fault-pool");
  poolContainer.innerHTML = "";
  
  let visibleIndex = 0;
  // Populate options
  currentRndExpected.pool.forEach(item => {
    // Only display option if it hasn't been placed in another slot
    if (!currentRndInput.includes(item)) {
      visibleIndex++;
      const btn = document.createElement("div");
      btn.className = "sortable-item";
      btn.setAttribute("role", "button");
      btn.setAttribute("tabindex", "0");
      btn.setAttribute("aria-label", item);
      btn.innerHTML = `
        <span>${item}</span>
        <span class="shortcut-badge" style="font-size: 0.6rem; opacity: 0.4; font-weight: 700; border: 1px solid var(--border-subtle); padding: 1px 4px; border-radius: 4px; margin-left: 8px;">${visibleIndex}</span>
      `;
      const currentVal = item;
      const handleFaultItemClick = () => {
        playSound("click");

        // Write choice
        currentRndInput[focusedInputId] = currentVal;

        // Update slot text
        const textEl = document.getElementById(`fault-slot-text-${focusedInputId}`);
        if (textEl) {
          textEl.textContent = currentVal;
          textEl.style.color = "var(--text-white)";
        }

        // Advance focus if slot 0 is filled
        if (focusedInputId === 0 && currentRndInput[1] === "") {
          document.querySelectorAll(".fault-step-node").forEach(n => n.classList.remove("active-step"));
          const slot1 = document.getElementById("fault-slot-container-1");
          slot1.classList.add("active-step");
          focusedInputId = 1;
        }

        renderFaultPool();
      };
      btn.addEventListener("click", handleFaultItemClick);
      btn.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleFaultItemClick(); } });
      poolContainer.appendChild(btn);
    }
  });
  
  // Clear/Reset option
  if (currentRndInput[0] !== "" || currentRndInput[1] !== "") {
    const clearBtn = document.createElement("button");
    clearBtn.className = "btn btn-danger btn-block";
    clearBtn.style.minHeight = "36px";
    clearBtn.style.marginTop = "8px";
    clearBtn.textContent = "⌫ CLEAR DIAGNOSTIC";
    clearBtn.addEventListener("click", () => {
      playSound("click");
      currentRndInput = ["", ""];
      document.getElementById("fault-slot-text-0").textContent = "[VACANT - TAP CHOSEN UNIT]";
      document.getElementById("fault-slot-text-0").style.color = "var(--text-muted)";
      document.getElementById("fault-slot-text-1").textContent = "[VACANT - TAP CHOSEN UNIT]";
      document.getElementById("fault-slot-text-1").style.color = "var(--text-muted)";
      
      document.querySelectorAll(".fault-step-node").forEach(n => n.classList.remove("active-step"));
      document.getElementById("fault-slot-container-0").classList.add("active-step");
      focusedInputId = 0;
      renderFaultPool();
    });
    poolContainer.appendChild(clearBtn);
  }
}

// ==========================================
// 9. ON-SCREEN CUSTOM KEYPAD HANDLING
// ==========================================

const keypadButtons = document.querySelectorAll(".keypad-btn");
keypadButtons.forEach(btn => {
  // Exclude action keys that are set individually
  if (!btn.classList.contains("action")) {
    btn.addEventListener("click", () => {
      if (focusedInputId === null) return;
      playSound("click");
      
      const char = btn.textContent;
      
      // Limit size of strings in instruments or squawk/frequencies
      if (activeKeypadBuffer.length >= 6) return;
      
      activeKeypadBuffer += char;
      updateFocusedInputWithValue(activeKeypadBuffer);
    });
  }
});

document.getElementById("keypad-back").addEventListener("click", () => {
  if (focusedInputId === null) return;
  playSound("click");
  activeKeypadBuffer = activeKeypadBuffer.slice(0, -1);
  updateFocusedInputWithValue(activeKeypadBuffer);
});

document.getElementById("keypad-clear").addEventListener("click", () => {
  if (focusedInputId === null) return;
  playSound("click");
  activeKeypadBuffer = "";
  updateFocusedInputWithValue("");
});

function handleKeypadConfirm() {
  if (focusedInputId === null) return;
  playSound("click");

  // Cupertino-Style Auto-Advance logic
  if (activeModule === "instruments") {
    const cards = Array.from(document.querySelectorAll("#instruments-grid-test .gauge-card"));
    const activeCard = document.querySelector(".gauge-card.active-step");
    if (activeCard) {
      const activeIdx = cards.indexOf(activeCard);
      let nextBlankCard = null;
      for (let i = 1; i < cards.length; i++) {
        const nextIdx = (activeIdx + i) % cards.length;
        const card = cards[nextIdx];
        const label = card.getAttribute("data-label");
        if (!currentRndInput[label]) {
          nextBlankCard = card;
          break;
        }
      }

      if (nextBlankCard) {
        setTimeout(() => { nextBlankCard.click(); }, 150);
        return;
      }

      // All gauges filled — pulse the submit button
      const submitBtn = document.getElementById("btn-submit-test");
      submitBtn.classList.add("submit-ready");
      setTimeout(() => submitBtn.classList.remove("submit-ready"), 700);
    }
  } else if (activeModule === "atc") {
    if (focusedInputId === "freq") {
      const nextEl = document.getElementById("atc-input-squawk");
      if (nextEl) {
        setTimeout(() => { nextEl.click(); }, 150);
        return;
      }
    }
  }

  // Hide keypad and clear selection indicators
  document.getElementById("custom-keypad").style.display = "none";
  document.querySelectorAll(".gauge-card").forEach(c => c.classList.remove("active-step"));
  document.querySelectorAll(".input-terminal").forEach(i => i.classList.remove("active-input"));

  focusedInputId = null;
}

document.getElementById("keypad-enter").addEventListener("click", handleKeypadConfirm);

function updateFocusedInputWithValue(val) {
  document.getElementById("keypad-preview-value").textContent = val || "---";
  
  if (activeModule === "instruments") {
    currentRndInput[focusedInputId] = val;
    // Update blanked gauge overlay value dynamically!
    const activeGaugeCard = document.querySelector(`.gauge-card.active-step`);
    if (activeGaugeCard) {
      activeGaugeCard.querySelector(".gauge-value-display").textContent = val || "???";
    }
  } 
  else if (activeModule === "atc") {
    currentRndInput[focusedInputId] = val;
    const inputEl = document.getElementById(`atc-input-${focusedInputId}`);
    if (inputEl) inputEl.value = val;
  }
}

// ==========================================
// 10. GRADING & EVALUATION (RECALL AUDIT)
// ==========================================

function submitTelemetry() {
  if (studyTimer) clearInterval(studyTimer);
  
  // Evaluate answers
  let accuracy = 0;
  let addedPoints = 0;
  let breakdownRows = [];
  let discrepancyLogItem = null;
  
  if (activeModule === "checklist") {
    const expected = currentRndExpected.expected;
    const inputs = currentRndInput;
    
    let checklistErrors = 0;
    expected.forEach((step, idx) => {
      const userStep = inputs[idx] || "";
      const match = step === userStep;
      if (!match) checklistErrors++;
      
      breakdownRows.push({
        field: `Step ${idx + 1}`,
        expected: step,
        input: userStep || "[OMITTED]",
        correct: match
      });
    });
    
    const extraInputs = Math.max(0, inputs.length - expected.length);
    accuracy = FlightCore.checklistAccuracy(expected, inputs);
    discrepancyLogItem = checklistErrors > 0 || extraInputs > 0 ? `Checklist mismatch in ${currentRndExpected.title}` : null;
  } 
  else if (activeModule === "instruments") {
    const expected = currentRndExpected.expected;
    let gaugeErrors = 0;
    
    expected.forEach(g => {
      const userVal = parseFloat(currentRndInput[g.label]) || 0;
      const targetVal = parseFloat(g.val);
      const match = userVal === targetVal;
      if (!match) gaugeErrors++;
      
      breakdownRows.push({
        field: `${g.label} Dial`,
        expected: `${g.val} ${g.unit}`,
        input: currentRndInput[g.label] ? `${currentRndInput[g.label]} ${g.unit}` : "[BLANK]",
        correct: match
      });
    });
    
    accuracy = FlightCore.instrumentsAccuracy(expected, currentRndInput);
    discrepancyLogItem = gaugeErrors > 0 ? `Precision scanning recall mismatch` : null;
  } 
  else if (activeModule === "atc") {
    const exp = currentRndExpected.expected;
    const inp = currentRndInput;
    let atcErrors = 0;
    
    const fields = ["callsign", "facility", "freq", "squawk"];
    fields.forEach(f => {
      // Case insensitive trim check
      const expStr = String(exp[f]).trim().toUpperCase();
      const inpStr = String(inp[f]).trim().toUpperCase();
      const match = expStr === inpStr;
      if (!match) atcErrors++;
      
      breakdownRows.push({
        field: f.toUpperCase(),
        expected: exp[f],
        input: inp[f] || "[OMITTED]",
        correct: match
      });
    });
    
    accuracy = FlightCore.atcAccuracy(exp, inp);
    discrepancyLogItem = atcErrors > 0 ? `ATC retention discrepancy` : null;
  } 
  else if (activeModule === "fault") {
    const exp = currentRndExpected.expected; // [symptom, system, action]
    const systemMatch = currentRndInput[0] === exp[1];
    const actionMatch = currentRndInput[1] === exp[2];
    
    breakdownRows.push({
      field: "Symptom Logged",
      expected: exp[0],
      input: exp[0],
      correct: true
    });
    breakdownRows.push({
      field: "Fault Isolation",
      expected: exp[1],
      input: currentRndInput[0] || "[OMITTED]",
      correct: systemMatch
    });
    breakdownRows.push({
      field: "Mitigation Action",
      expected: exp[2],
      input: currentRndInput[1] || "[OMITTED]",
      correct: actionMatch
    });
    
    accuracy = FlightCore.faultAccuracy(exp, currentRndInput);
    discrepancyLogItem = accuracy < 100 ? `Diagnostic chain protocol failure` : null;
  }
  
  // Calculate scoring & tier
  let grade = "fail";
  if (accuracy === 100) {
    grade = "perfect";
    streak++;
    addedPoints = 1000 + (level * 200);
    
    // Speed bonus if skip study timer early
    const studyBonus = Math.round(studyDurationRemaining * 50);
    addedPoints += studyBonus;
    
    sessionScore += addedPoints;
    playSound("success");
    triggerHaptic("success");
    
    // Edge glow effect
    document.getElementById("main-viewport").className = "viewport-content screen-glow-success";
  } else if (accuracy >= 80) {
    grade = "good";
    streak++;
    const basePoints = 1000 + (level * 200);
    const studyBonus = Math.round(studyDurationRemaining * 50);
    addedPoints = Math.round((basePoints + studyBonus) * (accuracy / 100));
    
    sessionScore += addedPoints;
    playSound("success");
    triggerHaptic("success");
    
    // Edge glow effect
    document.getElementById("main-viewport").className = "viewport-content screen-glow-success";
  } else if (accuracy >= 50) {
    grade = "partial";
    // Streak persists intact (streak remains unchanged)
    const basePoints = 1000 + (level * 200);
    const studyBonus = Math.round(studyDurationRemaining * 50);
    addedPoints = Math.round((basePoints + studyBonus) * (accuracy / 100));
    
    sessionScore += addedPoints;
    playSound("success");
    triggerHaptic("warning");
    
    // Edge glow effect
    document.getElementById("main-viewport").className = "viewport-content screen-glow-warning";
  } else {
    grade = "fail";
    streak = 0;
    playSound("error");
    triggerHaptic("error");
    
    // Edge glow effect
    document.getElementById("main-viewport").className = "viewport-content screen-glow-error";
  }
  
  // Update session max streak
  sessionMaxStreak = Math.max(sessionMaxStreak, streak);
  
  // Save round result
  const rndResult = {
    round: sessionRound,
    module: activeModule,
    score: addedPoints,
    correct: accuracy === 100, // exact 100% correct
    accuracy: accuracy,
    grade: grade,
    breakdown: breakdownRows,
    blindspot: discrepancyLogItem
  };
  roundByRoundHistory.push(rndResult);
  Telemetry.emit("module_completed", {
    round: sessionRound,
    module: activeModule,
    grade,
    accuracy,
    score: addedPoints,
    streak,
    level
  });
  if (streak > 0 && streak === sessionMaxStreak) {
    Telemetry.emit("streak_extended", { streak, round: sessionRound, module: activeModule });
  }
  
  // Display immediate feedback screen
  setupFeedbackScreen(rndResult);
  showScreen("screen-feedback");
  
  setTimeout(() => {
    document.getElementById("main-viewport").className = "viewport-content";
  }, 1200);
}

function setupFeedbackScreen(res) {
  const ratingEl = document.getElementById("feedback-verdict-rating");
  const verdictCard = document.getElementById("feedback-verdict-card");
  const scoreAdded = document.getElementById("feedback-score-added");
  
  if (res.grade === "perfect") {
    ratingEl.textContent = "PERFECT SUCCESS";
    ratingEl.className = "debrief-rating ace";
    verdictCard.style.borderColor = "var(--success-border)";
    verdictCard.style.backgroundColor = "var(--success-bg)";
    scoreAdded.textContent = `+${res.score.toLocaleString()} PTS (STREAK INCREMENTED)`;
  } else if (res.grade === "good") {
    ratingEl.textContent = `GREAT RECALL (${res.accuracy}%)`;
    ratingEl.className = "debrief-rating ace";
    verdictCard.style.borderColor = "var(--success-border)";
    verdictCard.style.backgroundColor = "var(--success-bg)";
    scoreAdded.textContent = `+${res.score.toLocaleString()} PTS (STREAK INCREMENTED!)`;
  } else if (res.grade === "partial") {
    ratingEl.textContent = `PARTIAL SUCCESS (${res.accuracy}%)`;
    ratingEl.className = "debrief-rating warning";
    verdictCard.style.borderColor = "var(--warning-border)";
    verdictCard.style.backgroundColor = "var(--warning-bg)";
    scoreAdded.textContent = `+${res.score.toLocaleString()} PTS (STREAK SAVED!)`;
  } else {
    ratingEl.textContent = `FAILED (${res.accuracy}%)`;
    ratingEl.className = "debrief-rating missed";
    verdictCard.style.borderColor = "var(--error-border)";
    verdictCard.style.backgroundColor = "var(--error-bg)";
    scoreAdded.textContent = "+0 PTS (STREAK RESET)";
  }
  
  // Render expected vs input table items
  const detailsList = document.getElementById("feedback-details-list");
  detailsList.innerHTML = "";
  
  res.breakdown.forEach(row => {
    const item = document.createElement("div");
    item.className = "feedback-row " + (row.correct ? "correct" : "incorrect");
    
    item.innerHTML = `
      <span class="feedback-field">${escapeHTML(row.field)}</span>
      <div class="feedback-values">
        <span class="val-expected">EXP: ${escapeHTML(row.expected)}</span>
        <span class="val-input ${row.correct ? '' : 'error'}">INP: ${escapeHTML(row.input)}</span>
      </div>
    `;
    detailsList.appendChild(item);
  });
}

// Proceed loop
document.getElementById("btn-next-round").addEventListener("click", () => {
  playSound("click");
  if (sessionRound < sessionLength) {
    startRound();
  } else {
    finishSession();
  }
});

// Skip timer button
document.getElementById("btn-skip-timer").addEventListener("click", commenceTest);

// Submit test button
document.getElementById("btn-submit-test").addEventListener("click", submitTelemetry);

// ==========================================
// 11. DEBRIEFING & HISTORICAL PERFORMANCE
// ==========================================

function finishSession() {
  if (roundByRoundHistory.length === 0) return;
  const percentage = FlightCore.sessionGrade(roundByRoundHistory);
  const tierInfo = FlightCore.sessionTier(percentage);

  if (tierInfo.celebration === "full") launchConfetti();
  else if (tierInfo.celebration === "mini") launchMiniConfetti();

  document.getElementById("debrief-score").textContent = sessionScore.toLocaleString();
  document.getElementById("debrief-percentage").textContent = `${percentage}% ACCURACY`;

  const ratingLabel = document.getElementById("debrief-rating-label");
  ratingLabel.textContent = tierInfo.label;
  ratingLabel.className = "debrief-rating " + tierInfo.className;

  const tbody = document.getElementById("debrief-table-rows");
  tbody.innerHTML = "";
  const bestScore = Math.max(...roundByRoundHistory.map(r => r.score));

  roundByRoundHistory.forEach(r => {
    const tr = document.createElement("tr");
    let resultText = "MISS";
    let resultColor = "var(--error-rose)";

    if (r.grade === "perfect") {
      resultText = "PERFECT";
      resultColor = "var(--success-emerald)";
    } else if (r.grade === "good") {
      resultText = `GREAT (${r.accuracy}%)`;
      resultColor = "var(--success-emerald)";
    } else if (r.grade === "partial") {
      tr.className = "warning-row";
      resultText = `PARTIAL (${r.accuracy}%)`;
      resultColor = "var(--accent-amber)";
    } else {
      tr.className = "incorrect-row";
      resultText = `MISS (${r.accuracy}%)`;
      resultColor = "var(--error-rose)";
    }

    if (r.score === bestScore && bestScore > 0) tr.classList.add("best-round");

    tr.innerHTML = `
      <td>${String(r.round).padStart(2, "0")}</td>
      <td>${r.module.toUpperCase()}</td>
      <td style="font-weight:bold; color:${resultColor}">${resultText}</td>
      <td>${r.score.toLocaleString()}</td>
    `;
    tbody.appendChild(tr);
  });

  const blindspots = roundByRoundHistory.filter(r => !r.correct && r.blindspot).map(r => r.blindspot);
  const blindspotCard = document.getElementById("debrief-blindspots");
  const blindspotList = document.getElementById("debrief-blindspot-list");

  if (blindspots.length > 0) {
    blindspotCard.style.display = "block";
    blindspotList.innerHTML = "";
    [...new Set(blindspots)].forEach(b => {
      const li = document.createElement("li");
      li.textContent = b;
      blindspotList.appendChild(li);
    });
  } else {
    blindspotCard.style.display = "none";
  }

  const compsData = FlightCore.sessionCompetencies(roundByRoundHistory, percentage);
  const moduleAccuracy = FlightCore.sessionModuleAccuracy(roundByRoundHistory);

  const todayStr = new Date().toDateString();
  const lastPlayedStr = localStorage.getItem("flightcore_last_played") || localStorage.getItem("flightcore_last_trained");
  dailyStreak = FlightCore.nextDailyStreak(lastPlayedStr, dailyStreak, todayStr);
  safeStorageSet("flightcore_last_played", todayStr);
  safeStorageSet("flightcore_daily_streak", dailyStreak);

  const sessionRecord = {
    date: new Date().toISOString(),
    score: sessionScore,
    percentage: percentage,
    tier: tierInfo.label,
    maxLevel: level,
    maxStreak: sessionMaxStreak,
    competencies: compsData,
    moduleAccuracy: moduleAccuracy
  };

  const previousBest = globalHistory.length > 0 ? Math.max(...globalHistory.map(h => h.percentage)) : -1;
  globalHistory.push(sessionRecord);
  if (globalHistory.length > 30) globalHistory.shift();
  safeStorageSet("flightcore_history", JSON.stringify(globalHistory));

  Telemetry.emit("session_finished", { rounds: roundByRoundHistory.length, score: sessionScore, accuracy: percentage, tier: tierInfo.label, maxStreak: sessionMaxStreak });
  showScreen("screen-debrief");
  if (percentage > previousBest && previousBest >= 0) showPersonalBestBanner();
}

function launchConfetti() {
  const debriefScreen = document.getElementById("screen-debrief");
  if (!debriefScreen) return;

  const container = document.createElement("div");
  container.className = "confetti-container";
  debriefScreen.appendChild(container);

  const colors = [
    "var(--accent-blue)",
    "var(--accent-amber)",
    "var(--success-emerald)",
    "var(--error-rose)",
    "#A54657",
    "#FFD700",
    "#70E000",
    "#4895EF"
  ];

  for (let i = 0; i < 70; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    
    const color = colors[Math.floor(Math.random() * colors.length)];
    const left = Math.random() * 100;
    const sizeWidth = Math.floor(Math.random() * 6) + 6;
    const sizeHeight = Math.floor(Math.random() * 6) + 6;
    const animDelay = Math.random() * 2.5;
    const animDuration = Math.random() * 1.5 + 2.0;
    
    piece.style.backgroundColor = color;
    piece.style.left = `${left}%`;
    piece.style.width = `${sizeWidth}px`;
    piece.style.height = `${sizeHeight}px`;
    piece.style.animationDelay = `${animDelay}s`;
    piece.style.animationDuration = `${animDuration}s`;
    
    const initialRot = Math.random() * 360;
    piece.style.transform = `rotate(${initialRot}deg)`;

    container.appendChild(piece);
  }

  playSound("success");

  setTimeout(() => {
    container.remove();
  }, 5000);
}

function launchMiniConfetti() {
  const debriefScreen = document.getElementById("screen-debrief");
  if (!debriefScreen) return;
  const container = document.createElement("div");
  container.className = "confetti-container";
  debriefScreen.appendChild(container);
  const colors = ["var(--accent-blue)", "var(--success-emerald)", "var(--accent-amber)"];
  for (let i = 0; i < 25; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.width = `${Math.floor(Math.random() * 4) + 4}px`;
    piece.style.height = `${Math.floor(Math.random() * 4) + 4}px`;
    piece.style.animationDelay = `${Math.random() * 1.5}s`;
    piece.style.animationDuration = `${Math.random() * 1.2 + 1.8}s`;
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    container.appendChild(piece);
  }
  setTimeout(() => container.remove(), 4000);
}

function showPersonalBestBanner() {
  const debriefScreen = document.getElementById("screen-debrief");
  if (!debriefScreen) return;
  const banner = document.createElement("div");
  banner.className = "pb-banner";
  banner.textContent = "NEW PERSONAL BEST";
  debriefScreen.insertBefore(banner, debriefScreen.firstChild);
  setTimeout(() => banner.remove(), 3000);
}

// Restart session trigger
document.getElementById("btn-restart").addEventListener("click", () => {
  playSound("click");
  initSession();
});

// Copy score card to clipboard
document.getElementById("btn-copy-score").addEventListener("click", () => {
  const scoreEl = document.getElementById("debrief-score");
  const pctEl = document.getElementById("debrief-percentage");
  const tierEl = document.getElementById("debrief-rating-label");

  const modLines = ["checklist", "instruments", "atc", "fault"].map(mod => {
    const rounds = roundByRoundHistory.filter(r => r.module === mod);
    if (rounds.length === 0) return null;
    const avg = Math.round(rounds.reduce((s, r) => s + r.accuracy, 0) / rounds.length);
    return `${mod.charAt(0).toUpperCase() + mod.slice(1)}: ${avg}%`;
  }).filter(Boolean);

  const text = [
    "✈ FLIGHT CORE — SESSION DEBRIEF",
    `Score: ${scoreEl ? scoreEl.textContent : "—"} | ${pctEl ? pctEl.textContent : "—"}`,
    `Tier: ${tierEl ? tierEl.textContent : "—"} | Streak: ${sessionMaxStreak} | Level: ${level}`,
    modLines.join(" | "),
    "flightcore.app"
  ].join("\n");

  const btn = document.getElementById("btn-copy-score");
  navigator.clipboard.writeText(text).then(() => {
    playSound("success");
    btn.textContent = "COPIED!";
    setTimeout(() => { btn.textContent = "COPY SCORE CARD"; }, 2000);
  }).catch(() => {
    btn.textContent = "COPY FAILED";
    setTimeout(() => { btn.textContent = "COPY SCORE CARD"; }, 2000);
  });
});

// Start Session Button
document.getElementById("btn-engage-session").addEventListener("click", () => {
  playSound("click");
  initSession();
});

function initSession() {
  sessionRound = 0;
  sessionScore = 0;
  streak = startingStreak;
  level = FlightCore.computeLevel(streak);
  sessionMaxStreak = 0;
  activeModule = null;
  recentlyPlayedModules = [];
  roundByRoundHistory = [];
  usedFaultIndices = [];
  usedChecklistIndices = [];
  usedATCIndices = { callsigns: new Set(), facilities: new Set(), frequencies: new Set(), squawks: new Set() };

  Telemetry.emit("session_started", {
    sessionLength,
    startingStreak,
    timerMultiplier,
    selectedModules: selectedModules.slice()
  });
  startRound();
}

// ==========================================
// 12. RUNS HISTORY Sparkline Chart (Pure Text Session History)
// ==========================================

function renderHistoryChart() {
  const chartWrapper = document.getElementById("history-chart");
  const sideWrapper = document.getElementById("sidebar-chart");
  chartWrapper.innerHTML = "";
  if (sideWrapper) sideWrapper.innerHTML = "";
  
  if (globalHistory.length === 0) {
    const createDummyChartHTML = () => `
      <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; overflow: hidden; padding: 4px;">
        <!-- Background Mockup SVG -->
        <svg width="100%" height="80" viewBox="0 0 300 80" preserveAspectRatio="none" style="opacity: 0.15; filter: blur(0.5px);">
          <defs>
            <linearGradient id="dummy-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="var(--accent-blue)" stop-opacity="0.8"/>
              <stop offset="100%" stop-color="var(--accent-blue)" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <!-- Grid Lines -->
          <line x1="0" y1="16" x2="300" y2="16" stroke="var(--text-muted)" stroke-width="0.5" stroke-dasharray="3,3" opacity="0.3"/>
          <line x1="0" y1="40" x2="300" y2="40" stroke="var(--text-muted)" stroke-width="0.5" stroke-dasharray="3,3" opacity="0.3"/>
          <line x1="0" y1="64" x2="300" y2="64" stroke="var(--text-muted)" stroke-width="0.5" stroke-dasharray="3,3" opacity="0.3"/>
          
          <!-- Mockup Bars -->
          <rect x="20" y="45" width="14" height="25" rx="3" fill="url(#dummy-grad)"/>
          <rect x="60" y="30" width="14" height="40" rx="3" fill="url(#dummy-grad)"/>
          <rect x="100" y="50" width="14" height="20" rx="3" fill="url(#dummy-grad)"/>
          <rect x="140" y="20" width="14" height="50" rx="3" fill="url(#dummy-grad)"/>
          <rect x="180" y="35" width="14" height="35" rx="3" fill="url(#dummy-grad)"/>
          <rect x="220" y="15" width="14" height="55" rx="3" fill="url(#dummy-grad)"/>
          <rect x="260" y="25" width="14" height="45" rx="3" fill="url(#dummy-grad)"/>
          
          <!-- Trend line -->
          <path d="M 27 45 L 67 30 L 107 50 L 147 20 L 187 35 L 227 15 L 267 25" fill="none" stroke="var(--accent-blue)" stroke-width="1.5" stroke-dasharray="4,2" opacity="0.4"/>
        </svg>
        
        <!-- Foreground Alert Badge -->
        <div style="position: absolute; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; padding: 10px 14px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); box-shadow: 0 4px 20px rgba(0,0,0,0.3); text-align: center; max-width: 90%;">
          <span style="font-size: 0.58rem; font-weight: 800; color: var(--text-muted); letter-spacing: 0.8px; text-transform: uppercase;">NO RECORDED RUNS</span>
          <span style="font-size: 0.52rem; color: var(--text-muted); font-weight: 500;">Complete a session to plot telemetry trends</span>
        </div>
      </div>
    `;
    
    chartWrapper.innerHTML = createDummyChartHTML();
    if (sideWrapper) {
      sideWrapper.innerHTML = createDummyChartHTML();
    }
    return;
  }
  
  // Real Chart populated state — show last 15 sessions
  const recent = globalHistory.slice(-15);
  
  const createRealChartHTML = (widthPercent = "100%") => {
    // Generate coordinate mapping
    // X goes from 20 to 280 across a 300px viewBox
    // Y goes from 12 (100% accuracy) to 58 (0% accuracy)
    const points = recent.map((h, idx) => {
      // Center a lone data point instead of pinning it to the left edge
      const x = recent.length === 1 ? 150 : 20 + idx * (260 / (recent.length - 1));
      const y = 58 - (h.percentage / 100) * 46;
      return { x, y, percentage: h.percentage, date: new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), score: h.score };
    });
    
    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      pathD += ` L ${points[i].x} ${points[i].y}`;
    }
    
    let areaD = `${pathD} L ${points[points.length - 1].x} 60 L ${points[0].x} 60 Z`;
    
    // Draw dots and labels
    let dotsHTML = "";
    let labelsHTML = "";
    
    points.forEach((pt) => {
      dotsHTML += `
        <circle cx="${pt.x}" cy="${pt.y}" r="3.5" fill="var(--bg-dark)" stroke="var(--accent-blue)" stroke-width="2" />
      `;
      
      // Render text value (accuracy %) above/below the dot
      const isAbove = pt.y > 35;
      const textY = isAbove ? pt.y - 7 : pt.y + 12;
      labelsHTML += `
        <text x="${pt.x}" y="${textY}" font-family="var(--font-sans)" font-size="7" font-weight="700" fill="var(--text-primary)" text-anchor="middle">${pt.percentage}%</text>
        <text x="${pt.x}" y="74" font-family="var(--font-sans)" font-size="5.5" font-weight="600" fill="var(--text-muted)" text-anchor="middle">${pt.date}</text>
      `;
    });
    
    return `
      <svg width="${widthPercent}" height="100%" viewBox="0 0 300 80" style="overflow: visible;">
        <defs>
          <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--accent-blue)" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="var(--accent-blue)" stop-opacity="0"/>
          </linearGradient>
        </defs>
        
        <!-- Grid Lines -->
        <line x1="10" y1="12" x2="290" y2="12" stroke="var(--border-subtle)" stroke-width="0.75" stroke-dasharray="3,3" />
        <line x1="10" y1="35" x2="290" y2="35" stroke="var(--border-subtle)" stroke-width="0.5" stroke-dasharray="3,3" opacity="0.6" />
        <line x1="10" y1="58" x2="290" y2="58" stroke="var(--border-subtle)" stroke-width="0.75" stroke-dasharray="3,3" />
        
        <!-- Area path -->
        <path d="${areaD}" fill="url(#chart-area-grad)" />
        
        <!-- Stroke path -->
        <path d="${pathD}" fill="none" stroke="var(--accent-blue)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        
        <!-- Dots -->
        ${dotsHTML}
        
        <!-- Labels -->
        ${labelsHTML}
      </svg>
    `;
  };
  
  chartWrapper.innerHTML = createRealChartHTML("100%");
  if (sideWrapper) {
    sideWrapper.innerHTML = createRealChartHTML("100%");
  }
}

// Initial Home Screen Stats Render
function renderPlayCalendar() {
  const grid = document.getElementById("play-calendar");
  if (!grid) return;

  const playedDates = {};
  globalHistory.forEach(h => {
    const d = h.date ? h.date.slice(0, 10) : null;
    if (!d) return;
    if (!playedDates[d] || h.percentage > playedDates[d]) {
      playedDates[d] = h.percentage;
    }
  });

  grid.innerHTML = "";
  const today = new Date();
  // Render last 28 days, oldest first
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const pct = playedDates[key];
    const cell = document.createElement("div");
    cell.className = "calendar-cell";
    cell.title = `${key}${pct !== undefined ? `: ${pct}%` : ""}`;

    if (i === 0) cell.classList.add("today");

    if (pct !== undefined) {
      if (pct >= 90) cell.classList.add("cal-ace");
      else if (pct >= 75) cell.classList.add("cal-sharp");
      else if (pct >= 50) cell.classList.add("cal-steady");
      else cell.classList.add("cal-missed");
    }
    grid.appendChild(cell);
  }
}

function initHistoryTabs() {
  const tabs = document.querySelectorAll(".history-tab");
  const panelChart = document.getElementById("history-panel-chart");
  const panelCal = document.getElementById("history-panel-calendar");
  const label = document.getElementById("history-tab-label");
  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      playSound("click");
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      const which = tab.getAttribute("data-tab");
      if (which === "chart") {
        panelChart.style.display = "";
        panelCal.style.display = "none";
        if (label) label.textContent = "Last 15";
      } else {
        panelChart.style.display = "none";
        panelCal.style.display = "";
        if (label) label.textContent = "28 Days";
        renderPlayCalendar();
      }
    });
  });
}

function renderModuleStats() {
  const container = document.getElementById("module-stats-bars");
  if (!container) return;

  const recent = globalHistory.slice(-10);
  const modules = [
    { key: "checklist", label: "Checklist" },
    { key: "instruments", label: "Instruments" },
    { key: "atc", label: "ATC" },
    { key: "fault", label: "Fault" }
  ];

  // Check if any session has moduleAccuracy data
  const hasData = recent.some(h => h.moduleAccuracy);
  if (!hasData) {
    container.innerHTML = `<div style="font-size: 0.65rem; color: var(--text-muted); text-align: center;">COMPLETE A SESSION TO SEE TRENDS</div>`;
    return;
  }

  container.innerHTML = "";
  modules.forEach(({ key, label }) => {
    const sessionsWithMod = recent.filter(h => h.moduleAccuracy && h.moduleAccuracy[key] !== undefined);
    if (sessionsWithMod.length === 0) return;
    const avg = Math.round(sessionsWithMod.reduce((s, h) => s + h.moduleAccuracy[key], 0) / sessionsWithMod.length);
    const color = avg >= 80 ? "var(--success-emerald)" : avg >= 50 ? "var(--accent-amber)" : "var(--error-rose)";

    const row = document.createElement("div");
    row.className = "module-stat-row";
    row.innerHTML = `
      <span class="module-stat-label">${label}</span>
      <div class="module-stat-track">
        <div class="module-stat-fill" style="width: ${avg}%; background: ${color};"></div>
      </div>
      <span class="module-stat-pct">${avg}%</span>
    `;
    container.appendChild(row);
  });
}

function loadHomeStats() {
  if (globalHistory.length > 0) {
    const scores = globalHistory.map(h => h.score);
    const percentages = globalHistory.map(h => h.percentage);
    const maxScore = Math.max(...scores);
    const averageGrade = Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length);
    const totalRuns = globalHistory.length;
    
    // Max level achieved
    const maxLv = Math.max(...globalHistory.map(h => h.maxLevel || 1));
    const maxStreakAchieved = Math.max(...globalHistory.map(h => h.maxStreak || 0));
    
    document.getElementById("stat-high-score").textContent = maxScore.toLocaleString();
    document.getElementById("stat-avg-score").textContent = `${averageGrade}%`;
    document.getElementById("stat-sessions").textContent = totalRuns;
    document.getElementById("stat-max-streak").textContent = maxStreakAchieved;

    // Update side panel stats
    const sideHighScore = document.getElementById("side-stat-high-score");
    const sideAvgScore = document.getElementById("side-stat-avg-score");
    if (sideHighScore) sideHighScore.textContent = maxScore.toLocaleString();
    if (sideAvgScore) sideAvgScore.textContent = `${averageGrade}%`;

    const sideSessions = document.getElementById("side-stat-sessions");
    const sideMaxStreak = document.getElementById("side-stat-max-streak");
    if (sideSessions) sideSessions.textContent = totalRuns;
    if (sideMaxStreak) sideMaxStreak.textContent = maxStreakAchieved;
  } else {
    document.getElementById("stat-high-score").textContent = "0";
    document.getElementById("stat-avg-score").textContent = "0.0%";
    document.getElementById("stat-sessions").textContent = "0";
    document.getElementById("stat-max-streak").textContent = "0";

    const sideHighScore = document.getElementById("side-stat-high-score");
    const sideAvgScore = document.getElementById("side-stat-avg-score");
    if (sideHighScore) sideHighScore.textContent = "0";
    if (sideAvgScore) sideAvgScore.textContent = "0.0%";

    const sideSessions = document.getElementById("side-stat-sessions");
    const sideMaxStreak = document.getElementById("side-stat-max-streak");
    if (sideSessions) sideSessions.textContent = "0";
    if (sideMaxStreak) sideMaxStreak.textContent = "0";
  }

  const dailyStreakEl = document.getElementById("stat-daily-streak");
  if (dailyStreakEl) dailyStreakEl.textContent = dailyStreak;

  const sideDailyStreakEl = document.getElementById("side-stat-daily-streak");
  if (sideDailyStreakEl) sideDailyStreakEl.textContent = dailyStreak;

  renderHistoryChart();
  renderModuleStats();
  renderRoundStepTracker();
}

// ==========================================
// SESSION ABORT SYSTEM & UTILS
// ==========================================
function updateHeaderControls(screenId) {
  const abortBtn = document.getElementById("btn-session-abort");
  const systemStatus = document.getElementById("system-status");
  
  if (screenId === "screen-study" || screenId === "screen-test" || screenId === "screen-feedback") {
    abortBtn.style.display = "inline-flex";
    systemStatus.style.display = "none";
  } else {
    abortBtn.style.display = "none";
    systemStatus.style.display = "block";
  }
}

function showAbortConfirm() {
  playSound("click");
  isTimerPaused = true;
  document.getElementById("abort-confirm-overlay").style.display = "flex";
}

function hideAbortConfirm() {
  playSound("click");
  isTimerPaused = false;
  document.getElementById("abort-confirm-overlay").style.display = "none";
}

function abortSession() {
  playSound("click");
  if (studyTimer) clearInterval(studyTimer);
  isTimerPaused = false;
  
  document.getElementById("abort-confirm-overlay").style.display = "none";
  
  sessionRound = 0;
  sessionScore = 0;
  streak = 0;
  level = 1;
  recentlyPlayedModules = [];
  
  showScreen("screen-home");
}

function returnToHomeFromDebrief() {
  playSound("click");
  sessionRound = 0;
  sessionScore = 0;
  streak = 0;
  level = 1;
  recentlyPlayedModules = [];
  loadHomeStats();
  showScreen("screen-home");
}

function initAbortSystem() {
  const btnAbort = document.getElementById("btn-session-abort");
  if (btnAbort) {
    btnAbort.addEventListener("click", showAbortConfirm);
  }
  
  const btnConfirm = document.getElementById("btn-abort-confirm");
  if (btnConfirm) {
    btnConfirm.addEventListener("click", abortSession);
  }
  
  const btnCancel = document.getElementById("btn-abort-cancel");
  if (btnCancel) {
    btnCancel.addEventListener("click", hideAbortConfirm);
  }
  
  const btnRestart = document.getElementById("btn-abort-restart");
  if (btnRestart) {
    btnRestart.addEventListener("click", () => {
      playSound("click");
      if (studyTimer) clearInterval(studyTimer);
      isTimerPaused = false;
      document.getElementById("abort-confirm-overlay").style.display = "none";
      initSession();
    });
  }
  
  const btnDebriefHome = document.getElementById("btn-debrief-home");
  if (btnDebriefHome) {
    btnDebriefHome.addEventListener("click", returnToHomeFromDebrief);
  }
  
  const overlay = document.getElementById("abort-confirm-overlay");
  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        hideAbortConfirm();
      }
    });
  }
}

// ==========================================
// 13. MULTI-THEME SYSTEM (Apple Aesthetics)
// ==========================================
function initThemeSystem() {
  const VALID_THEMES = ["dark", "light", "mono", "sage", "warm"];
  let savedTheme = localStorage.getItem("flightcore_theme");
  if (!savedTheme || !VALID_THEMES.includes(savedTheme)) {
    // Respect OS preference on first visit
    savedTheme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  setTheme(savedTheme);
  
  // Bind toggle button to show selector
  const btnToggle = document.getElementById("btn-theme-toggle");
  if (btnToggle) {
    btnToggle.addEventListener("click", () => {
      playSound("click");
      document.getElementById("theme-selector-overlay").style.display = "flex";
    });
  }
  
  // Bind close button to hide selector
  const btnClose = document.getElementById("btn-theme-close");
  if (btnClose) {
    btnClose.addEventListener("click", () => {
      playSound("click");
      document.getElementById("theme-selector-overlay").style.display = "none";
    });
  }
  
  // Close overlay on click outside card
  const overlay = document.getElementById("theme-selector-overlay");
  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        playSound("click");
        overlay.style.display = "none";
      }
    });
  }
  
  // Bind option buttons
  const optButtons = document.querySelectorAll(".theme-opt-btn");
  optButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const themeVal = btn.getAttribute("data-theme-val");
      playSound("click");
      setTheme(themeVal);
      overlay.style.display = "none";
    });
  });

  // Bind clear history button (2-step inline confirmation, no native dialog)
  const btnClearHistory = document.getElementById("btn-clear-history");
  const purgeConfirmRow = document.getElementById("purge-confirm-row");
  const btnPurgeCancel = document.getElementById("btn-purge-cancel");
  const btnPurgeConfirm = document.getElementById("btn-purge-confirm");

  if (btnClearHistory && purgeConfirmRow) {
    btnClearHistory.addEventListener("click", () => {
      playSound("click");
      purgeConfirmRow.style.display = "flex";
      purgeConfirmRow.style.flexDirection = "column";
      btnClearHistory.style.display = "none";
    });
  }

  if (btnPurgeCancel && purgeConfirmRow) {
    btnPurgeCancel.addEventListener("click", () => {
      playSound("click");
      purgeConfirmRow.style.display = "none";
      if (btnClearHistory) btnClearHistory.style.display = "";
    });
  }

  if (btnPurgeConfirm) {
    btnPurgeConfirm.addEventListener("click", () => {
      globalHistory = [];
      localStorage.removeItem("flightcore_history");
      localStorage.removeItem("flightcore_daily_streak");
      localStorage.removeItem("flightcore_last_trained");
      localStorage.removeItem("flightcore_last_played");
      dailyStreak = 0;
      playSound("error");
      loadHomeStats();
      if (purgeConfirmRow) purgeConfirmRow.style.display = "none";
      if (btnClearHistory) btnClearHistory.style.display = "";
      if (overlay) overlay.style.display = "none";
    });
  }
}

function setTheme(themeVal) {
  const VALID_THEMES = ["dark", "light", "mono", "sage", "warm"];
  if (!VALID_THEMES.includes(themeVal)) themeVal = "dark";
  document.body.setAttribute("data-theme", themeVal);
  safeStorageSet("flightcore_theme", themeVal);
  Telemetry.emit("settings_changed", { setting: "theme", value: themeVal });
  
  // Update active class in options
  const optButtons = document.querySelectorAll(".theme-opt-btn[data-theme-val]");
  optButtons.forEach(btn => {
    const isActive = btn.getAttribute("data-theme-val") === themeVal;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

// ==========================================
// 14. PHYSICAL KEYBOARD SUPPORT (PC Users)
// ==========================================
window.addEventListener("keydown", (e) => {
  // Ignore events when user is typing in standard unblocked text inputs
  if (e.target.tagName === "INPUT" && !e.target.readOnly) return;
  
  const key = e.key;
  
  // Global Escape handler for Abort overlay
  if (key === "Escape") {
    const confirmOverlay = document.getElementById("abort-confirm-overlay");
    if (confirmOverlay && confirmOverlay.style.display === "flex") {
      e.preventDefault();
      hideAbortConfirm();
      return;
    }
  }
  
  // Case 1: Active keypad/select input session
  // Fault uses focusedInputId to track the active slot (0/1) but shows no keypad,
  // so it must fall through to the test-screen shortcut handler in Case 2.
  if (focusedInputId !== null && activeModule !== "fault") {
    // Check if numeric field is currently focused
    const isNumericField = activeModule === "instruments" || 
      (activeModule === "atc" && (focusedInputId === "freq" || focusedInputId === "squawk"));
      
    if (isNumericField) {
      if (/^[0-9.]$/.test(key)) {
        e.preventDefault();
        
        // Context-aware decimal point restriction
        const isFloat = focusedInputId === "VIB" || focusedInputId === "BAT" || focusedInputId === "freq";
        if (key === "." && !isFloat) return;
        if (key === "." && activeKeypadBuffer.includes(".")) return;
        
        if (activeKeypadBuffer.length < 6) {
          playSound("click");
          activeKeypadBuffer += key;
          updateFocusedInputWithValue(activeKeypadBuffer);
        }
      } else if (key === "Backspace") {
        e.preventDefault();
        playSound("click");
        activeKeypadBuffer = activeKeypadBuffer.slice(0, -1);
        updateFocusedInputWithValue(activeKeypadBuffer);
      } else if (key === "Escape") {
        e.preventDefault();
        playSound("click");
        activeKeypadBuffer = "";
        updateFocusedInputWithValue("");
        // Close keypad & clear selection indicators
        document.getElementById("custom-keypad").style.display = "none";
        document.querySelectorAll(".gauge-card").forEach(c => c.classList.remove("active-step"));
        document.querySelectorAll(".input-terminal").forEach(i => i.classList.remove("active-input"));
        focusedInputId = null;
      } else if (key === "Enter") {
        e.preventDefault();
        handleKeypadConfirm();
      }
    } else {
      // Text quick-select options are active for ATC Callsign / Facility
      if (/^[1-4]$/.test(key)) {
        e.preventDefault();
        const optionBtns = document.querySelectorAll("#text-keypad-options .keypad-btn");
        const idx = parseInt(key) - 1;
        if (optionBtns[idx]) {
          optionBtns[idx].click();
        }
      } else if (key === "Escape" || key === "Enter") {
        e.preventDefault();
        playSound("click");
        // Close text selector
        document.getElementById("custom-text-keypad").style.display = "none";
        document.querySelectorAll(".input-terminal").forEach(i => i.classList.remove("active-input"));
        focusedInputId = null;
      }
    }
    return;
  }
  
  // Case 2: Global application flow hotkeys (Space / Enter / Escape abort)
  const activeScreen = document.querySelector(".screen-container.active");
  if (!activeScreen) return;
  
  // Custom Keyboard playability for each module in the Test screen
  if (activeScreen.id === "screen-test" && (focusedInputId === null || activeModule === "fault")) {
    if (activeModule === "checklist") {
      if (/^[1-9]$/.test(key)) {
        e.preventDefault();
        const poolItems = document.querySelectorAll("#checklist-pool .sortable-item");
        const idx = parseInt(key) - 1;
        if (poolItems[idx]) {
          poolItems[idx].click();
        }
      } else if (key === "Backspace") {
        // Find reset/undo button inside the pool
        const undoBtn = document.querySelector("#checklist-pool .btn-danger");
        if (undoBtn) {
          e.preventDefault();
          undoBtn.click();
        }
      }
    } 
    else if (activeModule === "fault") {
      if (/^[1-9]$/.test(key)) {
        e.preventDefault();
        const poolItems = document.querySelectorAll("#fault-pool .sortable-item");
        const idx = parseInt(key) - 1;
        if (poolItems[idx]) {
          poolItems[idx].click();
        }
      } else if (key === "Backspace") {
        // Find reset/clear button inside the pool
        const clearBtn = document.querySelector("#fault-pool .btn-danger");
        if (clearBtn) {
          e.preventDefault();
          clearBtn.click();
        }
      }
    }
    else if (activeModule === "instruments") {
      if (/^[1-8]$/.test(key)) {
        e.preventDefault();
        const cards = document.querySelectorAll("#instruments-grid-test .gauge-card");
        const idx = parseInt(key) - 1;
        if (cards[idx]) {
          cards[idx].click();
        }
      }
    }
    else if (activeModule === "atc") {
      if (/^[1-4]$/.test(key)) {
        e.preventDefault();
        const fields = ["callsign", "facility", "freq", "squawk"];
        const idx = parseInt(key) - 1;
        const el = document.getElementById(`atc-input-${fields[idx]}`);
        if (el) {
          el.click();
        }
      }
    }
  }
  
  if (key === "Escape") {
    const helpOverlay = document.getElementById("help-modal-overlay");
    if (helpOverlay && helpOverlay.style.display === "flex") {
      e.preventDefault();
      playSound("click");
      helpOverlay.style.display = "none";
      return;
    }
    const themeOverlay = document.getElementById("theme-selector-overlay");
    if (themeOverlay && themeOverlay.style.display === "flex") {
      e.preventDefault();
      playSound("click");
      themeOverlay.style.display = "none";
      return;
    }
    const confirmOverlay = document.getElementById("abort-confirm-overlay");
    if (confirmOverlay && confirmOverlay.style.display === "flex") {
      e.preventDefault();
      hideAbortConfirm();
      return;
    }
    
    if (activeScreen.id === "screen-study" || activeScreen.id === "screen-test" || activeScreen.id === "screen-feedback") {
      e.preventDefault();
      showAbortConfirm();
      return;
    }
  }
  
  if (key === "Enter" || key === " ") {
    const screenId = activeScreen.id;
    if (screenId === "screen-study" && key === " ") {
      e.preventDefault();
      toggleStudyPause();
      return;
    }
    
    e.preventDefault();
    if (screenId === "screen-home") {
      document.getElementById("btn-engage-session").click();
    } else if (screenId === "screen-study") {
      document.getElementById("btn-skip-timer").click();
    } else if (screenId === "screen-test") {
      document.getElementById("btn-submit-test").click();
    } else if (screenId === "screen-feedback") {
      document.getElementById("btn-next-round").click();
    } else if (screenId === "screen-debrief") {
      document.getElementById("btn-restart").click();
    }
  }

  if ((key === "c" || key === "C") && document.querySelector(".screen-container.active")?.id === "screen-debrief") {
    e.preventDefault();
    document.getElementById("btn-copy-score").click();
  }
});

function initOnboarding() {
  const overlay = document.getElementById("onboarding-overlay");
  const btn = document.getElementById("btn-onboarding-dismiss");
  if (!overlay || !btn) return;

  if (!localStorage.getItem("flightcore_onboarded")) {
    overlay.style.display = "flex";
  }

  btn.addEventListener("click", () => {
    playSound("click");
    overlay.style.display = "none";
    safeStorageSet("flightcore_onboarded", "true");
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      playSound("click");
      overlay.style.display = "none";
      safeStorageSet("flightcore_onboarded", "true");
    }
  });
}

function initDifficultySelector() {
  const buttons = document.querySelectorAll("#difficulty-selector .session-len-btn");
  const label = document.getElementById("difficulty-label");
  const names = { 0: "Novice", 4: "Standard", 8: "Advanced" };

  buttons.forEach(btn => {
    const val = parseInt(btn.getAttribute("data-streak"), 10);
    btn.classList.toggle("active", val === startingStreak);
  });
  if (label) label.textContent = names[startingStreak] || "Standard";

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      playSound("click");
      const val = parseInt(btn.getAttribute("data-streak"), 10);
      startingStreak = val;
      safeStorageSet("flightcore_starting_streak", val);
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      if (label) label.textContent = names[val] || "Standard";
    });
  });
}

function initTimerDurationSelector() {
  const buttons = document.querySelectorAll("#timer-duration-selector .session-len-btn");
  const label = document.getElementById("timer-duration-label");
  const names = { 1: "Standard", 1.5: "Relaxed", 2: "Extended" };

  buttons.forEach(btn => {
    const val = parseFloat(btn.getAttribute("data-multiplier"));
    btn.classList.toggle("active", val === timerMultiplier);
  });
  if (label) label.textContent = names[timerMultiplier] || "Standard";

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      playSound("click");
      const val = parseFloat(btn.getAttribute("data-multiplier"));
      timerMultiplier = val;
      safeStorageSet("flightcore_timer_multiplier", val);
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      if (label) label.textContent = names[val] || "Standard";
    });
  });
}

function initSessionLengthSelector() {
  const buttons = document.querySelectorAll("#session-length-selector .session-len-btn");
  const label = document.getElementById("session-length-label");

  // Restore saved selection
  buttons.forEach(btn => {
    const len = parseInt(btn.getAttribute("data-len"), 10);
    btn.classList.toggle("active", len === sessionLength);
  });
  if (label) label.textContent = `${sessionLength} Rounds`;

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      playSound("click");
      const len = parseInt(btn.getAttribute("data-len"), 10);
      sessionLength = len;
      safeStorageSet("flightcore_session_length", len);
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      if (label) label.textContent = `${len} Rounds`;
      renderRoundStepTracker();
    });
  });
}

function initModuleSelection() {
  const cards = document.querySelectorAll(".module-select-card");
  const allMods = ["checklist", "instruments", "atc", "fault"];

  cards.forEach(card => {
    card.addEventListener("click", () => {
      const mod = card.getAttribute("data-module");
      if (card.classList.contains("active")) {
        if (selectedModules.length <= 1) {
          card.classList.add("shake");
          triggerHaptic("error");
          setTimeout(() => card.classList.remove("shake"), 300);
          return;
        }
        card.classList.remove("active");
        selectedModules = selectedModules.filter(m => m !== mod);
      } else {
        card.classList.add("active");
        selectedModules.push(mod);
      }
      document.getElementById("modules-selected-count").textContent = `${selectedModules.length} Active`;
    });
  });

  // ALL toggle button
  const btnAll = document.getElementById("btn-select-all-modules");
  if (btnAll) {
    btnAll.addEventListener("click", () => {
      playSound("click");
      const allActive = allMods.every(m => selectedModules.includes(m));
      if (allActive) {
        // Leave only the first module active (can't go to 0)
        selectedModules = [allMods[0]];
        cards.forEach(c => {
          c.classList.toggle("active", c.getAttribute("data-module") === allMods[0]);
        });
      } else {
        selectedModules = [...allMods];
        cards.forEach(c => c.classList.add("active"));
      }
      document.getElementById("modules-selected-count").textContent = `${selectedModules.length} Active`;
    });
  }
}

function initHelpSystem() {
  const btnToggle = document.getElementById("btn-help-toggle");
  const btnClose = document.getElementById("btn-help-close");
  const overlay = document.getElementById("help-modal-overlay");

  if (btnToggle && overlay) {
    btnToggle.addEventListener("click", () => {
      playSound("click");
      overlay.style.display = "flex";
    });
  }

  if (btnClose && overlay) {
    btnClose.addEventListener("click", () => {
      playSound("click");
      overlay.style.display = "none";
    });
  }

  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        playSound("click");
        overlay.style.display = "none";
      }
    });
  }
}

function initTelemetryPreference() {
  const toggle = document.getElementById("toggle-telemetry");
  const status = document.getElementById("telemetry-status");
  if (!toggle) return;
  const configured = APP_CONFIG.TELEMETRY_ENABLED === true && Boolean(APP_CONFIG.TELEMETRY_ENDPOINT);
  toggle.disabled = !configured;
  toggle.checked = configured && Telemetry.isEnabled();
  if (status) status.textContent = configured ? "Anonymous events enabled when checked." : "Telemetry endpoint is not configured.";
  toggle.addEventListener("change", () => {
    Telemetry.setEnabled(toggle.checked);
    if (status) status.textContent = toggle.checked ? "Anonymous events enabled." : "Anonymous events disabled.";
  });
}
function initStudyPauseSystem() {
  const btnStudyPause = document.getElementById("btn-study-pause");
  if (btnStudyPause) {
    btnStudyPause.addEventListener("click", toggleStudyPause);
  }
}

function toggleStudyPause() {
  const activeScreen = document.querySelector(".screen-container.active");
  if (activeScreen && activeScreen.id === "screen-study") {
    isTimerPaused = !isTimerPaused;
    const pauseIcon = document.getElementById("study-pause-icon");
    const pausedOverlay = document.getElementById("paused-overlay");

    if (isTimerPaused) {
      pauseStart = Date.now();
      playSound("click");
      if (pauseIcon) {
        pauseIcon.innerHTML = `<polygon points="6,4 20,12 6,20" />`;
      }
      if (pausedOverlay) {
        pausedOverlay.style.display = "flex";
      }
    } else {
      if (pauseStart > 0) {
        pausedAccum += Date.now() - pauseStart;
        pauseStart = 0;
      }
      playSound("click");
      if (pauseIcon) {
        pauseIcon.innerHTML = `
          <rect x="6" y="4" width="4" height="16"></rect>
          <rect x="14" y="4" width="4" height="16"></rect>
        `;
      }
      if (pausedOverlay) {
        pausedOverlay.style.display = "none";
      }
    }
  }
}

// ==========================================
// 15. MODAL ACCESSIBILITY (focus trap + restore)
// ==========================================
// Centralised so the many existing `style.display` toggles need no changes:
// a MutationObserver detects each dialog showing/hiding and manages focus.
function initModalA11y() {
  const MODAL_IDS = [
    "theme-selector-overlay",
    "help-modal-overlay",
    "abort-confirm-overlay",
    "onboarding-overlay"
  ];
  const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  let lastFocused = null;

  const isVisible = (el) => el && el.style.display !== "none" && el.style.display !== "";
  const focusablesIn = (modal) =>
    Array.from(modal.querySelectorAll(FOCUSABLE)).filter(el => el.offsetParent !== null);

  MODAL_IDS.forEach(id => {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");

    const observer = new MutationObserver(() => {
      const visible = isVisible(modal);
      if (visible && !modal.dataset.trapActive) {
        modal.dataset.trapActive = "1";
        lastFocused = document.activeElement;
        const focusables = focusablesIn(modal);
        if (focusables.length) focusables[0].focus();
      } else if (!visible && modal.dataset.trapActive) {
        delete modal.dataset.trapActive;
        if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
        lastFocused = null;
      }
    });
    observer.observe(modal, { attributes: true, attributeFilter: ["style"] });
  });

  // Keep Tab focus cycling within the currently open dialog
  window.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    const modal = MODAL_IDS.map(id => document.getElementById(id)).find(isVisible);
    if (!modal) return;
    const focusables = focusablesIn(modal);
    if (!focusables.length) { e.preventDefault(); return; }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (!modal.contains(document.activeElement)) {
      e.preventDefault();
      first.focus();
    } else if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
}

// Bootstrap application on DOM ready
window.addEventListener("DOMContentLoaded", () => {
  // Bind error boundary recovery buttons
  const btnReload = document.getElementById("btn-error-reload");
  if (btnReload) {
    btnReload.addEventListener("click", () => {
      window.location.reload();
    });
  }
  const btnReset = document.getElementById("btn-error-reset");
  if (btnReset) {
    btnReset.addEventListener("click", () => {
      try {
        localStorage.clear();
        window.location.reload();
      } catch (err) {
        alert("Failed to clear local storage: " + err.message);
      }
    });
  }

  initThemeSystem();
  initSegmentControl();
  loadHomeStats();
  initModuleSelection();
  initSessionLengthSelector();
  initDifficultySelector();
  initTimerDurationSelector();
  initHistoryTabs();
  initAbortSystem();
  initHelpSystem();
  initStudyPauseSystem();
  initModalA11y();
  initOnboarding();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
});

function initSegmentControl() {
  const btnDeck = document.getElementById("segment-btn-deck");
  const btnLogbook = document.getElementById("segment-btn-logbook");
  const contentDeck = document.getElementById("segment-content-deck");
  const contentLogbook = document.getElementById("segment-content-logbook");
  
  if (btnDeck && btnLogbook && contentDeck && contentLogbook) {
    const setActivePanel = (showHistory) => {
      btnDeck.classList.toggle("active", !showHistory);
      btnLogbook.classList.toggle("active", showHistory);
      btnDeck.setAttribute("aria-selected", showHistory ? "false" : "true");
      btnLogbook.setAttribute("aria-selected", showHistory ? "true" : "false");
      contentDeck.style.display = showHistory ? "none" : "flex";
      contentLogbook.style.display = showHistory ? "flex" : "none";
    };

    btnDeck.addEventListener("click", () => {
      playSound("click");
      setActivePanel(false);
    });
    
    btnLogbook.addEventListener("click", () => {
      playSound("click");
      setActivePanel(true);
      renderRunHistory();
    });
  }
}

function renderRunHistory() {
  const totalRuns = globalHistory.length;
  
  // Log summary elements
  document.getElementById("log-stat-runs").textContent = totalRuns;
  
  if (totalRuns === 0) {
    document.getElementById("log-stat-high").textContent = "0";
    document.getElementById("log-stat-avg").textContent = "0%";
    document.getElementById("log-stat-streak").textContent = "0";
    
    document.getElementById("competency-val-checklist").textContent = "0%";
    document.getElementById("competency-fill-checklist").style.width = "0%";
    
    document.getElementById("competency-val-instruments").textContent = "0%";
    document.getElementById("competency-fill-instruments").style.width = "0%";
    
    document.getElementById("competency-val-atc").textContent = "0%";
    document.getElementById("competency-fill-atc").style.width = "0%";
    
    document.getElementById("competency-val-fault").textContent = "0%";
    document.getElementById("competency-fill-fault").style.width = "0%";
    
    document.getElementById("log-blindspot-card").style.display = "none";
    document.getElementById("log-entries-count").textContent = "0 Runs";
    document.getElementById("logbook-scroll-list").innerHTML = `
      <div style="font-size: 0.65rem; color: var(--text-muted); text-align: center; padding: 12px; width:100%;">NO RUN HISTORY YET</div>
    `;
    return;
  }
  
  const scores = globalHistory.map(h => h.score);
  const maxScore = Math.max(...scores);
  const averageGrade = Math.round(globalHistory.reduce((sum, h) => sum + h.percentage, 0) / totalRuns);
  const maxStreak = Math.max(...globalHistory.map(h => h.maxStreak || 0));
  
  document.getElementById("log-stat-high").textContent = maxScore.toLocaleString();
  document.getElementById("log-stat-avg").textContent = `${averageGrade}%`;
  document.getElementById("log-stat-streak").textContent = maxStreak;
  
  // Dynamic competency metrics — averaged across saved sessions with safe
  // fallbacks for legacy records (see FlightCore.competencyAverages).
  const compAvgs = FlightCore.competencyAverages(globalHistory);
  const checklistAvg = compAvgs.checklist;
  const instrumentsAvg = compAvgs.instruments;
  const atcAvg = compAvgs.atc;
  const faultAvg = compAvgs.fault;
  
  // Render competency matrices
  const setComp = (id, val) => {
    document.getElementById(`competency-val-${id}`).textContent = `${val}%`;
    document.getElementById(`competency-fill-${id}`).style.width = `${val}%`;
  };
  setComp("checklist", checklistAvg);
  setComp("instruments", instrumentsAvg);
  setComp("atc", atcAvg);
  setComp("fault", faultAvg);
  
  // Diagnosing cognitive blindspots
  const comps = [
    { label: "Checklist Sequencing", value: checklistAvg, code: "checklist" },
    { label: "Instrument Scanning", value: instrumentsAvg, code: "instruments" },
    { label: "Radio Retention (ATC)", value: atcAvg, code: "atc" },
    { label: "Emergency Diagnostics", value: faultAvg, code: "fault" }
  ];
  comps.sort((a,b) => a.value - b.value);
  
  const blindspot = comps[0]; // The lowest module score
  const blindspotCard = document.getElementById("log-blindspot-card");
  const blindspotMsg = document.getElementById("log-blindspot-msg");
  
  if (blindspot.value < 85) {
    blindspotCard.style.display = "block";
    let advice = "";
    if (blindspot.code === "checklist") {
      advice = "🎯 SEQUENCE FOCUS: You are experiencing cognitive friction when ordering checklists under stress. Try Checklist mode next and focus on ordering the sequence cleanly.";
    } else if (blindspot.code === "instruments") {
      advice = "🎯 INSTRUMENT SCAN FOCUS: Numerical scanning and gauge recall is currently your weakest area. Slow down during the study window and practice sweep scanning from top-left to bottom-right.";
    } else if (blindspot.code === "atc") {
      advice = "🎯 RADIO MEMORY FOCUS: Auditory clearances and Squawk digits are slip-sliding in memory. Pay extra close visual attention during the transmission briefing.";
    } else if (blindspot.code === "fault") {
      advice = "🎯 SYSTEMS PUZZLE FOCUS: Matching symptoms to systems is currently your lowest area. Slow down during the next fault briefing and look for pattern cues.";
    }
    blindspotMsg.textContent = advice;
  } else {
    blindspotCard.style.display = "none";
  }
  
  // Render flight entries scroll
  const logList = document.getElementById("logbook-scroll-list");
  logList.innerHTML = "";
  
  document.getElementById("log-entries-count").textContent = `${totalRuns} Runs`;
  
  // Show recent entries first
  const chronologicalLog = [...globalHistory].reverse();
  chronologicalLog.forEach(h => {
    const dateFormatted = new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const ratingClass = FlightCore.sessionTier(h.percentage).className;
    
    const row = document.createElement("div");
    row.className = "log-entry-row";
    row.innerHTML = `
      <div class="log-entry-meta">
        <span class="log-entry-title">COCKPIT CHALLENGE RUN</span>
        <span class="log-entry-date">${escapeHTML(dateFormatted)}</span>
      </div>
      <div class="log-entry-score-details">
        <span class="log-entry-score">${escapeHTML(h.score.toLocaleString())} pts</span>
        <span class="log-entry-badge ${escapeHTML(ratingClass)}">${escapeHTML(h.tier || FlightCore.sessionTier(h.percentage).label)}</span>
      </div>
    `;
    logList.appendChild(row);
  });
}
