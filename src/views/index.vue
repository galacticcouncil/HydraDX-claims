<template>
  <div class="hdx-claim-main-container">
    <div class="hdx-claim-inner-container">
      <header class="main-header">
        <a href="/">
          <img src="@/assets/images/eye-logo.png" alt="claim.hydra.dx" />
          <h1>claim.hydra.dx</h1>
        </a>
      </header>
      <div class="content-container">
        <div class="wizard-steps-container">
          <div class="wizard-progress-status">
            <ProgressLine :step="wizardState.wizardStep" />
          </div>
          <LoadingCover
            :wizard-state="wizardState"
            :hdx-account-data="hdxAccountData"
            :on-reconnect-click="onReconnectClick"
            :on-connect-polkadot-ext="onConnectPolkadotExt"
            :on-install-pd-ext-click="onInstallPdExtClick"
          />
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
            :go-to-step="goToStep"
            :set-global-notice="setGlobalNotice"
          />
          <WizardStep3
            v-if="wizardState.wizardStep === 3"
            :wizard-state="wizardState"
            :eth-account-data="ethAccountData"
            :hdx-account-data="hdxAccountData"
            :on-connect-hdx-account="onConnectHdxAccount"
            :is-next-step-valid="isNextStepValid"
            :next-step-click="nextStepClick"
            :set-claim-process-status="setClaimProcessStatus"
          />
          <WizardStep4
            v-if="wizardState.wizardStep === 4"
            :wizard-state="wizardState"
            :hdx-account-data="hdxAccountData"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, reactive, computed, watch } from 'vue';

import ProgressLine from '@/components/ProgressLine.vue';
import LoadingCover from '@/components/LoadingCover.vue';
import WizardStep1 from '@/components/WizardStep1.vue';
import WizardStep2 from '@/components/WizardStep2.vue';
import WizardStep3 from '@/components/WizardStep3.vue';
import WizardStep4 from '@/components/WizardStep4.vue';
import {
  initWeb3Instance,
  getWeb3Instance,
  getXhdxAmountByAddress,
} from '@/services/ethUtils';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import Web3 from 'web3';
import {
  getClaimableHdxAmountByAddress,
  initPolkadotApiInstance,
} from '@/services/polkadotUtils';
import { isValueZero } from '@/services/utils';
import type { ClaimProcessStatus } from '@/types';
import { initPolkadotExtension } from '@/services/polkadotExtension';

interface WizardState {
  wizardStep: number;
  stepValidationStatus: boolean[];
  web3Inst: Web3;
  loading: boolean;
  claiming: ClaimProcessStatus;
  isReconnectBtn: boolean;
  installPdExtClicked: boolean;
  globalNotice: {
    open: boolean;
    message: string;
  };
}
interface EthAccountData {
  isMetamaskAvailable: boolean;
  connectedAccount: string;
  xhdxBoughtBalance: string;
  isXhdxTotalBalanceZero: boolean;
  xhdxTotalBalance: string;
  xhdxGasRefundBalance: string;
  claimableHdxAmount: string;
  isClaimableHdxAmountZero: boolean;
}
interface HdxAccountData {
  isPolkadotExtAvailable: boolean;
  connectedAccount: InjectedAccountWithMeta | null;
}

