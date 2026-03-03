import { isRenderTarget } from "./sourceTypes.js";

export const DEFAULT_RENDER_TARGET = "brightspace-embed";

const TARGET_POLICIES = {
  "brightspace-embed": {
    target: "brightspace-embed",
    allowExternalAssets: false,
    preferSingleScroll: true,
    requireScormCompatibility: false
  },
  scorm: {
    target: "scorm",
    allowExternalAssets: false,
    preferSingleScroll: true,
    requireScormCompatibility: true
  }
};

export function getRenderPolicy(target = DEFAULT_RENDER_TARGET) {
  const normalized = isRenderTarget(target) ? target : DEFAULT_RENDER_TARGET;
  return TARGET_POLICIES[normalized];
}
