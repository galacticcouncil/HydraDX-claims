<template>
  <div class="wizard-step-container step-1">
    <div v-if="xhdxBalanceFormatted >= 0" class="text-label">
      Owned Balance: {{ xhdxBalanceFormatted }} xHDX
    </div>

    <div v-show="step1State.notClaimableAddress" class="text-label">
      There is not a claim associated with this address ({{
        step1State.notClaimableAddress
      }}). Did you use the right one?
    </div>

    <a
      v-if="ethAccountData.connectedAccount.length === 0"
      class="hdx-btn connect-metamask"
      :class="{
        disabled:
          step1State.manuallyEnteredAccount.length > 0 ||
          !ethAccountData.isMetamaskAvailable,
      }"
      href="#"
      @click.prevent="onConnectMetamaskClick"
      >Connect Metamask</a
    >
    <div
      v-if="ethAccountData.connectedAccount.length > 0"
      class="selected-account-view eth-account"
    >
      {{ ethAccountData.connectedAccount }}
    </div>

    <div v-if="ethAccountData.connectedAccount.length === 0" class="text-label">
      Or Enter your ETH address
    </div>

    <input
      v-if="ethAccountData.connectedAccount.length === 0"
      type="text"
      class="hdx-input eth-addres"
      placeholder="ETH address"
      v-model="step1State.manuallyEnteredAccount"
    />

    <a
      v-if="
        step1State.manuallyEnteredAccount.length > 0 &&
        !ethAccountData.connectedAccount
      "
      class="hdx-btn next-step"
      :class="{ disabled: !step1State.manuallyEnteredAccountValid }"
      href="#"
      @click.prevent="onConnectEthAccountClick"
      >Connect
      <span>&#10145;</span>
    </a>

    <a
      v-else
      class="hdx-btn next-step"
      :class="{ disabled: !isNextStepValid }"
      href="#"
      @click.prevent="nextStepClick"
      >Next
      <span>&#10145;</span>
    </a>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, watch, reactive } from 'vue';
import { getFormattedBalance } from '@/services/utils';
import { isEhtAddressClaimable } from '@/services/ethUtils';
import { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';

interface Step1State {
  manuallyEnteredAccount: string;
  manuallyEnteredAccountValid: boolean;
  notClaimableAddress: boolean | string;
}

export default defineComponent({
  name: 'WizardStep1',
  props: {
    wizardState: {
      type: Object,
      default: () => {
        return {};
      },
    },
    ethAccountData: {
      type: Object,
      default: () => {
        return {};
      },
    },
    nextStepClick: {
      type: Function,
      default: () => {},
    },
    onConnectEthAccount: {
      type: Function,
      default: () => {},
    },
    isNextStepValid: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const step1State = reactive({
      manuallyEnteredAccount: '',
      manuallyEnteredAccountValid: false,
      notClaimableAddress: false,
    } as Step1State);

    watch(
      () => step1State.manuallyEnteredAccount,
      newVal => {
        const isValid = props.wizardState.web3Inst.utils.isAddress(newVal);
        step1State.manuallyEnteredAccountValid = isValid;
        if (!isValid) step1State.notClaimableAddress = false;
      }
    );

    const xhdxBalanceFormatted = computed(() => {
      if (props.ethAccountData.xhdxBalance >= 0) {
        return getFormattedBalance(props.ethAccountData.xhdxBalance);
      }
      return -1;
    });

    const onConnectMetamaskClick = async () => {
      try {
        // @ts-ignore
        const account = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        if (!(await isEhtAddressClaimable(account[0]))) {
          step1State.notClaimableAddress = account[0];
          return;
        }
        step1State.notClaimableAddress = false;
        props.onConnectEthAccount(account[0]);
      } catch (e) {
        console.log(e);
        step1State.notClaimableAddress = false;
        //TODO add error handler
      }
    };

    const onConnectEthAccountClick = async () => {
      if (step1State.manuallyEnteredAccountValid) {
        if (!(await isEhtAddressClaimable(step1State.manuallyEnteredAccount))) {
          step1State.notClaimableAddress = step1State.manuallyEnteredAccount;
          return;
        }
        step1State.notClaimableAddress = false;
        props.onConnectEthAccount(step1State.manuallyEnteredAccount);
      } else {
        //TODO add error handler
        step1State.notClaimableAddress = false;
      }
    };

    return {
      xhdxBalanceFormatted,
      onConnectMetamaskClick,
      onConnectEthAccountClick,
      step1State,
    };
  },
});
</script>
