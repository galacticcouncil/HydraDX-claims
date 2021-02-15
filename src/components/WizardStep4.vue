<template>
  <div class="wizard-step-container step-3">
    <div class="success-message-container">
      <div class="success-icon">
        <img :src="checkedIconSrc" alt="Success" />
      </div>
      <h3>SUCCESS!</h3>
      <p class="success-message">
        Lorem Ipsum is simply dummy text of the printing and typesetting
        industry.
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'WizardStep4',

  setup() {
    return {
      checkedIconSrc: require('@/assets/images/checked.svg'),
    };
  },
});
</script>
