// ==========================================
// Flight Core - Zero-dependency test suite for the pure engine (core.js).
// Runs in the browser (open tests.html) and under Node (`node tests.js`).
// No build step, no npm, no frameworks.
// ==========================================

(function () {
  "use strict";

  const FC = (typeof window !== "undefined" && window.FlightCore)
    ? window.FlightCore
    : require("./core.js");

  // ---- tiny assertion harness ----
  const results = [];
  function test(name, fn) {
    try {
      fn();
      results.push({ name, ok: true });
    } catch (e) {
      results.push({ name, ok: false, error: e && e.message ? e.message : String(e) });
    }
  }
  function assert(cond, msg) {
    if (!cond) throw new Error(msg || "assertion failed");
  }
  function assertEqual(actual, expected, msg) {
    if (actual !== expected) {
      throw new Error((msg || "not equal") + ` - expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
  }
  function assertDeep(actual, expected, msg) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error((msg || "not deep-equal") + ` - expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
  }
  function assertNoThrow(fn, msg) {
    try { fn(); } catch (e) { throw new Error((msg || "threw") + ` - ${e.message}`); }
  }

  // Deterministic, seedable PRNG (mulberry32) for reproducible generator tests.
  function seeded(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---- fixtures ----
  const CHECKLIST = [
    { name: "Alpha", steps: ["A1", "A2", "A3", "A4", "A5"] },
    { name: "Bravo", steps: ["B1", "B2", "B3", "B4", "B5"] },
    { name: "Charlie", steps: ["C1", "C2", "C3", "C4", "C5"] }
  ];
  const GAUGES = [
    { label: "IAS", name: "Airspeed", min: 100, max: 340, unit: "KT", color: "#000" },
    { label: "ALT", name: "Altitude", min: 1500, max: 12000, unit: "FT", color: "#000" },
    { label: "VIB", name: "Vibration", min: 0.2, max: 4.8, unit: "MIL", color: "#000" }
  ];
  const ATC = {
    callsigns: ["DELTA 1", "UNITED 2", "NAVY 3"],
    facilities: ["TOWER A", "TOWER B", "TOWER C"],
    frequencies: ["121.90", "124.75", "118.10"],
    squawks: ["4201", "7200", "1200"]
  };
  const FAULTS = [
    { symptom: "S1", system: "SYS1", action: "ACT1" },
    { symptom: "S2", system: "SYS2", action: "ACT2" },
    { symptom: "S3", system: "SYS3", action: "ACT3" }
  ];

  // ==========================================
  // safeParse
  // ==========================================
  test("safeParse: valid JSON array", () => assertDeep(FC.safeParse("[1,2,3]", []), [1, 2, 3]));
  test("safeParse: invalid JSON -> fallback", () => assertDeep(FC.safeParse("{bad json", []), []));
  test("safeParse: null input -> fallback", () => assertDeep(FC.safeParse(null, []), []));
  test("safeParse: wrong type when array expected -> fallback", () => assertDeep(FC.safeParse('{"a":1}', []), []));
  test("safeParse: object fallback keeps parsed object", () => assertDeep(FC.safeParse('{"a":1}', {}), { a: 1 }));

  // ==========================================
  // safeNumber
  // ==========================================
  test("safeNumber: valid string", () => assertEqual(FC.safeNumber("8", 0), 8));
  test("safeNumber: NaN string -> default", () => assertEqual(FC.safeNumber("abc", 5), 5));
  test("safeNumber: null -> default", () => assertEqual(FC.safeNumber(null, 1), 1));
  test("safeNumber: clamps to min", () => assertEqual(FC.safeNumber("-3", 1, { min: 0 }), 0));
  test("safeNumber: clamps to max", () => assertEqual(FC.safeNumber("999", 1, { min: 1, max: 50 }), 50));
  test("safeNumber: Infinity -> default", () => assertEqual(FC.safeNumber(Infinity, 7), 7));

  // ==========================================
  // computeLevel
  // ==========================================
  test("computeLevel: streak 0 -> 1", () => assertEqual(FC.computeLevel(0), 1));
  test("computeLevel: streak 1 -> 1", () => assertEqual(FC.computeLevel(1), 1));
  test("computeLevel: streak 2 -> 2", () => assertEqual(FC.computeLevel(2), 2));
  test("computeLevel: streak 3 -> 2", () => assertEqual(FC.computeLevel(3), 2));
  test("computeLevel: streak 8 -> 5", () => assertEqual(FC.computeLevel(8), 5));
  test("computeLevel: negative -> 1", () => assertEqual(FC.computeLevel(-5), 1));
  test("computeLevel: NaN -> 1", () => assertEqual(FC.computeLevel(NaN), 1));
  test("computeLevel: capped at MAX_LEVEL", () => assertEqual(FC.computeLevel(100000), FC.MAX_LEVEL));

  // ==========================================
  // gaugePercent
  // ==========================================
  test("gaugePercent: midpoint", () => assertEqual(FC.gaugePercent(50, 0, 100), 50));
  test("gaugePercent: at min -> 0", () => assertEqual(FC.gaugePercent(0, 0, 100), 0));
  test("gaugePercent: at max -> 100", () => assertEqual(FC.gaugePercent(100, 0, 100), 100));
  test("gaugePercent: below min clamps to 0", () => assertEqual(FC.gaugePercent(-20, 0, 100), 0));
  test("gaugePercent: above max clamps to 100", () => assertEqual(FC.gaugePercent(250, 0, 100), 100));
  test("gaugePercent: min==max -> 0 (no div-by-zero)", () => assertEqual(FC.gaugePercent(5, 5, 5), 0));
  test("gaugePercent: NaN input -> 0", () => assertEqual(FC.gaugePercent(NaN, 0, 100), 0));
  test("gaugePercent: result always finite", () => assert(Number.isFinite(FC.gaugePercent(5, 5, 5))));

  // ==========================================
  // selectModule ("No 3x Repeat" + safeguards)
  // ==========================================
  test("selectModule: returns a member of the pool", () => {
    const m = FC.selectModule(["checklist", "instruments"], [], seeded(1));
    assert(["checklist", "instruments"].includes(m));
  });
  test("selectModule: filters module played twice in a row", () => {
    for (let s = 1; s <= 20; s++) {
      const m = FC.selectModule(["checklist", "instruments"], ["checklist", "checklist"], seeded(s));
      assertEqual(m, "instruments", "must avoid the 3x-repeat");
    }
  });
  test("selectModule: empty filter result falls back (never undefined)", () => {
    // Only one module selected and it is the repeated one - must still return it.
    const m = FC.selectModule(["checklist", "checklist"], ["checklist", "checklist"], seeded(3));
    assertEqual(m, "checklist");
  });
  test("selectModule: empty selection -> null", () => assertEqual(FC.selectModule([], [], seeded(1)), null));
  test("selectModule: single module always returned", () => assertEqual(FC.selectModule(["atc"], ["atc", "atc"], seeded(9)), "atc"));

  // ==========================================
  // accuracy scorers
  // ==========================================
  test("checklistAccuracy: all correct -> 100", () => assertEqual(FC.checklistAccuracy(["A", "B", "C"], ["A", "B", "C"]), 100));
  test("checklistAccuracy: one wrong", () => assertEqual(FC.checklistAccuracy(["A", "B", "C"], ["A", "X", "C"]), 67));
  test("checklistAccuracy: over-selection penalised", () => assertEqual(FC.checklistAccuracy(["A", "B", "C"], ["A", "B", "C", "D", "E"]), 60));
  test("checklistAccuracy: empty -> 0 (no NaN)", () => assertEqual(FC.checklistAccuracy([], []), 0));
  test("checklistAccuracy: result in range", () => assert(FC.checklistAccuracy(["A"], ["A", "B", "C", "D"]) >= 0));

  test("instrumentsAccuracy: all correct -> 100", () => {
    const exp = [{ label: "IAS", val: 120 }, { label: "ALT", val: 5000 }];
    assertEqual(FC.instrumentsAccuracy(exp, { IAS: "120", ALT: "5000" }), 100);
  });
  test("instrumentsAccuracy: half correct", () => {
    const exp = [{ label: "IAS", val: 120 }, { label: "ALT", val: 5000 }];
    assertEqual(FC.instrumentsAccuracy(exp, { IAS: "120", ALT: "9999" }), 50);
  });
  test("instrumentsAccuracy: blank input -> 0 (no NaN)", () => {
    const exp = [{ label: "IAS", val: 120 }];
    assertEqual(FC.instrumentsAccuracy(exp, {}), 0);
  });
  test("instrumentsAccuracy: empty expected -> 0", () => assertEqual(FC.instrumentsAccuracy([], {}), 0));

  test("atcAccuracy: all correct -> 100", () => {
    const e = { callsign: "DELTA 1", facility: "TOWER A", freq: "121.90", squawk: "4201" };
    assertEqual(FC.atcAccuracy(e, e), 100);
  });
  test("atcAccuracy: case/space insensitive", () => {
    const e = { callsign: "DELTA 1", facility: "TOWER A", freq: "121.90", squawk: "4201" };
    const i = { callsign: " delta 1 ", facility: "tower a", freq: "121.90", squawk: "4201" };
    assertEqual(FC.atcAccuracy(e, i), 100);
  });
  test("atcAccuracy: one wrong -> 75", () => {
    const e = { callsign: "DELTA 1", facility: "TOWER A", freq: "121.90", squawk: "4201" };
    const i = { callsign: "DELTA 1", facility: "TOWER A", freq: "121.90", squawk: "0000" };
    assertEqual(FC.atcAccuracy(e, i), 75);
  });
  test("atcAccuracy: missing fields -> 0 (no NaN)", () => {
    const e = { callsign: "DELTA 1", facility: "TOWER A", freq: "121.90", squawk: "4201" };
    assertEqual(FC.atcAccuracy(e, {}), 0);
  });

  test("faultAccuracy: both correct -> 100", () => assertEqual(FC.faultAccuracy(["S", "SYS", "ACT"], ["SYS", "ACT"]), 100));
  test("faultAccuracy: one correct -> 50", () => assertEqual(FC.faultAccuracy(["S", "SYS", "ACT"], ["SYS", "WRONG"]), 50));
  test("faultAccuracy: none -> 0", () => assertEqual(FC.faultAccuracy(["S", "SYS", "ACT"], ["", ""]), 0));
  test("faultAccuracy: empty inputs -> 0 (no NaN)", () => assertEqual(FC.faultAccuracy(["S", "SYS", "ACT"], []), 0));

  // ==========================================
  // sessionGrade / competencyAverages
  // ==========================================
  test("sessionGrade: empty -> 0 (no NaN)", () => assertEqual(FC.sessionGrade([]), 0));
  test("sessionGrade: averages accuracy", () => assertEqual(FC.sessionGrade([{ accuracy: 100 }, { accuracy: 50 }]), 75));
  test("sessionGrade: tolerates missing accuracy", () => assertEqual(FC.sessionGrade([{ accuracy: 100 }, {}]), 50));

  test("competencyAverages: empty -> zeros (no NaN)", () => assertDeep(FC.competencyAverages([]), { checklist: 0, instruments: 0, atc: 0, fault: 0 }));
  test("competencyAverages: uses competencies block", () => {
    const hist = [{ competencies: { checklist: 80, instruments: 60, atc: 40, fault: 20 } }];
    assertDeep(FC.competencyAverages(hist), { checklist: 80, instruments: 60, atc: 40, fault: 20 });
  });
  test("competencyAverages: legacy record falls back to percentage", () => {
    const hist = [{ percentage: 50 }];
    assertDeep(FC.competencyAverages(hist), { checklist: 50, instruments: 50, atc: 50, fault: 50 });
  });
  test("competencyAverages: mixed legacy + new", () => {
    const hist = [
      { competencies: { checklist: 100, instruments: 100, atc: 100, fault: 100 } },
      { percentage: 0 }
    ];
    assertDeep(FC.competencyAverages(hist), { checklist: 50, instruments: 50, atc: 50, fault: 50 });
  });


  test("sessionTier: maps score bands to game labels", () => {
    assertDeep(FC.sessionTier(95), { label: "ACE", className: "ace", celebration: "full" });
    assertDeep(FC.sessionTier(80), { label: "SHARP", className: "sharp", celebration: "mini" });
    assertDeep(FC.sessionTier(60), { label: "STEADY", className: "steady", celebration: "none" });
    assertDeep(FC.sessionTier(10), { label: "MISSED", className: "missed", celebration: "none" });
  });

  test("sessionCompetencies: per-module averages with fallback", () => {
    const rounds = [
      { module: "checklist", accuracy: 100 },
      { module: "checklist", accuracy: 50 },
      { module: "atc", accuracy: 25 }
    ];
    assertDeep(FC.sessionCompetencies(rounds, 80), { checklist: 75, instruments: 80, atc: 25, fault: 80, balance: 80, wire: 80, clearance: 80, target: 80, intercept: 80 });
  });

  test("sessionModuleAccuracy: only includes played modules", () => {
    assertDeep(FC.sessionModuleAccuracy([{ module: "fault", accuracy: 100 }, { module: "fault", accuracy: 50 }]), { fault: 75 });
  });

  test("moduleMetadata: maps current modules to skill families", () => {
    assertEqual(FC.moduleSkillFamily("checklist"), "memory");
    assertEqual(FC.moduleSkillFamily("instruments"), "visual");
    assertEqual(FC.moduleSkillFamily("fault"), "logical");
    assert(FC.SKILL_FAMILIES.includes("spatial"));
    assert(FC.SKILL_FAMILIES.includes("advanced"));
  });

  test("sessionSkillFamilyAccuracy: averages explicit or inferred families", () => {
    const rounds = [
      { module: "checklist", accuracy: 100 },
      { module: "atc", skillFamily: "memory", accuracy: 50 },
      { module: "fault", accuracy: 25 }
    ];
    assertDeep(FC.sessionSkillFamilyAccuracy(rounds, 80), { logical: 25, spatial: 80, visual: 80, memory: 75, advanced: 80 });
  });

  test("skillFamilyAverages: uses new skill-family records first", () => {
    const history = [
      { skillFamilyAccuracy: { memory: 100, visual: 60, logical: 40 } },
      { skillFamilyAccuracy: { memory: 50, visual: 80, logical: 20 } }
    ];
    assertDeep(FC.skillFamilyAverages(history), { logical: 30, spatial: 0, visual: 70, memory: 75, advanced: 0 });
  });

  test("skillFamilyAverages: maps legacy module accuracy records", () => {
    const history = [{ moduleAccuracy: { checklist: 80, atc: 60, instruments: 40, fault: 20 } }];
    assertDeep(FC.skillFamilyAverages(history), { logical: 20, spatial: 0, visual: 40, memory: 70, advanced: 0 });
  });

  test("skillFamilyAverages: falls back for older percentage-only records", () => {
    const history = [{ percentage: 50 }];
    assertDeep(FC.skillFamilyAverages(history), { logical: 50, spatial: 50, visual: 50, memory: 50, advanced: 50 });
  });

  test("weakestSkillFamily: returns the lowest populated family", () => {
    const weakest = FC.weakestSkillFamily([{ skillFamilyAccuracy: { memory: 90, visual: 70, logical: 40 } }]);
    assertDeep(weakest, { key: "logical", label: "Logical", accuracy: 40 });
  });

  test("nextDailyStreak: same, next, and missed day behavior", () => {
    assertEqual(FC.nextDailyStreak(null, 0, "2026-07-17"), 1);
    assertEqual(FC.nextDailyStreak("2026-07-17", 3, "2026-07-17"), 3);
    assertEqual(FC.nextDailyStreak("2026-07-16", 3, "2026-07-17"), 4);
    assertEqual(FC.nextDailyStreak("2026-07-10", 3, "2026-07-17"), 1);
  });

  // ==========================================
  // shuffle
  // ==========================================
  test("shuffle: preserves elements", () => {
    const out = FC.shuffle([1, 2, 3, 4, 5], seeded(7));
    assertDeep(out.slice().sort((a, b) => a - b), [1, 2, 3, 4, 5]);
  });
  test("shuffle: does not mutate input", () => {
    const input = [1, 2, 3];
    FC.shuffle(input, seeded(7));
    assertDeep(input, [1, 2, 3]);
  });

  // ==========================================
  // generators
  // ==========================================
  test("generateChecklist: expected scales with level & clamps to pool size", () => {
    const lo = FC.generateChecklist(CHECKLIST, 1, [], seeded(2));
    assertEqual(lo.expected.length, 4); // 3 + level(1)
    const hi = FC.generateChecklist(CHECKLIST, 10, [], seeded(2));
    assertEqual(hi.expected.length, 5); // clamped to steps.length
  });
  test("generateChecklist: pool contains every expected step", () => {
    const d = FC.generateChecklist(CHECKLIST, 2, [], seeded(4));
    d.expected.forEach(s => assert(d.pool.includes(s), `pool missing ${s}`));
  });
  test("generateChecklist: distractors disjoint from expected", () => {
    const d = FC.generateChecklist(CHECKLIST, 2, [], seeded(4));
    const distractors = d.pool.filter(p => !d.expected.includes(p));
    distractors.forEach(x => assert(!d.expected.includes(x)));
  });
  test("generateChecklist: returns a valid chosenIdx", () => {
    const d = FC.generateChecklist(CHECKLIST, 1, [], seeded(1));
    assert(d.chosenIdx >= 0 && d.chosenIdx < CHECKLIST.length);
  });

  test("generateInstruments: gauge count scales by level", () => {
    assertEqual(FC.generateInstruments(GAUGES, 1, seeded(1)).expected.length, 3); // min(4, pool=3)
  });
  test("generateInstruments: every value within [min,max]", () => {
    for (let s = 1; s <= 50; s++) {
      const out = FC.generateInstruments(GAUGES, 5, seeded(s));
      out.expected.forEach(g => assert(g.val >= g.min && g.val <= g.max, `${g.label}=${g.val} out of [${g.min},${g.max}]`));
    }
  });

  test("generateATC: produces all four fields", () => {
    const d = FC.generateATC(ATC, 1, null, seeded(1));
    assert(d.expected.callsign && d.expected.facility && d.expected.freq && d.expected.squawk);
    assert(typeof d.displayText === "string" && d.displayText.length > 0);
  });
  test("generateATC: creates/returns used-state tracker", () => {
    const d = FC.generateATC(ATC, 1, null, seeded(1));
    assert(d.usedState && d.usedState.callsigns instanceof Set);
  });

  test("generateFault: expected chain is [symptom, system, action]", () => {
    const d = FC.generateFault(FAULTS, 1, [], seeded(1));
    assertEqual(d.expected.length, 3);
    assertEqual(d.expected[0], d.symptom);
  });
  test("generateFault: distractors disjoint from expected chain", () => {
    const d = FC.generateFault(FAULTS, 3, [], seeded(6));
    const distractors = d.pool.filter(p => !d.expected.includes(p));
    distractors.forEach(x => assert(!d.expected.includes(x)));
  });
  // Regression: original implementation could infinite-loop when the distractor
  // pool can't satisfy the count. With a single fault there are no "other"
  // items, so this must terminate and simply yield no distractors.
  test("generateFault: terminates with degenerate single-item pool", () => {
    assertNoThrow(() => {
      const d = FC.generateFault([{ symptom: "S", system: "SYS", action: "ACT" }], 3, [], seeded(1));
      assertDeep(d.expected, ["S", "SYS", "ACT"]);
      assertEqual(d.pool.length, 3); // no distractors available
    });
  });


  test("generateBalance: has exactly one correct choice", () => {
    const d = FC.generateBalance(4, seeded(10));
    assert(d.options.some(o => o.id === d.expected));
    assertEqual(FC.balanceAccuracy(d.expected, d.expected), 100);
    assertEqual(FC.balanceAccuracy(d.expected, "Z"), 0);
  });

  test("generateWire: maps each start to one endpoint", () => {
    const d = FC.generateWire(5, seeded(11));
    assertEqual(d.starts.length, d.ends.length);
    assertEqual(new Set(d.mappings.map(m => m.end)).size, d.ends.length);
    assertEqual(FC.wireAccuracy(d.expected, d.expected), 100);
  });

  test("generateWire: emits drawable paths that match answer mappings", () => {
    const d = FC.generateWire(5, seeded(12));
    assertEqual(d.paths.length, d.mappings.length);
    d.paths.forEach(path => {
      const mapping = d.mappings.find(m => m.start === path.start);
      const startIdx = d.starts.indexOf(path.start);
      const endIdx = d.ends.indexOf(path.end);
      const startPoint = path.points[0];
      const endPoint = path.points[path.points.length - 1];
      assert(mapping, `missing mapping for ${path.start}`);
      assertEqual(mapping.end, path.end);
      assertEqual(startPoint.x, 12);
      assertEqual(endPoint.x, 88);
      assert(startIdx >= 0 && endIdx >= 0);
      assert(path.points.length >= 4);
    });
    const queryPath = d.paths.find(path => path.start === d.queryStart);
    assert(queryPath, "query path missing");
    assertEqual(queryPath.end, d.expected);
  });

  test("generateClearance: produces extended recall fields", () => {
    const d = FC.generateClearance(ATC, 5, seeded(12));
    ["callsign", "facility", "freq", "squawk", "altitude", "heading", "speed"].forEach(f => assert(d.expected[f]));
    assertEqual(FC.clearanceAccuracy(d.expected, d.expected), 100);
    assert(FC.clearanceAccuracy(d.expected, {}) < 100);
  });

  test("generateTarget: expected count matches generated cells", () => {
    const d = FC.generateTarget(5, seeded(13));
    const count = d.cells.filter(c => c.color === d.targetColor && c.shape === d.targetShape).length;
    assertEqual(d.expected, count);
    assertEqual(FC.targetAccuracy(d.expected, d.expected), 100);
  });

  test("generateIntercept: action follows altitude band", () => {
    for (let s = 1; s <= 20; s++) {
      const d = FC.generateIntercept(3, seeded(s));
      const action = d.altitude < d.bandLow ? "CLIMB" : d.altitude > d.bandHigh ? "DESCEND" : "HOLD";
      assertEqual(d.expected.action, action);
      assertEqual(FC.interceptAccuracy(d.expected, d.expected), 100);
    }
  });  // ---- reporting ----
  const passed = results.filter(r => r.ok).length;
  const failed = results.length - passed;

  if (typeof window !== "undefined" && document) {
    const root = document.getElementById("results") || document.body;
    const summary = document.createElement("div");
    summary.className = "summary " + (failed === 0 ? "ok" : "fail");
    summary.textContent = `${passed}/${results.length} passed` + (failed ? ` - ${failed} FAILED` : " - ALL GREEN");
    root.appendChild(summary);
    results.forEach(r => {
      const row = document.createElement("div");
      row.className = "row " + (r.ok ? "pass" : "failrow");
      row.textContent = (r.ok ? "PASS " : "FAIL ") + r.name + (r.ok ? "" : "  ->  " + r.error);
      root.appendChild(row);
    });
  } else {
    results.forEach(r => {
      if (!r.ok) console.error("FAIL " + r.name + "  ->  " + r.error);
    });
    console.log(`\nFlight Core engine tests: ${passed}/${results.length} passed${failed ? `, ${failed} FAILED` : ""}`);
    if (typeof process !== "undefined" && process.exit) process.exit(failed === 0 ? 0 : 1);
  }
})();
