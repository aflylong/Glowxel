(function () {
  "use strict";

  var PE = window.PlanetEngine;
  var canvas = document.getElementById("planet-canvas");
  var ctx = canvas.getContext("2d");

  // ===== Clock font data =====
  var CLOCK_FONTS = {
    "5x7": {
      name: "5×7",
      width: 5,
      height: 7,
      spacing: 1,
      glyphs: {
        "0": [14, 17, 19, 21, 25, 17, 14],
        "1": [4, 12, 4, 4, 4, 4, 14],
        "2": [14, 17, 1, 2, 4, 8, 31],
        "3": [30, 1, 1, 14, 1, 1, 30],
        "4": [2, 6, 10, 18, 31, 2, 2],
        "5": [31, 16, 30, 1, 1, 17, 14],
        "6": [6, 8, 16, 30, 17, 17, 14],
        "7": [31, 1, 2, 4, 8, 8, 8],
        "8": [14, 17, 17, 14, 17, 17, 14],
        "9": [14, 17, 17, 15, 1, 2, 12],
        ":": [0, 12, 12, 0, 12, 12, 0]
      }
    },
    "3x5": {
      name: "3×5",
      width: 3,
      height: 5,
      spacing: 1,
      glyphs: {
        "0": [7, 5, 5, 5, 7],
        "1": [2, 6, 2, 2, 7],
        "2": [7, 1, 7, 4, 7],
        "3": [7, 1, 7, 1, 7],
        "4": [5, 5, 7, 1, 1],
        "5": [7, 4, 7, 1, 7],
        "6": [7, 4, 7, 5, 7],
        "7": [7, 1, 2, 2, 2],
        "8": [7, 5, 7, 5, 7],
        "9": [7, 5, 7, 1, 7],
        ":": [0, 2, 0, 2, 0]
      }
    },
    "4x6": {
      name: "4×6",
      width: 4,
      height: 6,
      spacing: 1,
      glyphs: {
        "0": [6, 9, 9, 9, 9, 6],
        "1": [4, 12, 4, 4, 4, 14],
        "2": [6, 9, 1, 2, 4, 15],
        "3": [14, 1, 6, 1, 1, 14],
        "4": [2, 6, 10, 15, 2, 2],
        "5": [15, 8, 14, 1, 9, 6],
        "6": [6, 8, 14, 9, 9, 6],
        "7": [15, 1, 2, 4, 4, 4],
        "8": [6, 9, 6, 9, 9, 6],
        "9": [6, 9, 9, 7, 1, 6],
        ":": [0, 4, 0, 0, 4, 0]
      }
    }
  };

  // ===== State =====
  var config = PE.createDefaultPlanetPreviewConfig();
  config.pixels = 96;
  var playing = true;
  var progress = 0;
  var lastFrameTime = 0;
  var frameCount = 0;
  var fpsAccumulator = 0;
  var displayFps = 0;
  var renderSize = 64;

  // Clock state
  var clockShow = true;
  var clockColor = "#64c8ff";
  var clockSize = 1;
  var clockX = 32; // center-aligned reference (0-63 space)
  var clockY = 5;
  var clockFontId = "5x7";

  // ===== DOM refs =====
  var presetGrid = document.getElementById("preset-grid");
  var pixelsSlider = document.getElementById("pixels-slider");
  var pixelsValue = document.getElementById("pixels-value");
  var pixelsValue2 = document.getElementById("pixels-value2");
  var pixelsInfo = document.getElementById("pixels-info");
  var speedSlider = document.getElementById("speed-slider");
  var speedValue = document.getElementById("speed-value");
  var xSlider = document.getElementById("x-slider");
  var xValue = document.getElementById("x-value");
  var ySlider = document.getElementById("y-slider");
  var yValue = document.getElementById("y-value");
  var sizeOptions = document.getElementById("size-options");
  var directionOptions = document.getElementById("direction-options");
  var btnRandomPlanet = document.getElementById("btn-random-planet");
  var btnRandomColor = document.getElementById("btn-random-color");
  var btnCenter = document.getElementById("btn-center");
  var btnExport = document.getElementById("btn-export");
  var btnPlay = document.getElementById("btn-play");
  var fpsDisplay = document.getElementById("fps-display");
  var btnToggle = document.getElementById("btn-toggle");
  var controlsPanel = document.getElementById("controls-panel");
  var clockToggle = document.getElementById("clock-toggle");
  var clockColorInput = document.getElementById("clock-color");
  var clockSizeSlider = document.getElementById("clock-size-slider");
  var clockSizeValue = document.getElementById("clock-size-value");
  var clockXSlider = document.getElementById("clock-x-slider");
  var clockXValue = document.getElementById("clock-x-value");
  var clockYSlider = document.getElementById("clock-y-slider");
  var clockYValue = document.getElementById("clock-y-value");
  var clockFontOptions = document.getElementById("clock-font-options");

  // ===== Canvas sizing — fill entire viewport =====
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.imageSmoothingEnabled = false;
  }
  window.addEventListener("resize", resizeCanvas);

  // ===== Panel toggle =====
  btnToggle.addEventListener("click", function () {
    controlsPanel.classList.toggle("collapsed");
    btnToggle.textContent = controlsPanel.classList.contains("collapsed") ? "▶" : "◀";
  });

  // ===== Preset grid =====
  function buildPresetGrid() {
    presetGrid.innerHTML = "";
    PE.PLANET_SCREEN_PRESETS.forEach(function (preset) {
      var btn = document.createElement("button");
      btn.className = "preset-btn" + (preset.id === config.preset ? " active" : "");
      btn.textContent = preset.label;
      btn.title = preset.hint;
      btn.dataset.id = preset.id;
      btn.addEventListener("click", function () {
        config.preset = preset.id;
        updatePresetButtons();
        progress = 0;
      });
      presetGrid.appendChild(btn);
    });
  }

  function updatePresetButtons() {
    presetGrid.querySelectorAll(".preset-btn").forEach(function (btn) {
      btn.classList.toggle("active", btn.dataset.id === config.preset);
    });
  }

  // ===== Size options =====
  function buildSizeOptions() {
    sizeOptions.innerHTML = "";
    PE.PLANET_SIZE_OPTIONS.forEach(function (opt) {
      var btn = document.createElement("button");
      btn.className = "option-btn" + (opt.id === config.size ? " active" : "");
      btn.textContent = opt.label;
      btn.dataset.id = opt.id;
      btn.addEventListener("click", function () {
        config.size = opt.id;
        sizeOptions.querySelectorAll(".option-btn").forEach(function (b) {
          b.classList.toggle("active", b.dataset.id === config.size);
        });
      });
      sizeOptions.appendChild(btn);
    });
  }

  // ===== Direction options =====
  function buildDirectionOptions() {
    directionOptions.innerHTML = "";
    PE.PLANET_DIRECTION_OPTIONS.forEach(function (opt) {
      var btn = document.createElement("button");
      btn.className = "option-btn" + (opt.id === config.direction ? " active" : "");
      btn.textContent = opt.label;
      btn.dataset.id = opt.id;
      btn.addEventListener("click", function () {
        config.direction = opt.id;
        directionOptions.querySelectorAll(".option-btn").forEach(function (b) {
          b.classList.toggle("active", b.dataset.id === config.direction);
        });
      });
      directionOptions.appendChild(btn);
    });
  }

  // ===== Clock font options =====
  function buildClockFontOptions() {
    clockFontOptions.innerHTML = "";
    Object.keys(CLOCK_FONTS).forEach(function (id) {
      var font = CLOCK_FONTS[id];
      var btn = document.createElement("button");
      btn.className = "option-btn" + (id === clockFontId ? " active" : "");
      btn.textContent = font.name;
      btn.dataset.id = id;
      btn.addEventListener("click", function () {
        clockFontId = id;
        clockFontOptions.querySelectorAll(".option-btn").forEach(function (b) {
          b.classList.toggle("active", b.dataset.id === clockFontId);
        });
      });
      clockFontOptions.appendChild(btn);
    });
  }

  // ===== Slider handlers =====
  pixelsSlider.addEventListener("input", function () {
    renderSize = parseInt(this.value, 10);
    pixelsValue.textContent = renderSize;
    if (pixelsValue2) pixelsValue2.textContent = renderSize;
    updatePixelsInfo();
    config.pixels = Math.round(renderSize * 1.5);
    PE.setCanvasSize(renderSize);
  });

  function updatePixelsInfo() {
    if (!pixelsInfo) return;
    if (renderSize <= 64) pixelsInfo.textContent = "像素风";
    else if (renderSize <= 128) pixelsInfo.textContent = "标准";
    else if (renderSize <= 256) pixelsInfo.textContent = "高清";
    else pixelsInfo.textContent = "超清";
  }

  speedSlider.addEventListener("input", function () {
    config.speed = parseInt(this.value, 10);
    speedValue.textContent = config.speed;
  });

  xSlider.addEventListener("input", function () {
    config.planetX = parseInt(this.value, 10);
    xValue.textContent = config.planetX;
  });

  ySlider.addEventListener("input", function () {
    config.planetY = parseInt(this.value, 10);
    yValue.textContent = config.planetY;
  });

  // Clock controls
  clockToggle.addEventListener("change", function () {
    clockShow = this.checked;
  });

  clockColorInput.addEventListener("input", function () {
    clockColor = this.value;
  });

  clockSizeSlider.addEventListener("input", function () {
    clockSize = parseInt(this.value, 10);
    clockSizeValue.textContent = clockSize;
  });

  clockXSlider.addEventListener("input", function () {
    clockX = parseInt(this.value, 10);
    clockXValue.textContent = clockX;
  });

  clockYSlider.addEventListener("input", function () {
    clockY = parseInt(this.value, 10);
    clockYValue.textContent = clockY;
  });

  // ===== Action buttons =====
  btnRandomPlanet.addEventListener("click", function () {
    config.seed = PE.createRandomPlanetPreviewSeed();
    progress = 0;
  });

  btnRandomColor.addEventListener("click", function () {
    config.colorSeed = PE.createRandomPlanetColorSeed();
  });

  btnCenter.addEventListener("click", function () {
    config.planetX = 32;
    config.planetY = 32;
    xSlider.value = 32;
    ySlider.value = 32;
    xValue.textContent = "32";
    yValue.textContent = "32";
  });

  btnExport.addEventListener("click", function () {
    var link = document.createElement("a");
    link.download = "planet-" + config.preset + "-" + renderSize + "px-" + Date.now() + ".png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  });

  btnPlay.addEventListener("click", function () {
    playing = !playing;
    btnPlay.classList.toggle("playing", playing);
    btnPlay.textContent = playing ? "⏸" : "▶";
  });

  // ===== Clock rendering =====
  function drawClockOnMap(frameMap) {
    if (!clockShow) return;

    var font = CLOCK_FONTS[clockFontId];
    if (!font) return;

    var now = new Date();
    var hours = String(now.getHours()).padStart(2, "0");
    var minutes = String(now.getMinutes()).padStart(2, "0");
    var text = hours + ":" + minutes;

    var scale = renderSize / 64;
    var charScale = Math.max(1, Math.round(clockSize * scale));
    var charW = font.width;
    var charH = font.height;
    var spacing = font.spacing;

    var scaledCharW = charW * charScale;
    var scaledSpacing = spacing * charScale;
    var totalWidth = text.length * (scaledCharW + scaledSpacing) - scaledSpacing;

    // Position in render-space (clockX/Y are in 0-63 space, scale to renderSize)
    var centerX = Math.round(clockX * scale);
    var startY = Math.round(clockY * scale);
    var startX = centerX - Math.floor(totalWidth / 2);

    var curX = startX;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      var rows = font.glyphs[ch];
      if (!rows) {
        curX += scaledCharW + scaledSpacing;
        continue;
      }
      for (var row = 0; row < charH; row++) {
        var bits = rows[row];
        for (var col = 0; col < charW; col++) {
          var mask = 1 << (charW - col - 1);
          if (!(bits & mask)) continue;
          for (var sy = 0; sy < charScale; sy++) {
            for (var sx = 0; sx < charScale; sx++) {
              var px = curX + col * charScale + sx;
              var py = startY + row * charScale + sy;
              if (px >= 0 && px < renderSize && py >= 0 && py < renderSize) {
                frameMap.set(px + "," + py, clockColor);
              }
            }
          }
        }
      }
      curX += scaledCharW + scaledSpacing;
    }
  }

  // ===== Main render loop =====
  function renderFrame(timestamp) {
    requestAnimationFrame(renderFrame);

    // FPS
    if (lastFrameTime > 0) {
      var delta = timestamp - lastFrameTime;
      fpsAccumulator += delta;
      frameCount++;
      if (fpsAccumulator >= 1000) {
        displayFps = Math.round((frameCount * 1000) / fpsAccumulator);
        fpsDisplay.textContent = displayFps + " FPS";
        frameCount = 0;
        fpsAccumulator = 0;
      }
    }
    lastFrameTime = timestamp;

    // Advance progress
    if (playing) {
      var cycleDuration = PE.getPlanetPreviewCycleDuration(config.speed);
      var progressStep = PE.PLANET_PREVIEW_PLAYBACK_INTERVAL_MS / cycleDuration;
      progress += progressStep;
      if (progress >= 1) progress -= 1;
    }

    // Render planet
    var frameMap = PE.buildPlanetScreensaverPreviewFrame(config, progress);

    // Draw clock overlay
    drawClockOnMap(frameMap);

    // Draw to full-screen canvas
    var cw = canvas.width;
    var ch = canvas.height;
    var displaySize = Math.min(cw, ch);
    var offsetX = Math.floor((cw - displaySize) / 2);
    var offsetY = Math.floor((ch - displaySize) / 2);
    var pixelScale = displaySize / renderSize;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, cw, ch);

    frameMap.forEach(function (color, key) {
      var parts = key.split(",");
      var x = parseInt(parts[0], 10);
      var y = parseInt(parts[1], 10);
      ctx.fillStyle = color;
      ctx.fillRect(
        offsetX + Math.floor(x * pixelScale),
        offsetY + Math.floor(y * pixelScale),
        Math.ceil(pixelScale),
        Math.ceil(pixelScale)
      );
    });
  }

  // ===== Init =====
  function init() {
    resizeCanvas();
    PE.setCanvasSize(renderSize);

    buildPresetGrid();
    buildSizeOptions();
    buildDirectionOptions();
    buildClockFontOptions();

    // Sync UI
    pixelsSlider.value = renderSize;
    pixelsValue.textContent = renderSize;
    if (pixelsValue2) pixelsValue2.textContent = renderSize;
    speedSlider.value = config.speed;
    speedValue.textContent = config.speed;
    xSlider.value = config.planetX;
    xValue.textContent = config.planetX;
    ySlider.value = config.planetY;
    yValue.textContent = config.planetY;
    clockSizeSlider.value = clockSize;
    clockSizeValue.textContent = clockSize;
    clockXSlider.value = clockX;
    clockXValue.textContent = clockX;
    clockYSlider.value = clockY;
    clockYValue.textContent = clockY;
    clockColorInput.value = clockColor;
    updatePixelsInfo();

    requestAnimationFrame(renderFrame);
  }

  init();
})();
