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
  callsigns: ["CLIPPER 402", "AIR FORCE ONE", "SPEEDBIRD 117", "LUFTHANSA 440", "DELTA 905", "UNITED 248", "NAVY 801", "FLAGSHIP 332"],
  facilities: ["SEATTLE CENTER", "CHICAGO TOWER", "LONDON APPROACH", "BOSTON CENTER", "MIAMI GROUND", "LA DEP CON", "TOKYO CONTROL", "JFK TOWER"],
  frequencies: ["121.90", "124.75", "118.10", "132.85", "128.05", "134.40", "119.50", "127.30"],
  squawks: ["4201", "7200", "1200", "7700", "3352", "6401", "0422", "5015"]
};

const FAULT_POOLS = [
  { symptom: "RAPID CABIN DEPRESSURIZATION", system: "PNEUMATIC MANIFOLD", action: "DON OXYGEN MASKS" },
  { symptom: "EGT EXCESS HIGH LIMIT", system: "FUEL CONTROL MODULE", action: "RETARD THROTTLE DETENT" },
  { symptom: "DUAL ENGINE ROTOR LOCK", system: "EMERGENCY APU GENERATOR", action: "PITCH STABILIZE GLIDE" },
  { symptom: "HYDRAULIC RESERVOIR EMPTY", system: "FLUID TRANSFER VALVE", action: "ENGAGE STANDBY FLUIDS" },
  { symptom: "WING FLAPS ASYMMETRY", system: "FLAP POWER ACTUATOR", action: "MATCH CONTRALATERAL" },
  { symptom: "ELECTRICAL BUS OVERLOAD", system: "CROSSFEED ISOLATOR", action: "RESET ENGINE GENERATOR" }
];

// ==========================================
// 2. STATE MANAGER
// ==========================================

let sessionRound = 0;
let sessionScore = 0;
let streak = 0;
let level = 1;
let activeModule = null;
let recentlyPlayedModules = []; // Holds last 2 modules to implement "No 3x Repeat"
let selectedModules = ["checklist", "instruments", "atc", "fault"];

let currentRndExpected = null;
let currentRndInput = null;
let studyTimer = null;
let studyDurationRemaining = 0;
let briefingStartTime = 0;

let focusedInputId = null;
let activeKeypadBuffer = "";

let roundByRoundHistory = []; // Session history
let globalHistory = JSON.parse(localStorage.getItem("flightcore_history") || "[]");

// ==========================================
// 3. AUDIO SYNTH (Muted for Silent Visual Alerts)
// ==========================================

function playSound(type) {
  // Sounds muted in favor of sleek, silent premium visual cockpit alert flashes
}

