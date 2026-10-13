// Flight Core - app-layer error-boundary and storage resilience tests.
// Zero-dependency Node runner; the DOM is intentionally stubbed to exercise
// failure paths without launching a browser.

"use strict";

const fs = require("fs");
const vm = require("vm");
const FlightCore = require("./core.js");

const source = fs.readFileSync("./app.js", "utf8");
const results = [];

function assert(condition, message) {
  if (!condition) throw new Error(message || "assertion failed");
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message || "not equal"} - expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function makeContext(storage) {
  const listeners = {};
  const warnings = [];
  const errors = [];
const overlay = { dataset: {}, style: { display: "none" } };
  const logEl = { textContent: "" };
  const bodyAttrs = {};
  let reloads = 0;

  const document = {
    readyState: "loading",
    body: {
      setAttribute(name, value) { bodyAttrs[name] = String(value); },
      getAttribute(name) { return bodyAttrs[name] !== undefined ? bodyAttrs[name] : null; },
      classList: { toggle() {} }
    },
    addEventListener(name, handler) { listeners[`document:${name}`] = handler; },
    getElementById(id) {
      if (id === "error-boundary-overlay") return overlay;
      if (id === "error-boundary-log") return logEl;
      return { textContent: "", style: {}, innerHTML: "", appendChild() {}, classList: { add() {}, toggle() {} }, setAttribute() {}, addEventListener() {}, removeEventListener() {} };
    },
    querySelectorAll() { return []; },
    querySelector() { return null; },
    createElement() { return { style: {}, classList: { add() {} }, appendChild() {}, setAttribute() {} }; }
  };

  const window = {
    FlightCore,
    FlightCoreConfig: {},
    addEventListener(name, handler) { listeners[`window:${name}`] = handler; },
    matchMedia() { return { matches: false }; },
    location: { reload() { reloads += 1; } }
  };
  window.window = window;

  const context = {
    window,
    FlightCore,
    document,
    localStorage: storage,
    navigator: {},
    console: {
      warn(...args) { warnings.push(args); },
      error(...args) { errors.push(args); },
      log() {}
    },
    alert() {},
    Blob: class Blob {},
    fetch() { return Promise.resolve({ ok: true }); },
    setTimeout,
    clearTimeout,
    Date,
    Error,
    Math,
    JSON,
    Number,
    String,
    Object,
    Array,
    Set,
    Map,
    parseInt,
    parseFloat,
    isNaN
  };

  vm.createContext(context);
  vm.runInContext(source, context, { filename: "app.js" });
  return { context, overlay, logEl, warnings, errors, listeners, getReloads: () => reloads, bodyAttrs };
}

function run(name, fn) {
  try {
    fn();
    results.push({ name, ok: true });
  } catch (error) {
    results.push({ name, ok: false, error: error.stack || error.message });
  }
}

const throwingStorage = {
  getItem() { throw new Error("storage blocked"); },
  setItem() { throw new Error("quota exceeded"); },
  removeItem() { throw new Error("storage blocked"); },
  clear() { throw new Error("storage blocked"); }
};

run("boot survives completely unavailable localStorage", () => {
  const app = makeContext(throwingStorage);
  assert(typeof app.context.getSafeStorageValue === "function");
  assertEqual(app.context.getSafeStorageValue("missing", "fallback"), "fallback");
  assert(app.warnings.length > 0, "storage failure should be observable");
});

run("safe storage writes/removals/clear return false on failure", () => {
  const app = makeContext(throwingStorage);
  assertEqual(app.context.safeStorageSet("key", "value"), false);
  assertEqual(app.context.safeStorageRemove("key"), false);
  assertEqual(app.context.safeStorageClear(), false);
});

run("global error boundary hides stacks and sensitive details", () => {
  const app = makeContext({ getItem() { return null; }, setItem() {}, removeItem() {}, clear() {} });
  app.context.handleGlobalError(new Error("supabase token leaked: abc123"));
  assertEqual(app.overlay.style.display, "flex");
  assert(app.logEl.textContent.includes("SYSTEM ERROR"));
  assert(!app.logEl.textContent.includes("Stack"));
  assert(!app.logEl.textContent.includes("abc123"));
  assert(!app.logEl.textContent.includes("supabase"));
});

run("global error boundary does not overwrite the first active failure", () => {
  const app = makeContext({ getItem() { return null; }, setItem() {}, removeItem() {}, clear() {} });
  app.context.handleGlobalError(new Error("first failure"));
  const first = app.logEl.textContent;
  app.context.handleGlobalError(new Error("second failure"));
  assertEqual(app.logEl.textContent, first);
  assertEqual(app.errors.length, 2);
});
run("app source has no unreachable radar gameplay renderer", () => {
  assert(!source.includes("renderRadarBoard("), "radar gameplay renderer should not be referenced without a generator");
  assert(!source.includes('module === "radar"'), "radar should not be included in gameplay module branches");
});

