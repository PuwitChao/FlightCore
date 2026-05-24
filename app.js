// Flight Core Operational Memory Trainer Logic

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
  { symptom: "GENERATOR BUS DROPOUT", system: "MAIN GENERATOR RELAY", action: "BATTERY BUS ISOLATE" }
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
let sessionLength = parseInt(localStorage.getItem("flightcore_session_length") || "8", 10);
let startingStreak = parseInt(localStorage.getItem("flightcore_starting_streak") || "4", 10);

let currentRndExpected = null;
let currentRndInput = null;
let studyTimer = null;
let studyDurationRemaining = 0;
let briefingStartTime = 0;
let isTimerPaused = false;

let focusedInputId = null;
let activeKeypadBuffer = "";

let roundByRoundHistory = []; // Session history
let globalHistory = JSON.parse(localStorage.getItem("flightcore_history") || "[]");
let dailyStreak = parseInt(localStorage.getItem("flightcore_daily_streak") || "0", 10);

// ==========================================
// 3. AUDIO SYNTH (Organic Low-Latency Web Audio API)
// ==========================================

let isSoundEnabled = localStorage.getItem("flightcore_sound") === "true";
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playSound(type) {
  if (!isSoundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    if (type === "click") {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.type = "sine";
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.04);
      gainNode.gain.setValueAtTime(0.08, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    } 
    else if (type === "success") {
      const now = ctx.currentTime;
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(523.25, now); // C5
      gain1.gain.setValueAtTime(0.06, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc1.start(now);
      osc1.stop(now + 0.25);
      
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(659.25, now + 0.08); // E5
      gain2.gain.setValueAtTime(0.08, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.35);
    } 
    else if (type === "error") {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.type = "triangle";
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(90, now + 0.22);
      gainNode.gain.setValueAtTime(0.12, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    }
  } catch (e) {
    console.warn("Web Audio API not allowed or supported on this device.", e);
  }
}

function updateSoundToggleUI() {
  const icon = document.getElementById("sound-icon");
  if (!icon) return;
  if (isSoundEnabled) {
    icon.innerHTML = `<path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>`;
    icon.closest("button").setAttribute("title", "Mute Sound");
  } else {
    icon.innerHTML = `<path d="M11 5L6 9H2v6h4l5 4V5z"></path><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>`;
    icon.closest("button").setAttribute("title", "Unmute Sound");
  }
}

function initSoundSystem() {
  updateSoundToggleUI();
  
  const btnSound = document.getElementById("btn-sound-toggle");
  if (btnSound) {
    btnSound.addEventListener("click", () => {
      isSoundEnabled = !isSoundEnabled;
      localStorage.setItem("flightcore_sound", isSoundEnabled);
      updateSoundToggleUI();
      
      // Try to initialize or resume context on interaction
      if (isSoundEnabled) {
        try {
          const ctx = getAudioContext();
          playSound("click");
        } catch (e) {}
      }
    });
  }
}

// Simulates tactile feedback
function triggerHaptic(type) {
  if ("vibrate" in navigator) {
    if (type === "success") {
      navigator.vibrate(80);
    } else if (type === "error") {
      navigator.vibrate([100, 50, 100]);
    } else if (type === "warning") {
      navigator.vibrate([60, 40, 60]);
    } else {
      navigator.vibrate(20);
    }
  }
}

// ==========================================
// 4. LEVEL & MODULE CONTROLS
// ==========================================

function updateLevelAndHUD() {
  level = 1 + Math.floor(streak / 2);
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
  // Pull from active user selection
  let allowed = [...selectedModules];
  
  // Apply "No 3x Repeat" filtering logic ONLY if there are multiple modules active
  if (allowed.length >= 2 && recentlyPlayedModules.length >= 2 && recentlyPlayedModules[0] === recentlyPlayedModules[1]) {
    allowed = allowed.filter(m => m !== recentlyPlayedModules[0]);
  }
  
  // Pick one randomly
  const selected = allowed[Math.floor(Math.random() * allowed.length)];
  
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

function generateChecklistData() {
  const checklist = CHECKLIST_POOLS[Math.floor(Math.random() * CHECKLIST_POOLS.length)];
  const numSteps = Math.min(3 + level, checklist.steps.length); // Scales 3 up to all steps
  const expectedSteps = checklist.steps.slice(0, numSteps);
  
  // Find distractors from other checklists
  let allOtherSteps = [];
  CHECKLIST_POOLS.forEach(c => {
    if (c.name !== checklist.name) {
      allOtherSteps = allOtherSteps.concat(c.steps);
    }
  });
  
  // Take 1 to 3 distractors based on level
  const numDistractors = Math.min(1 + Math.floor(level / 2), 3);
  let distractors = [];
  while (distractors.length < numDistractors && allOtherSteps.length > 0) {
    const idx = Math.floor(Math.random() * allOtherSteps.length);
    const item = allOtherSteps[idx];
    if (!expectedSteps.includes(item) && !distractors.includes(item)) {
      distractors.push(item);
    }
  }
  
  return {
    title: checklist.name,
    expected: expectedSteps,
    pool: shuffle([...expectedSteps, ...distractors])
  };
}

function generateInstrumentsData() {
  // Number of gauges scales: Level 1-2 = 4, Level 3-4 = 6, Level 5+ = 8
  const count = level <= 2 ? 4 : (level <= 4 ? 6 : 8);
  const selectedGauges = shuffle([...INSTRUMENT_METRIC_POOLS]).slice(0, count);
  
  const expected = selectedGauges.map(g => {
    let rawVal = Math.random() * (g.max - g.min) + g.min;
    // Format appropriately
    let finalVal = 0;
    if (g.label === "IAS" || g.label === "ALT" || g.label === "FF") {
      finalVal = Math.round(rawVal / 5) * 5; // Rounds to nearest 5
    } else if (g.label === "N1" || g.label === "EGT" || g.label === "OIL") {
      finalVal = Math.round(rawVal);
    } else {
      finalVal = Math.round(rawVal * 10) / 10; // 1 decimal place (VIB, BAT)
    }
    return {
      label: g.label,
      name: g.name,
      val: finalVal,
      unit: g.unit,
      min: g.min,
      max: g.max,
      color: g.color
    };
  });
  
  return { expected };
}

function generateATCData() {
  const callsign = ATC_POOLS.callsigns[Math.floor(Math.random() * ATC_POOLS.callsigns.length)];
  const facility = ATC_POOLS.facilities[Math.floor(Math.random() * ATC_POOLS.facilities.length)];
  const freq = ATC_POOLS.frequencies[Math.floor(Math.random() * ATC_POOLS.frequencies.length)];
  const squawk = ATC_POOLS.squawks[Math.floor(Math.random() * ATC_POOLS.squawks.length)];
  
  // Custom prompt increases string length/components at Level 3+
  let levelText = "";
  if (level >= 3) {
    const windH = Math.floor(Math.random() * 36) * 10;
    const windS = Math.floor(Math.random() * 20) + 5;
    levelText = ` WIND ${windH} AT ${windS} KNOTS.`;
  }
  
  return {
    expected: { callsign, facility, freq, squawk },
    displayText: `"${callsign}, ${facility}, CONTACT DEPARTURE ON ${freq}, SQUAWK ${squawk}.${levelText}"`
  };
}

function generateFaultData() {
  const fault = FAULT_POOLS[Math.floor(Math.random() * FAULT_POOLS.length)];
  const expectedChain = [fault.symptom, fault.system, fault.action];
  
  // Grab distractors from other diagnostic blocks
  let otherItems = [];
  FAULT_POOLS.forEach(f => {
    if (f.symptom !== fault.symptom) {
      otherItems.push(f.symptom);
      otherItems.push(f.system);
      otherItems.push(f.action);
    }
  });
  
  const distractorsCount = Math.min(level, 3);
  let distractors = [];
  while (distractors.length < distractorsCount) {
    const item = otherItems[Math.floor(Math.random() * otherItems.length)];
    if (!expectedChain.includes(item) && !distractors.includes(item)) {
      distractors.push(item);
    }
  }
  
  return {
    symptom: fault.symptom,
    expected: expectedChain,
    pool: shuffle([...expectedChain, ...distractors])
  };
}

// Utility shuffler
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
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
  
  // Automatically toggle abort header based on screen
  updateHeaderControls(screenId);
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
    titleEl.textContent = "SCAN INSTRUMENT telemetry";
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
  
  // Study timer dynamic setup (shorter as levels scale up)
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
  
  briefingStartTime = Date.now();
  studyDurationRemaining = studySecs;
  
  const timerBar = document.getElementById("study-timer-bar");
  const timerDisplay = document.getElementById("study-timer-display");
  timerBar.style.width = "100%";
  timerDisplay.textContent = `${studyDurationRemaining.toFixed(2)}s`;
  
  if (studyTimer) clearInterval(studyTimer);
  
  const intervalTime = 50; // update every 50ms for buttery-smooth swept scale
  const totalTicks = (studySecs * 1000) / intervalTime;
  let tick = 0;
  
  studyTimer = setInterval(() => {
    if (isTimerPaused) return;
    tick++;
    studyDurationRemaining = Math.max(studySecs - (tick * intervalTime) / 1000, 0);
    timerBar.style.width = `${(studyDurationRemaining / studySecs) * 1000 / 10}%`;
    timerDisplay.textContent = `${studyDurationRemaining.toFixed(2)}s`;
    
    if (studyDurationRemaining <= 0) {
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
  
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; width: 100%; font-size: 0.65rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 8px;">
      <span style="color: ${g.color || 'var(--accent-blue)'};">${g.label}</span>
      <span>${g.unit}</span>
    </div>
    <div class="gauge-value-display" style="font-size: 1.5rem; font-weight: 800; color: var(--text-primary); margin: 6px 0; letter-spacing: -0.5px;">
      ${isBlanked ? "???" : g.val}
    </div>
    <div class="gauge-name" style="font-size: 0.58rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.3px; text-align: center;">
      ${g.name}
    </div>
  `;
  
  return container;
}

// ==========================================
// 8. TEST/RECALL SEQUENCE
// ==========================================

function commenceTest() {
  if (studyTimer) clearInterval(studyTimer);
  playSound("click");
  
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
    labelEl.textContent = "Mitigate Diagnostic Chain";
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
  
  let visibleIndex = 0;
  // Load remaining steps that haven't been selected yet
  currentRndExpected.pool.forEach(item => {
    if (!currentRndInput.includes(item)) {
      visibleIndex++;
      const el = document.createElement("div");
      el.className = "sortable-item";
      el.innerHTML = `
        <span>${item}</span>
        <span class="shortcut-badge" style="font-size: 0.6rem; opacity: 0.4; font-weight: 700; border: 1px solid var(--border-subtle); padding: 1px 4px; border-radius: 4px; margin-left: 8px;">${visibleIndex}</span>
      `;
      const currentVal = item;
      el.addEventListener("click", () => {
        playSound("click");
        // Add to input array
        currentRndInput.push(currentVal);
        
        // Update slots
        const slotIdx = currentRndInput.length - 1;
        const slotText = document.getElementById(`checklist-slot-text-${slotIdx}`);
        slotText.textContent = currentVal;
        slotText.style.color = "var(--text-white)";
        
        // Re-render remaining pool
        renderChecklistPool();
      });
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
      slotText.textContent = "[VACANT]";
      slotText.style.color = "var(--text-muted)";
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
      btn.innerHTML = `
        <span>${item}</span>
        <span class="shortcut-badge" style="font-size: 0.6rem; opacity: 0.4; font-weight: 700; border: 1px solid var(--border-subtle); padding: 1px 4px; border-radius: 4px; margin-left: 8px;">${visibleIndex}</span>
      `;
      const currentVal = item;
      btn.addEventListener("click", () => {
        playSound("click");
        
        // Write choice
        currentRndInput[focusedInputId] = currentVal;
        
        // Update slot text
        const textEl = document.getElementById(`fault-slot-text-${focusedInputId}`);
        textEl.textContent = currentVal;
        textEl.style.color = "var(--text-white)";
        
        // Advance focus if slot 0 is filled
        if (focusedInputId === 0 && currentRndInput[1] === "") {
          document.querySelectorAll(".fault-step-node").forEach(n => n.classList.remove("active-step"));
          const slot1 = document.getElementById("fault-slot-container-1");
          slot1.classList.add("active-step");
          focusedInputId = 1;
        }
        
        renderFaultPool();
      });
      poolContainer.appendChild(btn);
    }
  });
  
  // Clear/Reset option
  if (currentRndInput[0] !== "" || currentRndInput[1] !== "") {
    const clearBtn = document.createElement("button");
    clearBtn.className = "btn btn-danger btn-block";
    clearBtn.style.minHeight = "36px";
    clearBtn.style.marginTop = "8px";
    clearBtn.textContent = "⌫ CLEAR Diagnostic";
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

document.getElementById("keypad-enter").addEventListener("click", () => {
  if (focusedInputId === null) return;
  playSound("click");
  
  // Cupertino-Style Auto-Advance logic
  if (activeModule === "instruments") {
    const cards = Array.from(document.querySelectorAll("#instruments-grid-test .gauge-card"));
    const activeCard = document.querySelector(".gauge-card.active-step");
    if (activeCard) {
      const activeIdx = cards.indexOf(activeCard);
      let nextBlankCard = null;
      for (let i = 1; i <= cards.length; i++) {
        const nextIdx = (activeIdx + i) % cards.length;
        const card = cards[nextIdx];
        const label = card.getAttribute("data-label");
        if (!currentRndInput[label]) {
          nextBlankCard = card;
          break;
        }
      }
      
      if (nextBlankCard) {
        setTimeout(() => {
          nextBlankCard.click();
        }, 150);
        return; // Advance focus, do NOT hide keypad or clear active classes
      }
    }
  } else if (activeModule === "atc") {
    if (focusedInputId === "freq") {
      const nextEl = document.getElementById("atc-input-squawk");
      if (nextEl) {
        setTimeout(() => {
          nextEl.click();
        }, 150);
        return; // Advance focus to Squawk, do NOT hide keypad or clear active classes
      }
    }
  }
  
  // Submit active focused field and hide keypad (default/fallback when no further auto-advance is possible)
  document.getElementById("custom-keypad").style.display = "none";
  document.querySelectorAll(".gauge-card").forEach(c => c.classList.remove("active-step"));
  document.querySelectorAll(".input-terminal").forEach(i => i.classList.remove("active-input"));
  
  focusedInputId = null;
});

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
    const totalChecklistItems = expected.length + extraInputs;
    const correctSteps = expected.length - checklistErrors;
    accuracy = Math.round((correctSteps / totalChecklistItems) * 100);
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
    
    const correctDials = expected.length - gaugeErrors;
    accuracy = Math.round((correctDials / expected.length) * 100);
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
    
    const correctFields = 4 - atcErrors;
    accuracy = Math.round((correctFields / 4) * 100);
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
    
    const correctMatches = (systemMatch ? 1 : 0) + (actionMatch ? 1 : 0);
    accuracy = Math.round((correctMatches / 2) * 100);
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
    ratingEl.className = "debrief-rating proficient";
    verdictCard.style.borderColor = "var(--success-border)";
    verdictCard.style.backgroundColor = "var(--success-bg)";
    scoreAdded.textContent = `+${res.score.toLocaleString()} PTS (STREAK INCREMENTED)`;
  } else if (res.grade === "good") {
    ratingEl.textContent = `GREAT RECALL (${res.accuracy}%)`;
    ratingEl.className = "debrief-rating proficient";
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
    ratingEl.className = "debrief-rating unacceptable";
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
      <span class="feedback-field">${row.field}</span>
      <div class="feedback-values">
        <span class="val-expected">EXP: ${row.expected}</span>
        <span class="val-input ${row.correct ? '' : 'error'}">INP: ${row.input}</span>
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
  const percentage = Math.round(roundByRoundHistory.reduce((sum, r) => sum + r.accuracy, 0) / roundByRoundHistory.length);
  
  // Tier designations mapping
  let tier = "UNACCEPTABLE";
  let tierClass = "unacceptable";
  if (percentage >= 90) {
    tier = "PROFICIENT";
    tierClass = "proficient";
    launchConfetti(); // Trigger confetti celebration!
  } else if (percentage >= 75) {
    tier = "SATISFACTORY";
    tierClass = "satisfactory";
  } else if (percentage >= 50) {
    tier = "REMEDIAL";
    tierClass = "remedial";
  }
  
  // Score display
  document.getElementById("debrief-score").textContent = sessionScore.toLocaleString();
  document.getElementById("debrief-percentage").textContent = `${percentage}% ACCURACY`;
  
  const ratingLabel = document.getElementById("debrief-rating-label");
  ratingLabel.textContent = tier;
  ratingLabel.className = "debrief-rating " + tierClass;
  
  // Construct breakdown table
  const tbody = document.getElementById("debrief-table-rows");
  tbody.innerHTML = "";
  
  roundByRoundHistory.forEach(r => {
    const tr = document.createElement("tr");
    let resultText = "FAIL";
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
      resultText = `FAIL (${r.accuracy}%)`;
      resultColor = "var(--error-rose)";
    }
    
    tr.innerHTML = `
      <td>${String(r.round).padStart(2, "0")}</td>
      <td>${r.module.toUpperCase()}</td>
      <td style="font-weight:bold; color:${resultColor}">${resultText}</td>
      <td>${r.score.toLocaleString()}</td>
    `;
    tbody.appendChild(tr);
  });
  
  // Collect blindspots
  const blindspots = roundByRoundHistory.filter(r => !r.correct && r.blindspot).map(r => r.blindspot);
  const blindspotCard = document.getElementById("debrief-blindspots");
  const blindspotList = document.getElementById("debrief-blindspot-list");
  
  if (blindspots.length > 0) {
    blindspotCard.style.display = "block";
    blindspotList.innerHTML = "";
    // Unique list
    [...new Set(blindspots)].forEach(b => {
      const li = document.createElement("li");
      li.textContent = b;
      blindspotList.appendChild(li);
    });
  } else {
    blindspotCard.style.display = "none";
  }
  
  // Compute per-module accuracy for this session
  const moduleAccuracy = {};
  ["checklist", "instruments", "atc", "fault"].forEach(mod => {
    const rounds = roundByRoundHistory.filter(r => r.module === mod);
    if (rounds.length > 0) {
      moduleAccuracy[mod] = Math.round(rounds.reduce((s, r) => s + r.accuracy, 0) / rounds.length);
    }
  });

  // Update daily training streak
  const todayStr = new Date().toDateString();
  const lastTrainedStr = localStorage.getItem("flightcore_last_trained");
  if (!lastTrainedStr) {
    dailyStreak = 1;
  } else {
    const lastDate = new Date(lastTrainedStr);
    const today = new Date(todayStr);
    const diffDays = Math.round((today - new Date(lastDate.toDateString())) / 86400000);
    if (diffDays === 0) {
      // Same day — streak unchanged
    } else if (diffDays === 1) {
      dailyStreak += 1;
    } else {
      dailyStreak = 1;
    }
  }
  localStorage.setItem("flightcore_last_trained", todayStr);
  localStorage.setItem("flightcore_daily_streak", dailyStreak);

  // Save session record to global history in localStorage
  const sessionRecord = {
    date: new Date().toISOString(),
    score: sessionScore,
    percentage: percentage,
    tier: tier,
    maxLevel: level,
    maxStreak: sessionMaxStreak,
    moduleAccuracy: moduleAccuracy
  };
  globalHistory.push(sessionRecord);
  // Cap history at 30 items
  if (globalHistory.length > 30) globalHistory.shift();
  localStorage.setItem("flightcore_history", JSON.stringify(globalHistory));

  showScreen("screen-debrief");
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
  level = 1 + Math.floor(streak / 2);
  sessionMaxStreak = 0;
  activeModule = null;
  recentlyPlayedModules = [];
  roundByRoundHistory = [];

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
  
  // Real Chart populated state
  // Slice the last 6 sessions in chronological order
  const recent = globalHistory.slice(-6);
  
  const createRealChartHTML = (widthPercent = "100%") => {
    // Generate coordinate mapping
    // X goes from 20 to 280 across a 300px viewBox
    // Y goes from 12 (100% accuracy) to 58 (0% accuracy)
    const points = recent.map((h, idx) => {
      const x = 20 + idx * (260 / (recent.length - 1 || 1));
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
  } else {
    document.getElementById("stat-high-score").textContent = "0";
    document.getElementById("stat-avg-score").textContent = "0.0%";
    document.getElementById("stat-sessions").textContent = "0";
    document.getElementById("stat-max-streak").textContent = "0";

    const sideHighScore = document.getElementById("side-stat-high-score");
    const sideAvgScore = document.getElementById("side-stat-avg-score");
    if (sideHighScore) sideHighScore.textContent = "0";
    if (sideAvgScore) sideAvgScore.textContent = "0.0%";
  }

  const dailyStreakEl = document.getElementById("stat-daily-streak");
  if (dailyStreakEl) dailyStreakEl.textContent = dailyStreak;

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
  const savedTheme = localStorage.getItem("flightcore_theme") || "dark";
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

  // Bind clear history button
  const btnClearHistory = document.getElementById("btn-clear-history");
  if (btnClearHistory) {
    btnClearHistory.addEventListener("click", () => {
      playSound("click");
      if (confirm("Are you sure you want to purge all telemetry history? This action is irreversible.")) {
        globalHistory = [];
        localStorage.removeItem("flightcore_history");
        playSound("error");
        
        // Refresh home stats in real-time
        loadHomeStats();
        
        // Hide theme selector overlay
        if (overlay) {
          overlay.style.display = "none";
        }
      }
    });
  }
}

function setTheme(themeVal) {
  document.body.setAttribute("data-theme", themeVal);
  localStorage.setItem("flightcore_theme", themeVal);
  
  // Update active class in options
  const optButtons = document.querySelectorAll(".theme-opt-btn");
  optButtons.forEach(btn => {
    if (btn.getAttribute("data-theme-val") === themeVal) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
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
  if (focusedInputId !== null) {
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
        playSound("click");
        // Close keypad & clear selection indicators
        document.getElementById("custom-keypad").style.display = "none";
        document.querySelectorAll(".gauge-card").forEach(c => c.classList.remove("active-step"));
        document.querySelectorAll(".input-terminal").forEach(i => i.classList.remove("active-input"));
        focusedInputId = null;
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
  if (activeScreen.id === "screen-test" && focusedInputId === null) {
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
    localStorage.setItem("flightcore_onboarded", "true");
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      playSound("click");
      overlay.style.display = "none";
      localStorage.setItem("flightcore_onboarded", "true");
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
      localStorage.setItem("flightcore_starting_streak", val);
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      if (label) label.textContent = names[val] || "Standard";
    });
  });
}

function initSessionLengthSelector() {
  const buttons = document.querySelectorAll(".session-len-btn");
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
      localStorage.setItem("flightcore_session_length", len);
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      if (label) label.textContent = `${len} Rounds`;
      renderRoundStepTracker();
    });
  });
}

function initModuleSelection() {
  const cards = document.querySelectorAll(".module-select-card");
  cards.forEach(card => {
    card.addEventListener("click", () => {
      const mod = card.getAttribute("data-module");
      if (card.classList.contains("active")) {
        // Trying to deactivate
        if (selectedModules.length <= 1) {
          // Play Apple-style shake animation for feedback!
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
      
      // Update label count
      document.getElementById("modules-selected-count").textContent = `${selectedModules.length} Active`;
    });
  });
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
      playSound("click");
      if (pauseIcon) {
        pauseIcon.innerHTML = `<polygon points="6,4 20,12 6,20" />`;
      }
      if (pausedOverlay) {
        pausedOverlay.style.display = "flex";
      }
    } else {
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

// Bootstrap application on DOM ready
window.addEventListener("DOMContentLoaded", () => {
  initThemeSystem();
  initSoundSystem();
  loadHomeStats();
  initModuleSelection();
  initSessionLengthSelector();
  initDifficultySelector();
  initAbortSystem();
  initHelpSystem();
  initStudyPauseSystem();
  initOnboarding();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
});
