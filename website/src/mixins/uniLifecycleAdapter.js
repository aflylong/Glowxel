// uniapp 页面生命周期 → vue 标准生命周期 适配
// uniapp 页面有 onLoad / onShow / onReady / onHide / onUnload, vue 没有.
// 这个 mixin 把它们挂到 vue 的 created / mounted / activated / deactivated / unmounted.
//
// 关键: 多个 mixin 同名 onLoad/onShow 默认会被 child 覆盖. main.js 里通过
// app.config.optionMergeStrategies 把它们合成数组, 这里读 $options.<hook>
// 拿到全部回调依次调用 (匹配 uniapp 行为).
//
// 用法: views/mobile/X.vue 里 mixins: [uniLifecycleAdapter, ...其他]

function callHookList(vm, name, ...args) {
  const opts = vm.$options[name];
  if (!opts) return;
  const list = Array.isArray(opts) ? opts : [opts];
  for (const fn of list) {
    if (typeof fn === 'function') {
      fn.call(vm, ...args);
    }
  }
}

export default {
  created() {
    const query = (this.$route && this.$route.query) ? { ...this.$route.query } : {};
    callHookList(this, 'onLoad', query);
  },
  mounted() {
    callHookList(this, 'onReady');
    callHookList(this, 'onShow');
    this._uniShownByMounted = true;
  },
  activated() {
    if (!this._uniShownByMounted) {
      callHookList(this, 'onShow');
    }
    this._uniShownByMounted = false;
  },
  deactivated() {
    callHookList(this, 'onHide');
  },
  beforeUnmount() {
    callHookList(this, 'onHide');
    callHookList(this, 'onUnload');
  },
};
