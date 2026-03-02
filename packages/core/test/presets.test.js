import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_TEMPLATE_PRESET,
  DEFAULT_THEME_PRESET,
  listTemplatePresets,
  listThemePresets,
  resolveTemplatePreset,
  resolveThemePreset
} from "../src/presets.js";

test("preset catalogs include premium template and theme options", () => {
  const templates = listTemplatePresets();
  const themes = listThemePresets();

  assert.ok(templates.length >= 5);
  assert.ok(themes.length >= 5);
  assert.ok(templates.some((item) => item.slug === "premium-core"));
  assert.ok(templates.some((item) => item.slug === "case-studio"));
  assert.ok(themes.some((item) => item.slug === "bold-clay"));
  assert.ok(themes.some((item) => item.slug === "cupertino-light"));
});

test("preset resolvers return defaults and reject unknown values", () => {
  assert.equal(resolveTemplatePreset("").slug, DEFAULT_TEMPLATE_PRESET);
  assert.equal(resolveThemePreset("").slug, DEFAULT_THEME_PRESET);
  assert.throws(() => resolveTemplatePreset("unknown-template"), /Unknown template preset/);
  assert.throws(() => resolveThemePreset("unknown-theme"), /Unknown theme preset/);
});
