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
import { BigNumber } from 'bignumber.js';

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
          base: getFormattedBalance(
            props.ethAccountData.claimableHdxAmount,
            true
          ),
          tripled: new BigNumber(
            getFormattedBalance(props.ethAccountData.claimableHdxAmount, true)
          )
            .multipliedBy(3)
            .toString(),
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
