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
          <WizardStep1
            v-if="wizardState.wizardStep === 0"
            :wizard-state="wizardState"
            :eth-account-data="ethAccountData"
            :on-connect-eth-account="onConnectEthAccount"
            :is-next-step-valid="isNextStepValid"
            :on-connect-metamask="onConnectMetamask"
            :next-step-click="nextStepClick"
          />
          <WizardStep2
            v-if="wizardState.wizardStep === 1"
            :wizard-state="wizardState"
            :eth-account-data="ethAccountData"
            :hdx-account-data="hdxAccountData"
            :on-connect-hdx-account="onConnectHdxAccount"
            :is-next-step-valid="isNextStepValid"
            :next-step-click="nextStepClick"
          />
          <WizardStep3
            v-if="wizardState.wizardStep === 2"
            :wizard-state="wizardState"
            :eth-account-data="ethAccountData"
            :hdx-account-data="hdxAccountData"
            :on-connect-hdx-account="onConnectHdxAccount"
            :is-next-step-valid="isNextStepValid"
            :next-step-click="nextStepClick"
          />
          <WizardStep4 v-if="wizardState.wizardStep === 3" />
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
import { initWeb3Instance, getWeb3Instance } from '@/services/ethUtils';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import Web3 from 'web3';

interface WizardState {
  wizardStep: number;
  stepValidationStatus: boolean[];
  web3Inst: Web3;
}
interface EthAccountData {
  isMetamaskAvailable: boolean;
  connectedAccount: string;
  xhdxBalance: number;
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
      wizardStep: 0,
      stepValidationStatus: [false, false, true, false],
      web3Inst: getWeb3Instance(),
    } as WizardState);

    const ethAccountData = reactive({
      isMetamaskAvailable: false,
      connectedAccount: '',
      xhdxBalance: -1,
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

    const isNextStepValid = computed(() => {
      return wizardState.stepValidationStatus[wizardState.wizardStep];
    });

    const onConnectMetamask = async (account: string, xhdxBalance: number) => {
      console.log('account - ', account);
      console.log('xhdxBalance - ', xhdxBalance);
      ethAccountData.xhdxBalance = xhdxBalance;
      ethAccountData.connectedAccount = account;
    };

    const onConnectEthAccount = async (
      account: string,
      xhdxBalance: number
    ) => {
      console.log('account - ', account);
      console.log('xhdxBalance - ', xhdxBalance);
      ethAccountData.xhdxBalance = xhdxBalance;
      ethAccountData.connectedAccount = account;
    };
    const onConnectHdxAccount = async (
      account: InjectedAccountWithMeta,
      hdxBalance: number
    ) => {
      console.log('account - ', account);
      console.log('hdxBalance - ', hdxBalance);
      hdxAccountData.hdxBalance = hdxBalance;
      hdxAccountData.connectedAccount = account;
    };
    const nextStepClick = () => {
      wizardState.wizardStep++;
    };

    onMounted(() => {
      if (
        // @ts-ignore
        typeof window.ethereum !== 'undefined' &&
        // @ts-ignore
        window.ethereum.isMetaMask
      ) {
        // console.log('MetaMask is installed!', window.ethereum.isMetaMask);
        ethAccountData.isMetamaskAvailable = true;
      }
    });

    return {
      wizardState,
      ethAccountData,
      hdxAccountData,
      isNextStepValid,
      onConnectMetamask,
      onConnectEthAccount,
      onConnectHdxAccount,
      nextStepClick,
    };
  },
});
</script>
