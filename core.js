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

  // ---- module metadata and skill families ----

  const SKILL_FAMILIES = ["logical", "spatial", "visual", "memory", "advanced"];
  const CHALLENGE_MODULE_KEYS = ["checklist", "instruments", "atc", "fault", "balance", "wire", "clearance", "target", "intercept"];

  const MODULE_METADATA = {
    checklist: { label: "Checklist", skillFamily: "memory", skillLabel: "Memory" },
    instruments: { label: "Instruments", skillFamily: "visual", skillLabel: "Visual" },
    atc: { label: "ATC", skillFamily: "memory", skillLabel: "Memory" },
    fault: { label: "Fault", skillFamily: "logical", skillLabel: "Logical" },
    balance: { label: "Balance Bender", skillFamily: "logical", skillLabel: "Logical" },
    wire: { label: "Wire Trace", skillFamily: "visual", skillLabel: "Visual" },
    target: { label: "Target Scan", skillFamily: "visual", skillLabel: "Visual" },
    clearance: { label: "Clearance Recall", skillFamily: "memory", skillLabel: "Memory" },
    attitude: { label: "Attitude Vector", skillFamily: "spatial", skillLabel: "Spatial" },
    beacon: { label: "Beacon Bearing", skillFamily: "spatial", skillLabel: "Spatial" },
    intercept: { label: "Aero Intercept", skillFamily: "advanced", skillLabel: "Advanced" },
    capacity: { label: "Cockpit Capacity", skillFamily: "advanced", skillLabel: "Advanced" }
  };

  function titleCaseFamily(key) {
    const text = String(key || "");
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : "Unknown";
  }

  function moduleMetadata(module) {
    const key = String(module || "").toLowerCase();
    const meta = MODULE_METADATA[key];
    if (meta) return Object.assign({ key }, meta);
    return { key, label: key ? titleCaseFamily(key) : "Unknown", skillFamily: "advanced", skillLabel: "Advanced" };
  }

  function moduleSkillFamily(module) {
    return moduleMetadata(module).skillFamily;
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
    CHALLENGE_MODULE_KEYS.forEach(key => {
      result[key] = averageAccuracy(rs.filter(r => r && r.module === key), fallback);
    });
    return result;
  }

  function sessionModuleAccuracy(rounds) {
    const rs = Array.isArray(rounds) ? rounds : [];
    const result = {};
    CHALLENGE_MODULE_KEYS.forEach(key => {
      const modRounds = rs.filter(r => r && r.module === key);
      if (modRounds.length > 0) result[key] = averageAccuracy(modRounds, 0);
    });
    return result;
  }

  function sessionSkillFamilyAccuracy(rounds, fallback) {
    const rs = Array.isArray(rounds) ? rounds : [];
    const result = {};
    SKILL_FAMILIES.forEach(key => {
      const familyRounds = rs.filter(r => r && ((r.skillFamily || moduleSkillFamily(r.module)) === key));
      if (familyRounds.length > 0) result[key] = averageAccuracy(familyRounds, 0);
      else if (fallback !== undefined) result[key] = clampPct(Number(fallback) || 0);
    });
    return result;
  }

  function skillFamilyAverages(history) {
    const hist = Array.isArray(history) ? history : [];
    const result = {};
    const sums = {};
    const counts = {};
    SKILL_FAMILIES.forEach(key => {
      result[key] = 0;
      sums[key] = 0;
      counts[key] = 0;
    });
    if (hist.length === 0) return result;

    hist.forEach(h => {
      const record = h || {};
      if (record.skillFamilyAccuracy) {
        SKILL_FAMILIES.forEach(key => {
          if (Number.isFinite(Number(record.skillFamilyAccuracy[key]))) {
            sums[key] += Number(record.skillFamilyAccuracy[key]);
            counts[key]++;
          }
        });
        return;
      }

      if (record.moduleAccuracy || record.competencies) {
        const moduleData = record.moduleAccuracy || record.competencies;
        Object.keys(moduleData).forEach(moduleKey => {
          const family = moduleSkillFamily(moduleKey);
          if (!SKILL_FAMILIES.includes(family)) return;
          const value = Number(moduleData[moduleKey]);
          if (!Number.isFinite(value)) return;
          sums[family] += value;
          counts[family]++;
        });
        return;
      }

      const fallback = Number(record.percentage);
      if (Number.isFinite(fallback)) {
        SKILL_FAMILIES.forEach(key => {
          sums[key] += fallback;
          counts[key]++;
        });
      }
    });

    SKILL_FAMILIES.forEach(key => {
      result[key] = counts[key] > 0 ? clampPct(Math.round(sums[key] / counts[key])) : 0;
    });
    return result;
  }

  function weakestSkillFamily(history) {
    const averages = skillFamilyAverages(history);
    const populated = SKILL_FAMILIES
      .filter(key => averages[key] > 0)
      .map(key => ({ key, label: titleCaseFamily(key), accuracy: averages[key] }));
    if (populated.length === 0) return null;
    populated.sort((a, b) => a.accuracy - b.accuracy || SKILL_FAMILIES.indexOf(a.key) - SKILL_FAMILIES.indexOf(b.key));
    return populated[0];
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


  function makeShapeCount(shape, count) {
    return { shape, count };
  }

  function itemTotal(items, weights) {
    return (Array.isArray(items) ? items : []).reduce((sum, item) => sum + (weights[item.shape] || 0) * item.count, 0);
  }

  function generateBalance(level, rng) {
    rng = rng || Math.random;
    const lvl = Number.isFinite(level) ? level : 1;
    const shapes = ["orange", "green"];
    const weights = { orange: 1, green: 2, cyan: 3, rose: 4 };
    const questionTotal = Math.min(4 + Math.floor(lvl / 2), 9);
    const correctShape = shapes[Math.floor(rng() * Math.min(2 + Math.floor(lvl / 3), shapes.length))];
    const correctCount = Math.max(1, Math.round(questionTotal / weights[correctShape]));
    const correctTotal = correctCount * weights[correctShape];
    const leftItems = [makeShapeCount("orange", correctTotal)];
    const correctItems = [makeShapeCount(correctShape, correctCount)];

    const options = [{ id: "A", items: correctItems, total: correctTotal }];
    let optionCode = 66;
    let guard = 0;
    while (options.length < 5 && guard++ < 100) {
      const shape = shapes[Math.floor(rng() * shapes.length)];
      const delta = [-2, -1, 1, 2][Math.floor(rng() * 4)];
      const count = Math.max(1, correctCount + delta + Math.floor(rng() * 2));
      const total = count * weights[shape];
      if (total === correctTotal) continue;
      if (options.some(o => o.items[0].shape === shape && o.items[0].count === count)) continue;
      options.push({ id: String.fromCharCode(optionCode++), items: [makeShapeCount(shape, count)], total });
    }

    const shuffled = shuffle(options, rng).map((opt, idx) => Object.assign({}, opt, { id: String.fromCharCode(65 + idx) }));
    const correct = shuffled.find(opt => opt.total === correctTotal);
    return {
      rule: { left: [makeShapeCount("orange", 2)], right: [makeShapeCount("green", 1)] },
      question: { left: leftItems, targetTotal: correctTotal },
      options: shuffled.map(({ id, items }) => ({ id, items })),
      expected: correct.id,
      weights
    };
  }

  function balanceAccuracy(expected, input) {
    return String(expected || "") === String(input || "") ? 100 : 0;
  }

  function generateWire(level, rng) {
    rng = rng || Math.random;
    const lvl = Number.isFinite(level) ? level : 1;
    const count = Math.min(5 + Math.floor(lvl / 2), 10);
    const starts = "ABCDEFGHIJKL".slice(0, count).split("");
    const ends = Array.from({ length: count }, (_, i) => String(i + 1));
    const shuffledEnds = shuffle(ends, rng);
    const mappings = starts.map((start, idx) => ({ start, end: shuffledEnds[idx] }));
    const query = mappings[Math.floor(rng() * mappings.length)];
    return { starts, ends, mappings, queryStart: query.start, expected: query.end };
  }

  function wireAccuracy(expected, input) {
    return String(expected || "") === String(input || "") ? 100 : 0;
  }

  function generateClearance(pools, level, rng) {
    rng = rng || Math.random;
    const lvl = Number.isFinite(level) ? level : 1;
    const callsign = pools.callsigns[Math.floor(rng() * pools.callsigns.length)];
    const facility = pools.facilities[Math.floor(rng() * pools.facilities.length)];
    const freq = pools.frequencies[Math.floor(rng() * pools.frequencies.length)];
    const squawk = pools.squawks[Math.floor(rng() * pools.squawks.length)];
    const altitude = `${(Math.floor(rng() * 24) + 6) * 1000}`;
    const heading = String(Math.floor(rng() * 36) * 10).padStart(3, "0");
    const speed = String((Math.floor(rng() * 9) + 22) * 10);
    const expected = { callsign, facility, freq, squawk, altitude, heading, speed };
    const displayText = lvl < 4
      ? `"${callsign}, ${facility}, CLIMB AND MAINTAIN ${altitude}, FLY HEADING ${heading}, CONTACT ${freq}, SQUAWK ${squawk}."`
      : `"${callsign}, ${facility}, CLIMB AND MAINTAIN ${altitude}, SPEED ${speed}, FLY HEADING ${heading}, CONTACT ${freq}, SQUAWK ${squawk}."`;
    return { expected, displayText };
  }

  function clearanceAccuracy(expected, inputs) {
    const exp = expected || {}, inp = inputs || {};
    const fields = ["callsign", "facility", "freq", "squawk", "altitude", "heading", "speed"];
    let errors = 0;
    fields.forEach(f => {
      const e = String(exp[f] === undefined || exp[f] === null ? "" : exp[f]).trim().toUpperCase();
      const i = String(inp[f] === undefined || inp[f] === null ? "" : inp[f]).trim().toUpperCase();
      if (e !== i) errors++;
    });
    return clampPct(Math.round(((fields.length - errors) / fields.length) * 100));
  }

  function generateTarget(level, rng) {
    rng = rng || Math.random;
    const lvl = Number.isFinite(level) ? level : 1;
    const size = lvl >= 5 ? 5 : 4;
    const colors = ["blue", "amber", "green", "rose"];
    const shapes = ["circle", "square", "triangle", "diamond"];
    const targetColor = colors[Math.floor(rng() * colors.length)];
    const targetShape = shapes[Math.floor(rng() * shapes.length)];
    const cells = [];
    for (let i = 0; i < size * size; i++) {
      cells.push({
        color: colors[Math.floor(rng() * colors.length)],
        shape: shapes[Math.floor(rng() * shapes.length)]
      });
    }
    if (!cells.some(c => c.color === targetColor && c.shape === targetShape)) {
      cells[Math.floor(rng() * cells.length)] = { color: targetColor, shape: targetShape };
    }
    const expected = cells.filter(c => c.color === targetColor && c.shape === targetShape).length;
    return { size, targetColor, targetShape, cells, expected };
  }

  function targetAccuracy(expected, input) {
    return Number(expected) === Number(input) ? 100 : 0;
  }

  function generateIntercept(level, rng) {
    rng = rng || Math.random;
    const lvl = Number.isFinite(level) ? level : 1;
    const altitude = (Math.floor(rng() * 28) + 8) * 1000;
    const bandLow = 16000;
    const bandHigh = 24000;
    const bandStatus = altitude < bandLow ? "LOW" : altitude > bandHigh ? "HIGH" : "IN BAND";
    const expectedAction = altitude < bandLow ? "CLIMB" : altitude > bandHigh ? "DESCEND" : "HOLD";
    const quizA = Math.floor(rng() * 7) + lvl;
    const quizB = Math.floor(rng() * 7) + 3;
    const expectedQuiz = quizA + quizB;
    return {
      altitude,
      bandLow,
      bandHigh,
      bandStatus,
      targetBearing: Math.floor(rng() * 360),
      expected: { action: expectedAction, quiz: expectedQuiz },
      quiz: `${quizA} + ${quizB}`
    };
  }

  function interceptAccuracy(expected, input) {
    const exp = expected || {}, inp = input || {};
    const actionCorrect = String(exp.action || "") === String(inp.action || "");
    const quizCorrect = Number(exp.quiz) === Number(inp.quiz);
    return (actionCorrect ? 50 : 0) + (quizCorrect ? 50 : 0);
  }
  return {
    MAX_LEVEL,
    SKILL_FAMILIES,
    CHALLENGE_MODULE_KEYS,
    MODULE_METADATA,
    safeParse,
    safeNumber,
    computeLevel,
    gaugePercent,
    moduleMetadata,
    moduleSkillFamily,
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
    sessionSkillFamilyAccuracy,
    skillFamilyAverages,
    weakestSkillFamily,
    nextDailyStreak,
    shuffle,
    pickUnused,
    generateChecklist,
    generateInstruments,
    generateATC,
    generateFault,
    generateBalance,
    balanceAccuracy,
    generateWire,
    wireAccuracy,
    generateClearance,
    clearanceAccuracy,
    generateTarget,
    targetAccuracy,
    generateIntercept,
    interceptAccuracy
  };
});
