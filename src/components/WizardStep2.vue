<template>
  <div
    class="wizard-step-container step-1"
    v-show="
      (step2State.allAvailableAccounts.length === 0 &&
        !hdxAccountData.connectedAccount) ||
      (step2State.allAvailableAccounts.length > 0 &&
        hdxAccountData.connectedAccount)
    "
  >
    <div class="text-label">Owned Balance: {{ xhdxBalanceFormatted }} xHDX</div>
    <div class="selected-account-view eth-account">
      {{ ethAccountData.connectedAccount }}
    </div>

    <a
      v-if="!hdxAccountData.connectedAccount"
      class="hdx-btn connect-metamask"
      href="#"
      @click.prevent="onConnectPolkadotExtClick"
      >Connect Polkadot.js</a
    >
    <div v-if="hdxBalanceFormatted >= 0" class="text-label">
      Owned Balance: {{ hdxBalanceFormatted }} HDX
    </div>
    <div
      v-if="hdxAccountData.connectedAccount"
      class="selected-account-view eth-account"
    >
      {{
        getPolkadotFormattedAddress(
          hdxAccountData.connectedAccount.address,
          'polkadot'
        )
      }}
    </div>

    <a
      class="hdx-btn next-step"
      :class="{ disabled: !isNextStepValid }"
      href="#"
      @click.prevent="nextStepClick"
      >Claim
      <span>&#10145;</span>
    </a>
  </div>
  <div
    v-show="
      step2State.allAvailableAccounts.length > 0 &&
      !hdxAccountData.connectedAccount
    "
    class="wizard-step-container polkadot-accounts-select"
  >
    <div class="list-title">Accounts:</div>
    <div class="accounts-list-container">
      <div
        v-for="(account, index) in step2State.allAvailableAccounts"
        :key="index"
        @click.prevent="() => selectPdAccount(account)"
        class="account-item"
        :class="{
          selected:
            step2State.selectedAccount &&
            step2State.selectedAccount.address === account.address,
        }"
      >
        <div class="name">
          {{ account.meta.name }}
        </div>
        <div class="address">
          {{ getPolkadotFormattedAddress(account.address, 'polkadot') }}
        </div>
      </div>
    </div>
    <a
      class="hdx-btn select-pd-account"
      :class="{ disabled: !step2State.selectedAccount }"
      href="#"
      @click.prevent="connectPdAccount"
      >OK
    </a>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, reactive, onMounted } from 'vue';
import {
  getFormattedBalanceXhdx,
  getPolkadotFormattedAddress,
} from '@/services/utils';
import {
  getPolkadotIdentityBalanceByAddress,
  initPolkadotApiInstance,
} from '@/services/polkadotUtils';
import { web3Enable, web3Accounts } from '@polkadot/extension-dapp';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';

interface Step2State {
  isPDExtensionApproveWaiting: boolean;
  isPDExtensionApproved: boolean;
  selectedAccount: InjectedAccountWithMeta | null;
  allAvailableAccounts: InjectedAccountWithMeta[];
}

export default defineComponent({
  name: 'WizardStep2',
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
    hdxAccountData: {
      type: Object,
      default: () => {
        return {};
      },
    },
    onConnectHdxAccount: {
      type: Function,
      default: () => {},
    },
    nextStepClick: {
      type: Function,
      default: () => {},
    },
    isNextStepValid: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const step2State = reactive({
      isPDExtensionApproveWaiting: true,
      isPDExtensionApproved: false,
      selectedAccount: null,
      allAvailableAccounts: [],
    } as Step2State);

    // watch(
    //   () => step1State.manuallyEnteredAccount,
    //   newVal => {
    //     step1State.manuallyEnteredAccountValid = props.wizardState.web3Inst.utils.isAddress(
    //       newVal
    //     );
    //   }
    // );
    onMounted(async () => {
      console.log('onMounted');
      await initPolkadotApiInstance();
    });

    const xhdxBalanceFormatted = computed(() => {
      if (props.ethAccountData.xhdxBalance >= 0) {
        return getFormattedBalanceXhdx(props.ethAccountData.xhdxBalance);
      }
      return -1;
    });
    const hdxBalanceFormatted = computed(() => {
      // if (props.ethAccountData.xhdxBalance >= 0) {
      //   return getFormattedBalanceXhdx(props.ethAccountData.xhdxBalance);
      // }
      return -1;
    });

    const onConnectPolkadotExtClick = async () => {
      let allInjected = [];

      try {
        allInjected = await web3Enable('CLAIM.HYDRA.DX');

        if (allInjected && allInjected.length > 0) {
          step2State.isPDExtensionApproveWaiting = false;
          step2State.isPDExtensionApproved = true;
        } else {
          step2State.isPDExtensionApproveWaiting = false;
          step2State.isPDExtensionApproved = false;
          return;
          //TODO add reject notice
        }
      } catch (e) {
        console.log(e);
        step2State.isPDExtensionApproveWaiting = false;
        step2State.isPDExtensionApproved = false;
        //TODO add reject notice
        return;
      }

      const allAccounts = await web3Accounts();

      console.log('allInjected - ', allInjected);
      console.log('allAccounts - ', allAccounts);

      step2State.allAvailableAccounts = allAccounts;
    };

    const selectPdAccount = (account: InjectedAccountWithMeta) => {
      step2State.selectedAccount =
        step2State.selectedAccount &&
        step2State.selectedAccount.address === account.address
          ? null
          : account;
    };

    const connectPdAccount = async () => {
      if (!step2State.selectedAccount) return;

      const balance = await getPolkadotIdentityBalanceByAddress(
        step2State.selectedAccount.address
      );
      console.log(balance);

      props.onConnectHdxAccount(step2State.selectedAccount, 0);
    };

    return {
      step2State,
      onConnectPolkadotExtClick,
      selectPdAccount,
      connectPdAccount,
      xhdxBalanceFormatted,
      hdxBalanceFormatted,
      getPolkadotFormattedAddress,
    };
  },
});
</script>
