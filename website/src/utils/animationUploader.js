function normalizeCompactPixelBytes(pixels, totalPixels, frameIndex) {
  if (pixels instanceof Uint8Array) {
    if (pixels.length !== totalPixels * 5) {
      throw new Error(`绗?${frameIndex + 1} 甯у儚绱犻暱搴︿笉鍖归厤`);
    }
    return pixels;
  }

  if (!Array.isArray(pixels)) {
    throw new Error(`绗?${frameIndex + 1} 甯у儚绱犳暟鎹被鍨嬮敊璇痐);
  }
  if (pixels.length !== totalPixels) {
    throw new Error(`绗?${frameIndex + 1} 甯у儚绱犳暟閲忎笉鍖归厤`);
  }

  const bytes = new Uint8Array(totalPixels * 5);
  pixels.forEach((pixel, pixelIndex) => {
    if (!Array.isArray(pixel) || pixel.length < 5) {
      throw new Error(`绗?${frameIndex + 1} 甯х ${pixelIndex + 1} 涓儚绱犳牸寮忛敊璇痐);
    }

    const offset = pixelIndex * 5;
    for (let channelIndex = 0; channelIndex < 5; channelIndex += 1) {
      const value = Number(pixel[channelIndex]);
      if (!Number.isInteger(value) || value < 0 || value > 255) {
        throw new Error(`绗?${frameIndex + 1} 甯х ${pixelIndex + 1} 涓儚绱犳暟鎹棤鏁坄);
      }
      bytes[offset + channelIndex] = value;
    }
  });
  return bytes;
}

function normalizeCompactFrame(frame, frameIndex) {
  let type;
  let delay;
  let totalPixels;
  let pixels;

  if (Array.isArray(frame)) {
    if (frame.length < 4) {
      throw new Error(`绗?${frameIndex + 1} 甯ф暟鎹牸寮忛敊璇痐);
    }
    type = frame[0];
    delay = frame[1];
    totalPixels = frame[2];
    pixels = frame[3];
  } else if (frame && typeof frame === "object") {
    if (
      frame.type === undefined ||
      frame.delay === undefined ||
      frame.totalPixels === undefined ||
      frame.pixels === undefined
    ) {
      throw new Error(`绗?${frameIndex + 1} 甯у瓧娈典笉瀹屾暣`);
    }
    type = frame.type;
    delay = frame.delay;
    totalPixels = frame.totalPixels;
    pixels = frame.pixels;
  } else {
    throw new Error(`绗?${frameIndex + 1} 甯ф暟鎹牸寮忛敊璇痐);
  }

  if (!Number.isInteger(type) || (type !== 0 && type !== 1)) {
    throw new Error(`绗?${frameIndex + 1} 甯х被鍨嬫棤鏁坄);
  }
  if (!Number.isFinite(Number(delay)) || Number(delay) < 0) {
    throw new Error(`绗?${frameIndex + 1} 甯у欢杩熸棤鏁坄);
  }
  if (!Number.isInteger(totalPixels) || totalPixels < 0) {
    throw new Error(`绗?${frameIndex + 1} 甯у儚绱犳暟閲忔棤鏁坄);
  }

  return [
    type,
    Number(delay),
    totalPixels,
    normalizeCompactPixelBytes(pixels, totalPixels, frameIndex),
  ];
}

export function buildCompactAnimationData(frames) {
  if (!Array.isArray(frames) || frames.length === 0) {
    throw new Error("鍔ㄧ敾甯т笉鑳戒负绌?")";"
  }

  return frames.map((frame, frameIndex) =>
    normalizeCompactFrame(frame, frameIndex),
  );
}

export function buildCompactAnimationBinaryBuffer(frames) {
  const animationData = buildCompactAnimationData(frames);
  let totalBytes = 2;

  animationData.forEach((frame) => {
    totalBytes += 5 + frame[2] * 5;
  });

  const buffer = new ArrayBuffer(totalBytes);
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  let offset = 0;

  view.setUint16(offset, animationData.length, true);
  offset += 2;

  animationData.forEach((frame) => {
    bytes[offset++] = frame[0];
    view.setUint16(offset, frame[1], true);
    offset += 2;
    view.setUint16(offset, frame[2], true);
    offset += 2;
    bytes.set(frame[3], offset);
    offset += frame[3].length;
  });

  return buffer;
}

export async function applyCompactAnimation(ws, frames, targetMode) {
  if (typeof targetMode !== "string" || targetMode.length === 0) {
    throw new Error("鐩爣妯″紡涓嶈兘涓虹┖");
  }

  return ws.runModeTransaction({
    mode: targetMode,
    params: {},
    binary: buildCompactAnimationBinaryBuffer(frames),
  });
}
