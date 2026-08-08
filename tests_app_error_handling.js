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
  let reloads = 0;

  const document = {
    readyState: "loading",
    body: { setAttribute() {}, classList: { toggle() {} } },
    addEventListener(name, handler) { listeners[`document:${name}`] = handler; },
    getElementById(id) {
      if (id === "error-boundary-overlay") return overlay;
      if (id === "error-boundary-log") return logEl;
      return null;
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
  return { context, overlay, logEl, warnings, errors, listeners, getReloads: () => reloads };
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

const passed = results.filter(result => result.ok).length;
const failed = results.length - passed;
results.forEach(result => {
  if (!result.ok) console.error(`FAIL ${result.name} -> ${result.error}`);
});
console.log(`Flight Core app error-handling tests: ${passed}/${results.length} passed${failed ? `, ${failed} FAILED` : ""}`);
process.exitCode = failed ? 1 : 0;