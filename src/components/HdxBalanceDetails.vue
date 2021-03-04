<template>
  <div class="hdx-amount-indicator">
    <div class="total-amount">
      HDX to Claim: {{ hdxClaimableAmountFormatted }} HDX
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { getFormattedBalance } from '@/services/utils';

export default defineComponent({
  name: 'HdxBalanceDetails',
  props: {
    ethAccountData: {
      type: Object,
      default: () => {
        return {};
      },
    },
  },
  setup(props) {
    const hdxClaimableAmountFormatted = computed(() => {
      if (!props.ethAccountData.isClaimableHdxAmountZero) {
        return getFormattedBalance(
          props.ethAccountData.claimableHdxAmount,
          true
        );
      }
      return '0';
    });

    return {
      hdxClaimableAmountFormatted,
    };
  },
});
</script>
