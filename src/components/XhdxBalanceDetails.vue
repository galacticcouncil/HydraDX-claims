<template>
  <div class="xhdx-amounts-indicator">
    <div class="amount-details">
      <div class="amount-details-item">
        <span>Bought:</span>
        <span>{{ xhdxBoughtBalanceFormatted }} xHDX</span>
      </div>
      <div class="amount-details-item">
        <span>Gas Refund:</span>
        <span>{{ xhdxGasRefundBalanceFormatted }} xHDX</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { getFormattedBalance } from '@/services/utils';

export default defineComponent({
  name: 'XhdxBalanceDetails',
  props: {
    ethAccountData: {
      type: Object,
      default: () => {
        return {};
      },
    },
  },
  setup(props) {
    const xhdxTotalBalanceFormatted = computed(() => {
      if (!props.ethAccountData.isXhdxTotalBalanceZero) {
        return getFormattedBalance(props.ethAccountData.xhdxTotalBalance);
      }
      return '0';
    });
    const xhdxGasRefundBalanceFormatted = computed(() => {
      if (!props.ethAccountData.isXhdxTotalBalanceZero) {
        return getFormattedBalance(props.ethAccountData.xhdxGasRefundBalance);
      }
      return '0';
    });
    const xhdxBoughtBalanceFormatted = computed(() => {
      if (!props.ethAccountData.isXhdxTotalBalanceZero) {
        return getFormattedBalance(props.ethAccountData.xhdxBoughtBalance);
      }
      return '0';
    });

    return {
      xhdxTotalBalanceFormatted,
      xhdxGasRefundBalanceFormatted,
      xhdxBoughtBalanceFormatted,
    };
  },
});
</script>
