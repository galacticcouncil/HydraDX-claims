<template>
  <div class="hdx-amount-indicator">
    <div class="total-amount">
      Unclaimed HDX: {{ hdxClaimableAmountFormatted.base }} HDX
      <br />
      Unclaimed HDX 3x: {{ hdxClaimableAmountFormatted.tripled }} HDX
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
        return {
          base: getFormattedBalance(props.ethAccountData.xhdxTotalBalance),
          tripled: getFormattedBalance(props.ethAccountData.claimableHdxAmount, true)
        };
      }
      return { base: '0', tripled: '0' };
    });

    return {
      hdxClaimableAmountFormatted,
    };
  },
});
</script>
