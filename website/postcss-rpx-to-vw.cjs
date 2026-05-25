// PostCSS 插件: rpx → 双单位响应式
// uniapp 设计稿基准 750rpx
//
// Nrpx → min((N/750)*100vw, (N/750)*480px)
//   移动端 (≤480px 屏): vw 较小, 用 vw → 跟 uniapp 设计稿一致
//   PC 端 (>480px): px 较小, 用 480 基准 → 字号/间距锁住, 不会爆炸
//
// 480px 是合理的"小屏宽度" — 比 414 大一点, 字号略大, 桌面端不会显得拘谨

module.exports = (opts = {}) => {
  const designWidth = opts.designWidth || 750;
  const cap = opts.capWidth || 480;
  const unitPrecision = opts.unitPrecision != null ? opts.unitPrecision : 4;

  const vwFactor = 100 / designWidth;
  const pxFactor = cap / designWidth;
  const rpxReg = /(-?\d+(?:\.\d+)?)rpx/g;

  return {
    postcssPlugin: 'postcss-rpx-to-vw',
    Declaration(decl) {
      const v = decl.value;
      if (!v || v.indexOf('rpx') === -1) return;
      decl.value = v.replace(rpxReg, (_, n) => {
        const num = parseFloat(n);
        if (num === 0) return '0';
        const vw = Number((num * vwFactor).toFixed(unitPrecision));
        const px = Number((num * pxFactor).toFixed(unitPrecision));
        return `min(${vw}vw, ${px}px)`;
      });
    },
  };
};
module.exports.postcss = true;