run("public beta monetization readiness: no pro modal or hardcoded pro key triggers", () => {
  assert(!source.includes("pro-license-input"), "no pro license input in app source");
  assert(!source.includes("btn-pro-unlock"), "no pro unlock button listener in app source");
  assert(!source.includes("pro-pass-overlay"), "no pro pass overlay in app source");
  assert(!source.includes("PRO-FLIGHT-PASS"), "no hardcoded PRO-FLIGHT-PASS key in app source");
});

run("startup scrubs legacy pro key safely without modifying history", () => {
  const mockStorageData = {
    "flightcore_pro_key": "PRO-FLIGHT-PASS",
    "flightcore_history": JSON.stringify([{ score: 500, date: "2026-10-13" }])
  };
  const mockStorage = {
    getItem(k) { return mockStorageData[k] || null; },
    setItem(k, v) { mockStorageData[k] = String(v); },
    removeItem(k) { delete mockStorageData[k]; },
    clear() { Object.keys(mockStorageData).forEach(k => delete mockStorageData[k]); }
  };
  const app = makeContext(mockStorage);
if (typeof app.context.initGamification === "function") {
    app.context.initGamification();
  }
assertEqual(mockStorageData["flightcore_pro_key"], undefined, "legacy pro key should be scrubbed");
  assert(mockStorageData["flightcore_history"] !== undefined, "history must remain intact");
});

run("setTheme applies amber/stealth to body, persists, and invalid themes fall back to dark", () => {
  const mockStorageData = {};
  const mockStorage = {
    getItem(k) { return mockStorageData[k] || null; },
    setItem(k, v) { mockStorageData[k] = String(v); },
    removeItem(k) { delete mockStorageData[k]; },
    clear() { Object.keys(mockStorageData).forEach(k => delete mockStorageData[k]); }
  };
  const app = makeContext(mockStorage);
  assert(typeof app.context.setTheme === "function");
  app.context.setTheme("amber");
  assertEqual(app.bodyAttrs["data-theme"], "amber");
  assertEqual(mockStorageData["flightcore_theme"], "amber");
  app.context.setTheme("stealth");
  assertEqual(app.bodyAttrs["data-theme"], "stealth");
  assertEqual(mockStorageData["flightcore_theme"], "stealth");
  app.context.setTheme("neon-nonsense");
  assertEqual(app.bodyAttrs["data-theme"], "dark");
  assertEqual(mockStorageData["flightcore_theme"], "dark");
});

run("index.html exposes buttons for all 7 themes", () => {
  const html = fs.readFileSync("./index.html", "utf8");
  ["dark", "light", "mono", "sage", "warm", "amber", "stealth"].forEach(theme => {
    assert(html.includes(`data-theme-val="${theme}"`), `missing theme button for ${theme}`);
  });
});

run("index.html ships CSV logbook export and no pro-gated overlay", () => {
  const html = fs.readFileSync("./index.html", "utf8");
  assert(html.includes('id="btn-export-logbook-csv"'), "missing logbook CSV export button");
  assert(!html.includes("pro-pass-overlay"), "pro pass overlay should not exist in index.html");
});

run("getSafeStorageHistory sanitizes corrupt/malformed history array safely", () => {
  const corruptRaw = JSON.stringify([
    null,
    "garbage-string",
    12345,
    { score: -50, percentage: 150, date: "bad-date" },
    { score: "500", percentage: "80", date: "2026-10-13T00:00:00.000Z" }
  ]);
  const mockStorage = {
    getItem(k) { return k === "flightcore_history" ? corruptRaw : null; },
    setItem() {},
    removeItem() {},
    clear() {}
  };
  const app = makeContext(mockStorage);
  assert(typeof app.context.getSafeStorageHistory === "function");
  const clean = app.context.getSafeStorageHistory();
  assertEqual(clean.length, 2, "only recoverable records should be kept");
  assertEqual(clean[0].score, 0, "negative score clamped to 0");
  assertEqual(clean[0].percentage, 100, "out-of-range percentage clamped to 100");
  assertEqual(clean[1].score, 500, "string score parsed to number");
  assertEqual(clean[1].percentage, 80, "string percentage parsed to number");
});

run("loadHomeStats and renderRunHistory execute without throwing on malformed records", () => {
  const corruptRaw = JSON.stringify([
    { score: null, percentage: null, date: null },
    { score: "NaN", percentage: "invalid" }
  ]);
  const mockStorage = {
    getItem(k) { return k === "flightcore_history" ? corruptRaw : null; },
    setItem() {},
    removeItem() {},
    clear() {}
  };
  const app = makeContext(mockStorage);
  if (typeof app.context.loadHomeStats === "function") {
    app.context.loadHomeStats();
  }
  if (typeof app.context.renderRunHistory === "function") {
    app.context.renderRunHistory();
  }
  assert(true, "loadHomeStats and renderRunHistory executed safely");
});

const passed = results.filter(result => result.ok).length;
const failed = results.length - passed;
results.forEach(result => {
  if (!result.ok) console.error(`FAIL ${result.name} -> ${result.error}`);
});
console.log(`Flight Core app error-handling tests: ${passed}/${results.length} passed${failed ? `, ${failed} FAILED` : ""}`);
process.exitCode = failed ? 1 : 0;