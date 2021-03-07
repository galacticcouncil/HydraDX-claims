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
      <div v-show="+hdxNewBalance > 0" class="current-hdx-balance-message">
        <p>Current HDX Balance:</p>
        <p>{{ hdxNewBalance }}</p>
      </div>
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
        Error. Please contact support.
      </p>
      <p v-show="wizardState.claiming.resultMessage" class="success-message">
        {{ wizardState.claiming.resultMessage }}
      </p>
      <p v-show="currentBlockNumber">Block number: #{{ currentBlockNumber }}</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import {
  getCurrentBlockNumber,
  getHydraDxIdentityBalanceByAddress,
} from '@/services/polkadotUtils';

export default defineComponent({
  name: 'WizardStep4',
  props: {
    wizardState: {
      type: Object,
      default: () => {
        return {};
      },
    },
    hdxAccountData: {
      type: Object,
      default: () => {
        return {};
      },
    },
  },

  setup(props) {
    const currentBlockNumber = ref('');
    const hdxNewBalance = ref('0');

    onMounted(async () => {
      if (props.wizardState.claiming.resultStatus === 0) {
        hdxNewBalance.value = await getHydraDxIdentityBalanceByAddress(
          props.hdxAccountData.connectedAccount.address
        );
      } else {
        const rawBlockNumber = await getCurrentBlockNumber();
        if (!rawBlockNumber) return;
        currentBlockNumber.value = rawBlockNumber.toHuman();
      }
    });
    return {
      checkedIconSrc: require('@/assets/images/blue-logo.svg'),
      errorIconSrc: require('@/assets/images/pink-logo.svg'),
      currentBlockNumber,
      hdxNewBalance,
    };
  },
});
</script>
