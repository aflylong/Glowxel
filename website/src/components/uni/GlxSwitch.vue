<template>
  <div
    class="glx-switch"
    :class="{ 'is-disabled': disabled }"
    @click.stop="handleToggle"
  >
    <div class="glx-switch-shell" :class="{ active: checked }">
      <div class="glx-switch-thumb"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: "GlxSwitch",
  props: {
    checked: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["change"],
  methods: {
    handleToggle() {
      if (this.disabled) {
        return;
      }
      this.$emit("change", {
        detail: {
          value: !this.checked,
        },
      });
    },
  },
};
</script>

<style scoped>
.glx-switch {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
}

.glx-switch.is-disabled {
  opacity: 0.45;
}
</style>
