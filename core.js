// ==========================================
// Flight Core — Pure Engine Core
// ------------------------------------------
// Side-effect-free game logic extracted from app.js so it can be unit-tested
// in isolation (see tests.html) and reused without touching the DOM or
// localStorage. Every function is deterministic given its inputs; randomness
// is injected via an optional `rng` argument (defaults to Math.random) so tests
// can supply a seeded generator.
// ==========================================

(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.FlightCore = api;
})(typeof window !== "undefined" ? window : this, function () {
  "use strict";

  // ---- small internal helpers ----
  function clampPct(n) {
    if (!Number.isFinite(n)) return 0;
    return Math.min(Math.max(n, 0), 100);
  }

  // ---- safe data parsing / coercion ----

  // Parse JSON without ever throwing. Returns `fallback` on any failure, and —
  // when `fallback` is an array — guarantees the result is an array too
  // (guards against corrupt or maliciously-shaped localStorage values).
  function safeParse(json, fallback) {
    if (json === null || json === undefined) return fallback;
    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
      return parsed;
    } catch (e) {
      return fallback;
    }
  }

  // Coerce a raw value to a finite number, clamping to [min, max] when given.
  // Returns `def` when the value is not a finite number.
  function safeNumber(raw, def, opts) {
    const n = typeof raw === "number" ? raw : parseFloat(raw);
    if (!Number.isFinite(n)) return def;
    let v = n;
    if (opts) {
      if (typeof opts.min === "number" && v < opts.min) v = opts.min;
      if (typeof opts.max === "number" && v > opts.max) v = opts.max;
    }
    return v;
  }

  // ---- difficulty & geometry ----

  const MAX_LEVEL = 99;

  // Level = 1 + floor(streak / 2), guarded against non-finite/negative streaks
  // and clamped so a corrupt streak can never explode difficulty.
  function computeLevel(streak) {
    const s = Number(streak);
    if (!Number.isFinite(s) || s < 0) return 1;
    return Math.min(1 + Math.floor(s / 2), MAX_LEVEL);
  }

  // Position of `val` within [min, max] as a percentage in [0, 100].
  // Returns 0 for degenerate ranges (max <= min) or non-finite inputs,
  // eliminating division-by-zero / NaN / Infinity.
  function gaugePercent(val, min, max) {
    const v = Number(val), mn = Number(min), mx = Number(max);
    if (!Number.isFinite(v) || !Number.isFinite(mn) || !Number.isFinite(mx)) return 0;
    const range = mx - mn;
    if (range <= 0) return 0;
    return clampPct(((v - mn) / range) * 100);
  }

  // ---- module selection ("No 3x Repeat") ----

  // Pick the next challenge module from the active selection, filtering out a
  // module that was played the previous two rounds. Never returns undefined:
  // if filtering would empty the pool it keeps the unfiltered pool, and if the
  // selection itself is empty it returns null for the caller to handle.
  function selectModule(selected, recentlyPlayed, rng) {
    rng = rng || Math.random;
    const pool = Array.isArray(selected) ? selected.slice() : [];
    if (pool.length === 0) return null;
    let allowed = pool;
    const rp = Array.isArray(recentlyPlayed) ? recentlyPlayed : [];
    if (allowed.length >= 2 && rp.length >= 2 && rp[0] === rp[1]) {
      const filtered = allowed.filter(m => m !== rp[0]);
      if (filtered.length > 0) allowed = filtered;
    }
    return allowed[Math.floor(rng() * allowed.length)];
  }

  // ---- per-module accuracy scoring (0..100, never NaN) ----

  function checklistAccuracy(expected, inputs) {
    const exp = Array.isArray(expected) ? expected : [];
    const inp = Array.isArray(inputs) ? inputs : [];
    let errors = 0;
    exp.forEach((step, idx) => { if (step !== (inp[idx] || "")) errors++; });
    const extra = Math.max(0, inp.length - exp.length);
    const total = exp.length + extra;
    if (total === 0) return 0;
    return clampPct(Math.round(((exp.length - errors) / total) * 100));
  }

  function instrumentsAccuracy(expected, inputs) {
    const exp = Array.isArray(expected) ? expected : [];
    if (exp.length === 0) return 0;
    const inp = inputs || {};
    let errors = 0;
    exp.forEach(g => {
      const userVal = parseFloat(inp[g.label]) || 0;
      const targetVal = parseFloat(g.val);
      if (userVal !== targetVal) errors++;
    });
    return clampPct(Math.round(((exp.length - errors) / exp.length) * 100));
  }

  function atcAccuracy(expected, inputs) {
    const exp = expected || {}, inp = inputs || {};
    const fields = ["callsign", "facility", "freq", "squawk"];
    let errors = 0;
    fields.forEach(f => {
      const e = String(exp[f] === undefined || exp[f] === null ? "" : exp[f]).trim().toUpperCase();
      const i = String(inp[f] === undefined || inp[f] === null ? "" : inp[f]).trim().toUpperCase();
      if (e !== i) errors++;
    });
    return clampPct(Math.round(((4 - errors) / 4) * 100));
  }

  // expected: [symptom, system, action]; inputs: [systemInput, actionInput]
  function faultAccuracy(expected, inputs) {
    const exp = Array.isArray(expected) ? expected : [];
    const inp = Array.isArray(inputs) ? inputs : [];
    const correct = (inp[0] === exp[1] ? 1 : 0) + (inp[1] === exp[2] ? 1 : 0);
    return clampPct(Math.round((correct / 2) * 100));
  }

  // ---- aggregate analytics ----

  // Mean round accuracy for a session. Returns 0 on empty history (no NaN).
  function sessionGrade(rounds) {
    const rs = Array.isArray(rounds) ? rounds : [];
    if (rs.length === 0) return 0;
    const sum = rs.reduce((s, r) => s + (Number(r && r.accuracy) || 0), 0);
    return Math.round(sum / rs.length);
  }

  // Average per-module competency across saved sessions. Backwards-compatible
  // with old records that lack a `competencies` block (falls back to the
  // session-wide `percentage`). Returns zeros on empty history (no NaN).
  function competencyAverages(history) {
    const hist = Array.isArray(history) ? history : [];
    const keys = ["checklist", "instruments", "atc", "fault"];
    const result = { checklist: 0, instruments: 0, atc: 0, fault: 0 };
    if (hist.length === 0) return result;
    const sums = { checklist: 0, instruments: 0, atc: 0, fault: 0 };
    hist.forEach(h => {
      keys.forEach(k => {
        let v;
        if (h && h.competencies && Number.isFinite(Number(h.competencies[k]))) {
          v = Number(h.competencies[k]);
        } else {
          v = Number(h && h.percentage) || 0;
        }
        sums[k] += v;
      });
    });
    keys.forEach(k => { result[k] = Math.round(sums[k] / hist.length); });
    return result;
  }

  // ---- session summaries / game-facing labels ----

  function sessionTier(percentage) {
    const pct = clampPct(Number(percentage));
    if (pct >= 90) return { label: "ACE", className: "ace", celebration: "full" };
    if (pct >= 75) return { label: "SHARP", className: "sharp", celebration: "mini" };
    if (pct >= 50) return { label: "STEADY", className: "steady", celebration: "none" };
    return { label: "MISSED", className: "missed", celebration: "none" };
  }

  function averageAccuracy(rounds, fallback) {
    const rs = Array.isArray(rounds) ? rounds : [];
    if (rs.length === 0) return clampPct(Number(fallback) || 0);
    const sum = rs.reduce((acc, r) => acc + (Number(r && r.accuracy) || 0), 0);
    return clampPct(Math.round(sum / rs.length));
  }

  function sessionCompetencies(rounds, fallback) {
    const rs = Array.isArray(rounds) ? rounds : [];
    const result = {};
    ["checklist", "instruments", "atc", "fault"].forEach(key => {
      result[key] = averageAccuracy(rs.filter(r => r && r.module === key), fallback);
    });
    return result;
  }

  function sessionModuleAccuracy(rounds) {
    const rs = Array.isArray(rounds) ? rounds : [];
    const result = {};
    ["checklist", "instruments", "atc", "fault"].forEach(key => {
      const modRounds = rs.filter(r => r && r.module === key);
      if (modRounds.length > 0) result[key] = averageAccuracy(modRounds, 0);
    });
    return result;
  }

  function nextDailyStreak(lastPlayedDate, currentStreak, today) {
    const current = Math.max(0, Math.floor(Number(currentStreak) || 0));
    const todayDate = today ? new Date(today) : new Date();
    if (!Number.isFinite(todayDate.getTime())) return Math.max(1, current);
    const todayOnly = new Date(todayDate.toDateString());
    if (!lastPlayedDate) return 1;
    const lastDate = new Date(lastPlayedDate);
    if (!Number.isFinite(lastDate.getTime())) return 1;
    const lastOnly = new Date(lastDate.toDateString());
    const diffDays = Math.round((todayOnly - lastOnly) / 86400000);
    if (diffDays === 0) return Math.max(1, current);
    if (diffDays === 1) return current + 1;
    return 1;
  }
  // ---- randomness / data generation ----

  // Pure Fisher–Yates: returns a new shuffled array, leaving the input intact.
  function shuffle(array, rng) {
    rng = rng || Math.random;
    const a = Array.isArray(array) ? array.slice() : [];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function generateChecklist(pools, level, usedIdx, rng) {
    rng = rng || Math.random;
    const lvl = Number.isFinite(level) ? level : 1;
    const used = Array.isArray(usedIdx) ? usedIdx : [];
    const availableIdx = pools.map((_, i) => i).filter(i => !used.includes(i));
    const pickFrom = availableIdx.length > 0 ? availableIdx : pools.map((_, i) => i);
    const chosenIdx = pickFrom[Math.floor(rng() * pickFrom.length)];
    const checklist = pools[chosenIdx];
    const numSteps = Math.min(3 + lvl, checklist.steps.length);
    const expectedSteps = checklist.steps.slice(0, numSteps);

    let allOtherSteps = [];
    pools.forEach(c => { if (c.name !== checklist.name) allOtherSteps = allOtherSteps.concat(c.steps); });

    const numDistractors = Math.min(1 + Math.floor(lvl / 2), 3);
    const distractors = [];
    let guard = 0;
    while (distractors.length < numDistractors && allOtherSteps.length > 0 && guard++ < 1000) {
      const item = allOtherSteps[Math.floor(rng() * allOtherSteps.length)];
      if (!expectedSteps.includes(item) && !distractors.includes(item)) distractors.push(item);
    }

    return {
      title: checklist.name,
      expected: expectedSteps,
      pool: shuffle(expectedSteps.concat(distractors), rng),
      chosenIdx
    };
  }

  function generateInstruments(pools, level, rng) {
    rng = rng || Math.random;
    const lvl = Number.isFinite(level) ? level : 1;
    const count = lvl <= 2 ? 4 : (lvl <= 4 ? 6 : 8);
    const selectedGauges = shuffle(pools, rng).slice(0, count);

    const expected = selectedGauges.map(g => {
      const rawVal = rng() * (g.max - g.min) + g.min;
      let finalVal;
      if (g.label === "IAS" || g.label === "ALT" || g.label === "FF") finalVal = Math.round(rawVal / 5) * 5;
      else if (g.label === "N1" || g.label === "EGT" || g.label === "OIL") finalVal = Math.round(rawVal);
      else finalVal = Math.round(rawVal * 10) / 10;
      return { label: g.label, name: g.name, val: finalVal, unit: g.unit, min: g.min, max: g.max, color: g.color };
    });

    return { expected };
  }

  function pickUnused(pool, usedSet, rng) {
    rng = rng || Math.random;
    const candidates = [];
    pool.forEach((v, i) => { if (!usedSet.has(i)) candidates.push({ v, i }); });
    const source = candidates.length > 0 ? candidates : pool.map((v, i) => ({ v, i }));
    const picked = source[Math.floor(rng() * source.length)];
    usedSet.add(picked.i);
    return picked.v;
  }

  function generateATC(pools, level, usedState, rng) {
    rng = rng || Math.random;
    const lvl = Number.isFinite(level) ? level : 1;
    if (!usedState || !usedState.callsigns) {
      usedState = { callsigns: new Set(), facilities: new Set(), frequencies: new Set(), squawks: new Set() };
    }
    const callsign = pickUnused(pools.callsigns, usedState.callsigns, rng);
    const facility = pickUnused(pools.facilities, usedState.facilities, rng);
    const freq = pickUnused(pools.frequencies, usedState.frequencies, rng);
    const squawk = pickUnused(pools.squawks, usedState.squawks, rng);

    const windH = Math.floor(rng() * 36) * 10;
    const windS = Math.floor(rng() * 20) + 5;
    const windText = `WIND ${windH} AT ${windS} KNOTS`;

    const templates = lvl < 3 ? [
      `"${callsign}, ${facility}, CONTACT DEPARTURE ON ${freq}, SQUAWK ${squawk}."`,
      `"${facility}, ${callsign}, RADAR CONTACT, SQUAWK ${squawk}, MONITOR ${freq}."`,
      `"${callsign}, IDENT AND SQUAWK ${squawk}, CONTACT ${facility} ON ${freq}."`
    ] : [
      `"${callsign}, ${facility}, CONTACT DEPARTURE ON ${freq}, SQUAWK ${squawk}. ${windText}."`,
      `"${callsign}, CLEARED DIRECT, SQUAWK ${squawk}, ${windText}, CONTACT ${facility} ${freq}."`,
      `"${facility}, ${callsign}, SQUAWK ${squawk}, ${windText}, MONITOR ${freq}."`,
      `"${callsign}, ${facility}, ${windText}, IDENT SQUAWK ${squawk} ON ${freq}."`
    ];
    const displayText = templates[Math.floor(rng() * templates.length)];

    return { expected: { callsign, facility, freq, squawk }, displayText, usedState };
  }

  function generateFault(pools, level, usedIdx, rng) {
    rng = rng || Math.random;
    const lvl = Number.isFinite(level) ? level : 1;
    const used = Array.isArray(usedIdx) ? usedIdx : [];
    const availableIndices = pools.map((_, i) => i).filter(i => !used.includes(i));
    const pickFrom = availableIndices.length > 0 ? availableIndices : pools.map((_, i) => i);
    const chosenIdx = pickFrom[Math.floor(rng() * pickFrom.length)];
    const fault = pools[chosenIdx];
    const expectedChain = [fault.symptom, fault.system, fault.action];

    let otherItems = [];
    pools.forEach(f => {
      if (f.symptom !== fault.symptom) {
        otherItems.push(f.symptom);
        otherItems.push(f.system);
        otherItems.push(f.action);
      }
    });

    const distractorsCount = Math.min(lvl, 3);
    const distractors = [];
    let guard = 0;
    // NOTE: `otherItems.length > 0` guard prevents the infinite loop that the
    // original implementation could hit when the distractor pool is too small.
    while (distractors.length < distractorsCount && otherItems.length > 0 && guard++ < 1000) {
      const item = otherItems[Math.floor(rng() * otherItems.length)];
      if (!expectedChain.includes(item) && !distractors.includes(item)) distractors.push(item);
    }

    return {
      symptom: fault.symptom,
      expected: expectedChain,
      pool: shuffle(expectedChain.concat(distractors), rng),
      chosenIdx
    };
  }

  return {
    MAX_LEVEL,
    safeParse,
    safeNumber,
    computeLevel,
    gaugePercent,
    selectModule,
    checklistAccuracy,
    instrumentsAccuracy,
    atcAccuracy,
    faultAccuracy,
    sessionGrade,
    competencyAverages,
    sessionTier,
    averageAccuracy,
    sessionCompetencies,
    sessionModuleAccuracy,
    nextDailyStreak,
    shuffle,
    pickUnused,
    generateChecklist,
    generateInstruments,
    generateATC,
    generateFault
  };
});
