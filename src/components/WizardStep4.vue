<template>
  <div class="wizard-step-container step-4">
    <div
      v-if="wizardState.claiming.resultStatus === 0"
      class="status-message-container success"
    >
      <div class="status-icon">
        <img :src="checkedIconSrc" alt="Success" />
      </div>
      <h3>SUCCESS!</h3>
      <span class="success-message">Welcome to HydraDX</span>
    </div>

    <div
      v-if="wizardState.claiming.resultStatus === 1"
      class="status-message-container error"
    >
      <div class="status-icon">
        <img :src="errorIconSrc" alt="Error" />
      </div>
      <h3>ERROR!</h3>
      <p v-show="!wizardState.claiming.resultMessage" class="success-message">
        <!--        TODO text must be updated-->
        Some error has been occurred. Please, try again later.
      </p>
      <p v-show="wizardState.claiming.resultMessage" class="success-message">
        {{ wizardState.claiming.resultMessage }}
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
      checkedIconSrc: require('@/assets/images/blue-logo.svg'),
      errorIconSrc: require('@/assets/images/pink-logo.svg'),
    };
  },
});
</script>
