<template>
  <div class="wizard-step-container step-1">
    <XhdxBalanceDetails
      v-if="!ethAccountData.isXhdxTotalBalanceZero"
      :eth-account-data="ethAccountData"
    />

    <div v-show="step1State.notClaimableAddress" class="text-label">
      No claim associated with address:<br />
      {{ step1State.notClaimableAddress }}<br />
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
      ><span v-if="!ethAccountData.isMetamaskAvailable"
        >Metamask is not connected</span
      ><span v-else>Connect Metamask</span></a
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
      placeholder="ETH address..."
      v-model="step1State.manuallyEnteredAccount"
    />

    <HdxBalanceDetails
      v-if="ethAccountData.connectedAccount.length !== 0"
      :eth-account-data="ethAccountData"
    />
    <!--    <div v-if="ethAccountData.connectedAccount.length !== 0" class="text-label">-->
    <!--      HDX to Claim: {{ hdxClaimableAmountFormatted }} HDX-->
    <!--    </div>-->

    <a
      v-if="
        step1State.manuallyEnteredAccount.length > 0 &&
        !ethAccountData.connectedAccount
      "
      class="hdx-btn next-step"
      :class="{ disabled: !step1State.manuallyEnteredAccountValid }"
      href="#"
      @click.prevent="onConnectEthAccountClick"
      >Continue
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
import { defineComponent, watch, reactive } from 'vue';
import { isEhtAddressClaimable } from '@/services/ethUtils';
import XhdxBalanceDetails from '@/components/XhdxBalanceDetails.vue';
import HdxBalanceDetails from '@/components/HdxBalanceDetails.vue';

interface Step1State {
  manuallyEnteredAccount: string;
  manuallyEnteredAccountValid: boolean;
  notClaimableAddress: boolean | string;
}

export default defineComponent({
  name: 'WizardStep1',
  components: {
    XhdxBalanceDetails,
    HdxBalanceDetails,
  },
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
        step1State.notClaimableAddress = false;
      }
    };

    return {
      onConnectMetamaskClick,
      onConnectEthAccountClick,
      step1State,
    };
  },
});
</script>
