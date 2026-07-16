<template>
  <canvas ref="canvasRef" class="pixel-canvas"></canvas>
</template>

<script>
export default {
  props: {
    width: {
      type: Number,
      required: true,
    },
    height: {
      type: Number,
      required: true,
    },
    pixels: {
      type: Map,
      required: true,
    },
    zoom: {
      type: Number,
      default: 10,
    },
    offsetX: {
      type: Number,
      default: 0,
    },
    offsetY: {
      type: Number,
      default: 0,
    },
    canvasWidth: {
      type: Number,
      default: 0,
    },
    canvasHeight: {
      type: Number,
      default: 0,
    },
    gridVisible: {
      type: Boolean,
      default: true,
    },
    highlightColor: {
      type: String,
      default: null,
    },
    highlightRow: {
      type: Number,
      default: null,
    },
    isDarkMode: {
      type: Boolean,
      default: false,
    },
    touchEnabled: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: [Number, String],
      default: 0,
    },
  },
  watch: {
    width() {
      this.drawCanvas();
    },
    height() {
      this.drawCanvas();
    },
    pixels: {
      handler() {
        this.drawCanvas();
      },
      deep: true,
    },
    zoom() {
      this.drawCanvas();
    },
    offsetX() {
      this.drawCanvas();
    },
    offsetY() {
      this.drawCanvas();
    },
    canvasWidth() {
      this.resizeCanvas();
    },
    canvasHeight() {
      this.resizeCanvas();
    },
    gridVisible() {
      this.drawCanvas();
    },
    highlightColor() {
      this.drawCanvas();
    },
    highlightRow() {
      this.drawCanvas();
    },
    isDarkMode() {
      this.drawCanvas();
    },
    refreshToken() {
      this.drawCanvas();
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.resizeCanvas();
    });
  },
  methods: {
    getCanvasSize() {
      const canvas = this.$refs.canvasRef;
      const rect = canvas ? canvas.getBoundingClientRect() : null;
      let width = Number(this.canvasWidth);
      let height = Number(this.canvasHeight);

      if (!Number.isFinite(width) || width <= 0) {
        width = rect && rect.width > 0 ? rect.width : 375;
      }
      if (!Number.isFinite(height) || height <= 0) {
        height = rect && rect.height > 0 ? rect.height : 375;
      }

      return {
        width,
        height,
      };
    },
    resizeCanvas() {
      const canvas = this.$refs.canvasRef;
      if (!canvas) {
        return;
      }

      const size = this.getCanvasSize();
      const dpr = window.devicePixelRatio > 0 ? window.devicePixelRatio : 1;
      const targetWidth = Math.max(1, Math.round(size.width * dpr));
      const targetHeight = Math.max(1, Math.round(size.height * dpr));

      if (canvas.width !== targetWidth) {
        canvas.width = targetWidth;
      }
      if (canvas.height !== targetHeight) {
        canvas.height = targetHeight;
      }

      canvas.style.width = `${size.width}px`;
      canvas.style.height = `${size.height}px`;

      this.drawCanvas();
    },
    drawCanvas() {
      const canvas = this.$refs.canvasRef;
      if (!canvas) {
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }

      const size = this.getCanvasSize();
      const dpr = window.devicePixelRatio > 0 ? window.devicePixelRatio : 1;
      const targetWidth = Math.max(1, Math.round(size.width * dpr));
      const targetHeight = Math.max(1, Math.round(size.height * dpr));

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        this.resizeCanvas();
        return;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size.width, size.height);
      ctx.fillStyle = this.isDarkMode ? "#000000" : "#ffffff";
      ctx.fillRect(0, 0, size.width, size.height);

      ctx.save();
      ctx.translate(this.offsetX, this.offsetY);
      ctx.scale(this.zoom, this.zoom);

      this.pixels.forEach((color, key) => {
        const parts = key.split(",");
        const x = Number(parts[0]);
        const y = Number(parts[1]);
        let alpha = 1;
        let shouldGlow = false;

        if (this.highlightRow !== null) {
          if (this.highlightColor) {
            if (y !== this.highlightRow || color !== this.highlightColor) {
              alpha = 0.15;
            } else {
              shouldGlow = true;
            }
          } else if (y !== this.highlightRow) {
            alpha = 0.25;
          }
        } else if (this.highlightColor) {
          if (color !== this.highlightColor) {
            alpha = 0.25;
          } else {
            shouldGlow = true;
          }
        }

        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;

        if (shouldGlow) {
          ctx.shadowColor = color;
          ctx.shadowBlur = 2;
        }

        ctx.fillRect(x, y, 1, 1);
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      });

      if (this.gridVisible && this.zoom > 1.5) {
        const gridColor = this.isDarkMode ? "#eef6ff" : "#5a6472";
        const gridLineWidth = this.isDarkMode ? 0.18 : 0.12;

        ctx.lineWidth = gridLineWidth;
        ctx.strokeStyle = gridColor;
        ctx.globalAlpha = this.isDarkMode ? 0.28 : 0.16;
        ctx.beginPath();

        for (let x = 0; x <= this.width; x += 1) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, this.height);
        }
        for (let y = 0; y <= this.height; y += 1) {
          ctx.moveTo(0, y);
          ctx.lineTo(this.width, y);
        }

        ctx.stroke();
        ctx.lineWidth = this.isDarkMode ? 0.22 : gridLineWidth;
        ctx.globalAlpha = this.isDarkMode ? 0.42 : 0.22;
        ctx.beginPath();
        ctx.rect(0, 0, this.width, this.height);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      ctx.restore();
    },
  },
};
</script>

<style scoped>
.pixel-canvas {
  display: block;
  width: 100%;
  height: 100%;
  background: #000000;
}
</style>
