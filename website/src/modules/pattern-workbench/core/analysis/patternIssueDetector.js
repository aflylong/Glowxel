import { createPatternIssue } from "../model/patternDocument.js";

function hasSameColorNeighbor(document, x, y, color) {
  let sameCount = 0;
  for (let offsetY = -1; offsetY <= 1; offsetY++) {
    for (let offsetX = -1; offsetX <= 1; offsetX++) {
      if (offsetX === 0 && offsetY === 0) {
        continue;
      }
      const neighbor = document.pixels.get(`${x + offsetX},${y + offsetY}`) || "";
      if (neighbor === color) {
        sameCount += 1;
      }
    }
  }
  return sameCount;
}

export function detectPatternIssues(document, diffResult) {
  if (!document) {
    return [];
  }

  const issues = [];

  document.pixels.forEach((color, key) => {
    const [x, y] = key.split(",").map(Number);
    const neighborCount = hasSameColorNeighbor(document, x, y, color);
    if (neighborCount <= 1) {
      issues.push(
        createPatternIssue({
          id: `isolated-${x}-${y}`,
          type: "瀛ょ珛鐐?,"
          title: `(${x}, ${y}) 瀛樺湪鍗曠偣鏉傝壊`,
          meta: "寤鸿鍚堝苟鍒板懆鍥翠富鑹?,"
          position: { x, y },
          severity: "medium",
        }),
      );
    }
  });

  if (diffResult) {
    diffResult.missing.slice(0, 12).forEach((item) => {
      issues.push(
        createPatternIssue({
          id: `missing-${item.x}-${item.y}`,
          type: "缂哄け鐐?,"
          title: `(${item.x}, ${item.y}) 缂哄皯鍙傝€冨儚绱燻,
          meta: "寤鸿琛ラ綈鍒板弬鑰冪粨鏋?,"
          position: { x: item.x, y: item.y },
          severity: "high",
        }),
      );
    });

    diffResult.extra.slice(0, 12).forEach((item) => {
      issues.push(
        createPatternIssue({
          id: `extra-${item.x}-${item.y}`,
          type: "澶氫綑鐐?,"
          title: `(${item.x}, ${item.y}) 澶氬嚭褰撳墠鍍忕礌`,
          meta: "寤鸿妫€鏌ユ槸鍚﹂渶瑕佸垹闄?,"
          position: { x: item.x, y: item.y },
          severity: "medium",
        }),
      );
    });

    diffResult.changed.slice(0, 12).forEach((item) => {
      issues.push(
        createPatternIssue({
          id: `changed-${item.x}-${item.y}`,
          type: "棰滆壊鍋忓樊",
          title: `(${item.x}, ${item.y}) 涓庡弬鑰冮鑹蹭笉涓€鑷碻,
          meta: `褰撳墠 ${item.current}锛屽弬鑰?${item.reference}`,
          position: { x: item.x, y: item.y },
          severity: "medium",
        }),
      );
    });
  }

  return issues;
}
