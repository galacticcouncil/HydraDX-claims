<template>
  <div class="hdx-progress-line">
    <div :class="['progress-line-inner-container', `current-step-${step}`]">
      <div class="step-point step-0"></div>
      <div class="step-point step-1"></div>
      <div class="step-point step-2"></div>
      <div class="step-point step-3"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ProgressLine',
  props: {
    step: {
      type: Number,
      default: 0,
    },
  },
});
</script>
