<template>
  <div class="wizard-step-container step-4">
    <div v-if="wizardState.claiming.resultStatus === 0" class="status-message-container success">
      <div class="status-icon">
        <img :src="checkedIconSrc" alt="Success" />
      </div>
      <h3>SUCCESS!</h3>
      <p class="success-message">
        Lorem Ipsum is simply dummy text of the printing and typesetting
        industry.
      </p>
    </div>

    <div v-if="wizardState.claiming.resultStatus === 1" class="status-message-container error">
      <div class="status-icon">
        <img :src="errorIconSrc" alt="Error" />
      </div>
      <h3>ERROR!</h3>
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
  props: {
    wizardState: {
      type: Object,
      default: () => {
        return {};
      },
    },
  },

  setup() {
    return {
      checkedIconSrc: require('@/assets/images/pixelated.svg'),
      errorIconSrc: require('@/assets/images/alien-pixelated-shape-of-a-digital-game.svg'),
    };
  },
});
</script>