export default defineComponent({
  components: {
    LoadingCover,
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
      installPdExtClicked: false,
      claiming: {
        inProgress: false,
        completed: false,
        resultStatus: 0,
        resultMessage: '',
        processMessage: '',
      },
      globalNotice: {
        open: false,
        message: '',
      },
      isReconnectBtn: false,
    } as WizardState);

    const ethAccountData = reactive({
      isMetamaskAvailable: false,
      connectedAccount: '',

      isXhdxTotalBalanceZero: true,
      xhdxTotalBalance: '0',

      xhdxBoughtBalance: '0',

      xhdxGasRefundBalance: '0',

      claimableHdxAmount: '0',
      isClaimableHdxAmountZero: true,
    } as EthAccountData);

    const hdxAccountData = reactive({
      isPolkadotExtAvailable: false,
      currentExtAccountsList: [],
      connectedAccount: null,
    } as HdxAccountData);

    watch(
      () => ethAccountData.xhdxTotalBalance,
      newVal => {
        const isValZero = isValueZero(newVal);
        ethAccountData.isXhdxTotalBalanceZero = isValZero;
        wizardState.stepValidationStatus[0] =
          !isValZero && !ethAccountData.isClaimableHdxAmountZero;
      }
    );
    watch(
      () => hdxAccountData.connectedAccount,
      newVal => {
        wizardState.stepValidationStatus[1] =
          !!newVal && !ethAccountData.isClaimableHdxAmountZero;
      }
    );
    watch(
      () => ethAccountData.isClaimableHdxAmountZero,
      newVal => {
        wizardState.stepValidationStatus[0] =
          !newVal && !ethAccountData.isXhdxTotalBalanceZero;
      }
    );

    watch(
      () => wizardState.claiming,
      (newVal, oldVal) => {
        if (
          !newVal.inProgress &&
          newVal.completed &&
          newVal.completed !== oldVal.completed
        ) {
          wizardState.wizardStep++;
        }
      }
    );

    const isNextStepValid = computed(() => {
      return wizardState.stepValidationStatus[wizardState.wizardStep - 1];
    });

    const onConnectEthAccount = async (account: string) => {
      ethAccountData.xhdxBoughtBalance = await getXhdxAmountByAddress(
        account,
        'bought'
      );
      ethAccountData.xhdxTotalBalance = await getXhdxAmountByAddress(
        account,
        'totalClaim'
      );
      ethAccountData.xhdxGasRefundBalance = await getXhdxAmountByAddress(
        account,
        'gasRefund'
      );
      ethAccountData.connectedAccount = account.trim().toLocaleLowerCase();

      ethAccountData.claimableHdxAmount = await getClaimableHdxAmountByAddress(
        account
      );
      ethAccountData.isClaimableHdxAmountZero = isValueZero(
        ethAccountData.claimableHdxAmount
      );
    };
    const onConnectHdxAccount = async (account: InjectedAccountWithMeta) => {
      hdxAccountData.connectedAccount = account;
    };

    const onReconnectClick = () => {
      wizardState.isReconnectBtn = false;
      initPolkadotApiInstanceWrapper();
    };
    const setClaimProcessStatus = (status: ClaimProcessStatus): void => {
      wizardState.claiming = {
        ...status,
        resultMessage: status.resultMessage || '',
        processMessage: status.processMessage || '',
      };
    };

    const nextStepClick = () => {
      wizardState.wizardStep++;
    };

    const goToStep = (step: number) => {
      wizardState.wizardStep = step;
    };
    const setGlobalNotice = (open: boolean, message: string = '') => {
      wizardState.globalNotice = { open, message };
    };

    const initPolkadotApiInstanceWrapper = async () => {
      await initPolkadotApiInstance({
        connected: () => {
          wizardState.loading = false;
          wizardState.isReconnectBtn = false;
        },
        error: () => {
          wizardState.loading = true;
          wizardState.isReconnectBtn = true;
        },
        ready: () => {
          wizardState.loading = false;
          wizardState.isReconnectBtn = false;
        },
        disconnected: () => {
          wizardState.loading = true;
        },
      });
    };

    const onConnectPolkadotExt = async () => {
      let allInjected = await initPolkadotExtension(
        () => {
          console.log('Polkadot.js extension has been connected!');
        },
        e => {
          console.log('Polkadot.js extension has not been connected! - ', e);
        }
      );

      if (allInjected) hdxAccountData.isPolkadotExtAvailable = true;
    };

    const onInstallPdExtClick = () => {
      wizardState.installPdExtClicked = true;
    };

    onMounted(async () => {
      if (
        // @ts-ignore
        typeof window.ethereum !== 'undefined' &&
        // @ts-ignore
        window.ethereum.isMetaMask
      ) {
        ethAccountData.isMetamaskAvailable = true;
      }
      await initPolkadotApiInstanceWrapper();

      document.addEventListener('visibilitychange', function () {
        if (!document.hidden) {
          if (wizardState.installPdExtClicked) {
            wizardState.installPdExtClicked = false;
            window.location.reload();
          }
        }
      });
    });

    return {
      wizardState,
      ethAccountData,
      hdxAccountData,
      isNextStepValid,
      onConnectEthAccount,
      onConnectHdxAccount,
      nextStepClick,
      onReconnectClick,
      setClaimProcessStatus,
      onConnectPolkadotExt,
      goToStep,
      setGlobalNotice,
      onInstallPdExtClick,
    };
  },
});
</script>
