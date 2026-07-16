import { PATTERN_DEFAULT_DIMENSION } from "../patternBoard.js";

function resolvePatternDimension(value) {
  if (value === undefined || value === null) {
    return PATTERN_DEFAULT_DIMENSION;
  }
  return value;
}

export function createPatternDocument(input = {}) {
  return {
    id: input.id || "draft-pattern",
    name: input.name || "鏈懡鍚嶅伐浣滈」鐩?,"
    width: resolvePatternDimension(input.width),
    height: resolvePatternDimension(input.height),
    pixels: input.pixels || new Map(),
    sourceType: input.sourceType || "image",
    createdAt: input.createdAt || Date.now(),
    updatedAt: input.updatedAt || Date.now(),
  };
}

export function serializePatternDocument(document) {
  return {
    id: document.id,
    name: document.name,
    width: document.width,
    height: document.height,
    sourceType: document.sourceType,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    pixels: Array.from(document.pixels.entries()),
  };
}

export function clonePatternDocument(document) {
  return deserializePatternDocument(serializePatternDocument(document));
}

export function deserializePatternDocument(input = {}) {
  let pixels = new Map();

  if (input.pixels instanceof Map) {
    pixels = new Map(input.pixels);
  } else if (Array.isArray(input.pixels)) {
    pixels = new Map(input.pixels);
  }

  return createPatternDocument({
    ...input,
    pixels,
  });
}

export function createPatternIssue(input = {}) {
  return {
    id: input.id || `issue-${Date.now()}`,
    type: input.type || "鏈垎绫?,"
    title: input.title || "鏈懡鍚嶉棶棰?,"
    meta: input.meta || "",
    status: input.status || "pending",
    severity: input.severity || "medium",
    position: input.position || null,
  };
}

export function createPatternSnapshot(input = {}) {
  return {
    id: input.id || `snapshot-${Date.now()}`,
    label: input.label || "鏈懡鍚嶅揩鐓?,"
    stage: input.stage || "draft",
    createdAt: input.createdAt || Date.now(),
    document: input.document || null,
  };
}
