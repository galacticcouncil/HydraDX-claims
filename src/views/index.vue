<template>
  <div class="hdx-claim-main-container">
    <div class="hdx-claim-inner-container">
      <header class="main-header">
        <a href="/">
          <img src="@/assets/images/blue-logo.svg" alt="claim.hydra.dx" />
          <h1>claim.hydra.dx</h1>
        </a>
      </header>
      <div class="content-container">
        <div class="wizard-steps-container">
          <div class="wizard-progress-status">
            <ProgressLine :step="wizardState.wizardStep" />
          </div>
          <div v-show="wizardState.loading" class="loading-cover-message">
            <span v-show="!wizardState.isReconnectBtn">Loading ...</span>
            <a
              v-show="wizardState.isReconnectBtn"
              href="#"
              @click.prevent="onReconnectClick"
              class="hdx-btn loading-cover-btn reconnect-btn"
              >Reconnect</a
            >
          </div>
          <WizardStep1
            v-if="wizardState.wizardStep === 1"
            :wizard-state="wizardState"
            :eth-account-data="ethAccountData"
            :on-connect-eth-account="onConnectEthAccount"
            :is-next-step-valid="isNextStepValid"
            :next-step-click="nextStepClick"
          />
          <WizardStep2
            v-if="wizardState.wizardStep === 2"
            :wizard-state="wizardState"
            :eth-account-data="ethAccountData"
            :hdx-account-data="hdxAccountData"
            :on-connect-hdx-account="onConnectHdxAccount"
            :is-next-step-valid="isNextStepValid"
            :next-step-click="nextStepClick"
            :on-fetch-claimable-hdx-amount="onFetchClaimableHdxAmount"
          />
          <WizardStep3
            v-if="wizardState.wizardStep === 3"
            :wizard-state="wizardState"
            :eth-account-data="ethAccountData"
            :hdx-account-data="hdxAccountData"
            :on-connect-hdx-account="onConnectHdxAccount"
            :is-next-step-valid="isNextStepValid"
            :next-step-click="nextStepClick"
          />
          <WizardStep4 v-if="wizardState.wizardStep === 4" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, reactive, computed, watch } from 'vue';

import ProgressLine from '@/components/ProgressLine.vue';
import WizardStep1 from '@/components/WizardStep1.vue';
import WizardStep2 from '@/components/WizardStep2.vue';
import WizardStep3 from '@/components/WizardStep3.vue';
import WizardStep4 from '@/components/WizardStep4.vue';
import {
  initWeb3Instance,
  getWeb3Instance,
  getXhdxBalanceByAddress,
  getOwnedHdxBalanceByAddress,
} from '@/services/ethUtils';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import Web3 from 'web3';
import { initPolkadotApiInstance } from '@/services/polkadotUtils';
import { isValueZero } from '@/services/utils';

interface WizardState {
  wizardStep: number;
  stepValidationStatus: boolean[];
  web3Inst: Web3;
  loading: boolean;
  isReconnectBtn: boolean;
}
interface EthAccountData {
  isMetamaskAvailable: boolean;
  connectedAccount: string;
  xhdxBalance: number;
  hdxOwnedBalance: string;
  claimableHdxAmount: string;
  isClaimableHdxAmountZero: boolean;
}
interface HdxAccountData {
  isPolkadotExtAvailable: boolean;
  connectedAccount: InjectedAccountWithMeta | null;
  hdxBalance: number;
}

export default defineComponent({
  components: {
    ProgressLine,
    WizardStep1,
    WizardStep2,
    WizardStep3,
    WizardStep4,
  },
  setup() {
    initWeb3Instance();

    const wizardState = reactive({
      wizardStep: 1,
      stepValidationStatus: [false, false, true, false],
      web3Inst: getWeb3Instance(),
      loading: true,
      isReconnectBtn: false,
    } as WizardState);

    const ethAccountData = reactive({
      isMetamaskAvailable: false,
      connectedAccount: '',
      xhdxBalance: -1,
      hdxOwnedBalance: '0',
      claimableHdxAmount: '0',
      isClaimableHdxAmountZero: true,
    } as EthAccountData);

    const hdxAccountData = reactive({
      isPolkadotExtAvailable: false,
      connectedAccount: null,
      hdxBalance: -1,
    } as HdxAccountData);

    watch(
      () => ethAccountData.xhdxBalance,
      newVal => {
        wizardState.stepValidationStatus[0] = newVal >= 0;
      }
    );
    watch(
      () => hdxAccountData.connectedAccount,
      newVal => {
        wizardState.stepValidationStatus[1] = !!newVal;
      }
    );
    watch(
      () => ethAccountData.isClaimableHdxAmountZero,
      newVal => {
        if (!newVal) wizardState.stepValidationStatus[2] = false;
      }
    );

    const isNextStepValid = computed(() => {
      return wizardState.stepValidationStatus[wizardState.wizardStep - 1];
    });

    const onConnectEthAccount = async (account: string) => {
      ethAccountData.xhdxBalance = await getXhdxBalanceByAddress(account);
      ethAccountData.hdxOwnedBalance = await getOwnedHdxBalanceByAddress(
        account
      );
      ethAccountData.connectedAccount = account;
    };
    const onConnectHdxAccount = async (
      account: InjectedAccountWithMeta,
      hdxBalance: number
    ) => {
      hdxAccountData.hdxBalance = hdxBalance;
      hdxAccountData.connectedAccount = account;
    };

    const onFetchClaimableHdxAmount = async (amount: string) => {
      ethAccountData.claimableHdxAmount = amount;
      ethAccountData.isClaimableHdxAmountZero = isValueZero(amount);
    };

    const onReconnectClick = () => {
      wizardState.isReconnectBtn = false;
      initPolkadotApiInstanceWrapper();
    };

    const nextStepClick = () => {
      wizardState.wizardStep++;
    };

    const initPolkadotApiInstanceWrapper = async () => {
      await initPolkadotApiInstance({
        connected: () => {
          console.log('pd api connected');
          wizardState.loading = false;
          wizardState.isReconnectBtn = false;
        },
        error: () => {
          console.log('pd api error');
          wizardState.loading = true;
          wizardState.isReconnectBtn = true;
        },
        ready: () => {
          console.log('pd api error');
          wizardState.loading = false;
          wizardState.isReconnectBtn = false;
        },
        disconnected: () => {
          console.log('pd api error');
          wizardState.loading = true;
        },
      });
    };

    onMounted(async () => {
      if (
        // @ts-ignore
        typeof window.ethereum !== 'undefined' &&
        // @ts-ignore
        window.ethereum.isMetaMask
      ) {
        // console.log('MetaMask is installed!', window.ethereum.isMetaMask);
        ethAccountData.isMetamaskAvailable = true;
      }
      await initPolkadotApiInstanceWrapper();
    });

    return {
      wizardState,
      ethAccountData,
      hdxAccountData,
      isNextStepValid,
      onConnectEthAccount,
      onConnectHdxAccount,
      onFetchClaimableHdxAmount,
      nextStepClick,
      onReconnectClick,
    };
  },
});
</script>