// Simulates tactile feedback
function triggerHaptic(type) {
  if ("vibrate" in navigator) {
    if (type === "success") {
      navigator.vibrate(80);
    } else if (type === "error") {
      navigator.vibrate([100, 50, 100]);
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
  document.getElementById("hud-round").textContent = `${String(sessionRound).padStart(2, "0")}/08`;
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
  
  // Load remaining steps that haven't been selected yet
  currentRndExpected.pool.forEach(item => {
    if (!currentRndInput.includes(item)) {
      const el = document.createElement("div");
      el.className = "sortable-item";
      el.textContent = item;
      el.addEventListener("click", () => {
        playSound("click");
        // Add to input array
        currentRndInput.push(item);
        
        // Update slots
        const slotIdx = currentRndInput.length - 1;
        const slotText = document.getElementById(`checklist-slot-text-${slotIdx}`);
        slotText.textContent = item;
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
  
  currentRndExpected.expected.forEach(g => {
    const card = createGaugeHTML(g, true); // Blanked layout
    
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
  
  options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "keypad-btn";
    btn.style.height = "44px";
    btn.style.fontSize = "0.75rem";
    btn.textContent = opt;
    btn.addEventListener("click", () => {
      playSound("click");
      currentRndInput[field] = opt;
      inputEl.value = opt;
      document.getElementById("text-keypad-preview-value").textContent = opt;
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
  
  // Populate options
  currentRndExpected.pool.forEach(item => {
    // Only display option if it hasn't been placed in another slot
    if (!currentRndInput.includes(item)) {
      const btn = document.createElement("div");
      btn.className = "sortable-item";
      btn.textContent = item;
      btn.addEventListener("click", () => {
        playSound("click");
        
        // Write choice
        currentRndInput[focusedInputId] = item;
        
        // Update slot text
        const textEl = document.getElementById(`fault-slot-text-${focusedInputId}`);
        textEl.textContent = item;
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
  
  // Submit active focused field and hide keypad
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
  let isCorrect = false;
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
    
    isCorrect = checklistErrors === 0 && inputs.length === expected.length;
    discrepancyLogItem = checklistErrors > 0 ? `Checklist mismatch in ${currentRndExpected.title}` : null;
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
    
    isCorrect = gaugeErrors === 0;
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
    
    isCorrect = atcErrors === 0;
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
    
    isCorrect = systemMatch && actionMatch;
    discrepancyLogItem = !isCorrect ? `Diagnostic chain protocol failure` : null;
  }
  
  // Calculate scoring
  if (isCorrect) {
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
  } else {
    streak = 0;
    playSound("error");
    triggerHaptic("error");
    
    // Edge glow effect
    document.getElementById("main-viewport").className = "viewport-content screen-glow-error";
  }
  
  // Save round result
  const rndResult = {
    round: sessionRound,
    module: activeModule,
    score: addedPoints,
    correct: isCorrect,
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
  
  if (res.correct) {
    ratingEl.textContent = "CORRECT";
    ratingEl.className = "debrief-rating proficient";
    verdictCard.style.borderColor = "var(--success-border)";
    verdictCard.style.backgroundColor = "var(--success-bg)";
    scoreAdded.textContent = `+${res.score.toLocaleString()} PTS`;
  } else {
    ratingEl.textContent = "INCORRECT RESPONSE";
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
  if (sessionRound < 8) {
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
  const percentage = Math.round((roundByRoundHistory.filter(r => r.correct).length / 8) * 100);
  
  // Tier designations mapping
  let tier = "UNACCEPTABLE";
  let tierClass = "unacceptable";
  if (percentage >= 90) {
    tier = "PROFICIENT";
    tierClass = "proficient";
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
    if (!r.correct) tr.className = "incorrect-row";
    tr.innerHTML = `
      <td>${String(r.round).padStart(2, "0")}</td>
      <td>${r.module.toUpperCase()}</td>
      <td style="font-weight:bold; color:${r.correct ? 'var(--success-emerald)' : 'var(--error-rose)'}">${r.correct ? 'PASS' : 'FAIL'}</td>
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
  
  // Save session record to global history in localStorage
  const sessionRecord = {
    date: new Date().toISOString(),
    score: sessionScore,
    percentage: percentage,
    tier: tier,
    maxLevel: level
  };
  globalHistory.push(sessionRecord);
  // Cap history at 30 items
  if (globalHistory.length > 30) globalHistory.shift();
  localStorage.setItem("flightcore_history", JSON.stringify(globalHistory));
  
  showScreen("screen-debrief");
}

// Restart session trigger
document.getElementById("btn-restart").addEventListener("click", () => {
  playSound("click");
  initSession();
});

// Start Session Button
document.getElementById("btn-engage-session").addEventListener("click", () => {
  playSound("click");
  initSession();
});

function initSession() {
  sessionRound = 0;
  sessionScore = 0;
  streak = 0;
  level = 1;
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
    const emptyHTML = `<div style="font-size: 0.65rem; color: var(--text-muted); text-align: center;">NO SESSION HISTORY RECORDED</div>`;
    chartWrapper.innerHTML = emptyHTML;
    if (sideWrapper) sideWrapper.innerHTML = emptyHTML;
    return;
  }
  
  const createHistoryListHTML = (historyData) => {
    let html = `<div style="display: flex; flex-direction: column; gap: 8px; width: 100%;">`;
    const recent = [...historyData].reverse().slice(0, 3);
    recent.forEach((h) => {
      const dateStr = new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      html += `
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem; padding: 8px 12px; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); background: rgba(255,255,255,0.01);">
          <span style="font-weight: 700; color: var(--accent-blue);">${dateStr}</span>
          <span style="color: var(--text-primary); font-weight: 600;">${h.score.toLocaleString()} PTS</span>
          <span style="font-weight: 700; font-size: 0.65rem; color: ${h.percentage >= 90 ? 'var(--success-emerald)' : 'var(--text-secondary)'};">${h.percentage}% ACC</span>
        </div>
      `;
    });
    html += `</div>`;
    return html;
  };
  
  chartWrapper.innerHTML = createHistoryListHTML(globalHistory);
  if (sideWrapper) {
    sideWrapper.innerHTML = createHistoryListHTML(globalHistory);
  }
}

// Initial Home Screen Stats Render
function loadHomeStats() {
  if (globalHistory.length > 0) {
    const scores = globalHistory.map(h => h.score);
    const percentages = globalHistory.map(h => h.percentage);
    const maxScore = Math.max(...scores);
    const averageGrade = Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length);
    const totalRuns = globalHistory.length;
    
    // Max level achieved
    const maxLv = Math.max(...globalHistory.map(h => h.maxLevel || 1));
    
    document.getElementById("stat-high-score").textContent = maxScore.toLocaleString();
    document.getElementById("stat-avg-score").textContent = `${averageGrade}%`;
    document.getElementById("stat-sessions").textContent = totalRuns;
    document.getElementById("stat-max-streak").textContent = `LVL ${maxLv}`;
    
    // Update side panel stats
    const sideHighScore = document.getElementById("side-stat-high-score");
    const sideAvgScore = document.getElementById("side-stat-avg-score");
    if (sideHighScore) sideHighScore.textContent = maxScore.toLocaleString();
    if (sideAvgScore) sideAvgScore.textContent = `${averageGrade}%`;
  }
  
  renderHistoryChart();
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
  
  // Case 1: Active keypad input session
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
      } else if (key === "Enter") {
        e.preventDefault();
        playSound("click");
        // Close keypad & clear selection indicators
        document.getElementById("custom-keypad").style.display = "none";
        document.querySelectorAll(".gauge-card").forEach(c => c.classList.remove("active-step"));
        document.querySelectorAll(".input-terminal").forEach(i => i.classList.remove("active-input"));
        focusedInputId = null;
      }
    }
    return;
  }
  
  // Case 2: Global application flow hotkeys (Space / Enter)
  const activeScreen = document.querySelector(".screen-container.active");
  if (!activeScreen) return;
  
  if (key === "Enter" || key === " ") {
    e.preventDefault();
    const screenId = activeScreen.id;
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

// Bootstrap application on DOM ready
window.addEventListener("DOMContentLoaded", () => {
  initThemeSystem();
  loadHomeStats();
  initModuleSelection();
});
