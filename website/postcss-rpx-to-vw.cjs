// PostCSS 插件: rpx → 双单位响应式
// uniapp 设计稿基准 750rpx
//   移动端 (≤768px 屏宽): rpx 完整跟屏宽走 → Nrpx = (N / 750) * 100vw
//   桌面端: 浏览器很宽时如果继续用 vw, 字体/边距会爆炸
//          → 锁住到 414px 手机壳尺寸: Nrpx ≤ N * (414/750) px = N * 0.552px
//
// 转换规则 (CSS min 双单位):
//   Nrpx → min((N * 0.1333)vw, (N * 0.552)px)
//   N=24 (24rpx 字号) → min(3.2vw, 13.25px)  → 移动端 12px (375 屏), 桌面端 13.25px (锁住)
//   N=750 (设计稿宽) → min(100vw, 414px)
//
// 这样 PC 看小程序整页内容会自动居中限宽到 414px 不变形

module.exports = (opts = {}) => {
  const designWidth = opts.designWidth || 750;
  const desktopShellWidth = opts.desktopShellWidth || 414;
  const unitPrecision = opts.unitPrecision != null ? opts.unitPrecision : 4;

  const vwFactor = 100 / designWidth;        // 1rpx = 100/750 vw
  const pxFactor = desktopShellWidth / designWidth;  // 1rpx = 414/750 px

  const rpxReg = /(-?\d+(?:\.\d+)?)rpx/g;

  function convert(n) {
    const v = parseFloat(n);
    if (v === 0) return '0';
    const vw = Number((v * vwFactor).toFixed(unitPrecision));
    const px = Number((v * pxFactor).toFixed(unitPrecision));
    return `min(${vw}vw, ${px}px)`;
  }

  return {
    postcssPlugin: 'postcss-rpx-to-vw',
    Declaration(decl) {
      const v = decl.value;
      if (!v || v.indexOf('rpx') === -1) return;
      decl.value = v.replace(rpxReg, (_, n) => convert(n));
    },
  };
};
module.exports.postcss = true;
