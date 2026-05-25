// uniapp 页面生命周期 → vue 标准生命周期 适配
// uniapp 页面有 onLoad / onShow / onReady / onHide / onUnload, vue 没有.
// 这个 mixin 把它们挂到 vue 的 created / mounted / activated / deactivated / unmounted.
//
// 用法: views/mobile/X.vue 里 mixins: [uniLifecycleAdapter, ...其他]
// 由于 uniapp 复刻页面都用 mixins, 这个适配器统一加入

export default {
  // onLoad: uniapp 页面"创建时"触发, 类似 vue created
  // 不要放 mounted (DOM 准备好后), 因为 onLoad 里访问 this.$refs 会拿不到, 但 uniapp 自己也是这样
  // onLoad 在 uniapp 里晚于 created 但早于 mounted, web 用 created 时机最接近
  created() {
    if (typeof this.onLoad === 'function') {
      try {
        // uniapp onLoad 接收启动参数 (路由 query), 我们传当前 route.query
        const query = (this.$route && this.$route.query) ? { ...this.$route.query } : {};
        this.onLoad(query);
      } catch (e) {
        console.error('[uni-lifecycle] onLoad error', e);
      }
    }
  },
  mounted() {
    if (typeof this.onReady === 'function') {
      try { this.onReady(); }
      catch (e) { console.error('[uni-lifecycle] onReady error', e); }
    }
    if (typeof this.onShow === 'function') {
      try { this.onShow(); }
      catch (e) { console.error('[uni-lifecycle] onShow error', e); }
    }
  },
  activated() {
    // 路由 keep-alive 重新激活时
    if (typeof this.onShow === 'function' && !this._uniShownByMounted) {
      try { this.onShow(); }
      catch (e) { console.error('[uni-lifecycle] onShow (activated) error', e); }
    }
    this._uniShownByMounted = false;
  },
  deactivated() {
    if (typeof this.onHide === 'function') {
      try { this.onHide(); }
      catch (e) { console.error('[uni-lifecycle] onHide error', e); }
    }
  },
  beforeUnmount() {
    if (typeof this.onHide === 'function') {
      try { this.onHide(); }
      catch (e) { console.error('[uni-lifecycle] onHide error', e); }
    }
    if (typeof this.onUnload === 'function') {
      try { this.onUnload(); }
      catch (e) { console.error('[uni-lifecycle] onUnload error', e); }
    }
  },
};
