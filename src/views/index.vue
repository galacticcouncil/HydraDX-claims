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

          <div
            v-if="wizardState.wizardStep === 0"
            class="wizard-step-container step-0"
          >
            <div v-if="xhdxBalanceFormatted >= 0" class="text-label">
              Owned Balance: {{ xhdxBalanceFormatted }} xHDX
            </div>

            <a
              v-if="ethAccountData.connectedAccount.length === 0"
              class="hdx-btn connect-metamask"
              :class="{
                disabled: ethAccountData.manuallyEnteredAccount.length > 0,
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

            <div
              v-if="ethAccountData.connectedAccount.length === 0"
              class="text-label"
            >
              Or Enter your ETH address
            </div>

            <input
              v-if="ethAccountData.connectedAccount.length === 0"
              type="text"
              class="hdx-input eth-addres"
              placeholder="ETH address"
              v-model="ethAccountData.manuallyEnteredAccount"
            />

            <a
              v-if="
                ethAccountData.manuallyEnteredAccount.length > 0 &&
                !ethAccountData.connectedAccount
              "
              class="hdx-btn next-step"
              :class="{ disabled: !ethAccountData.manuallyEnteredAccountValid }"
              href="#"
              @click.prevent="connectEthAccount"
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
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, onMounted, reactive, computed, watch } from 'vue';

import ProgressLine from '@/components/ProgressLine';
import {
  initWeb3Instance,
  getWeb3Instance,
  getTokenBalanceByAddress,
} from '@/services/blockchianUtils';

import { getFormattedBalanceXhdx } from '@/services/utils';

export default defineComponent({
  components: {
    ProgressLine,
  },
  setup() {
    initWeb3Instance();

    const wizardState = reactive({
      wizardStep: 0,
      stepValidationStatus: [false, false, false, false],
      web3Inst: getWeb3Instance(),
    });
    const ethAccountData = reactive({
      connectedAccount: '',
      manuallyEnteredAccount: '',
      manuallyEnteredAccountValid: false,
      xhdxBalance: -1,
    });

    const xhdxBalanceFormatted = computed(() => {
      if (ethAccountData.xhdxBalance >= 0) {
        return getFormattedBalanceXhdx(ethAccountData.xhdxBalance);
      }
      return -1;
    });

    console.log(wizardState.web3Inst);

    watch(
      () => ethAccountData.manuallyEnteredAccount,
      newVal => {
        ethAccountData.manuallyEnteredAccountValid = !!wizardState.web3Inst.utils.isAddress(
          newVal
        );
        console.log(!!wizardState.web3Inst.utils.isAddress(newVal));
      }
    );
    watch(
      () => ethAccountData.xhdxBalance,
      newVal => {
        wizardState.stepValidationStatus[0] = newVal >= 0;
      }
    );

    const isNextStepValid = computed(() => {
      return wizardState.stepValidationStatus[wizardState.wizardStep];
    });

    const onConnectMetamaskClick = async () => {
      try {
        const account = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        console.log('accounts- ', account);
        ethAccountData.xhdxBalance = await getTokenBalanceByAddress(account[0]);
        ethAccountData.connectedAccount = account[0];
      } catch (e) {
        console.log(e);
      }
    };

    const connectEthAccount = async () => {
      if (ethAccountData.manuallyEnteredAccountValid) {
        ethAccountData.xhdxBalance = await getTokenBalanceByAddress(
          ethAccountData.manuallyEnteredAccount
        );
        ethAccountData.connectedAccount = ethAccountData.manuallyEnteredAccount;
      }
    };
    const nextStepClick = () => {
      wizardState.wizardStep++;
    };

    onMounted(() => {
      if (typeof window.ethereum !== 'undefined') {
        console.log('MetaMask is installed!', window.ethereum.isMetaMask);
      }
    });

    return {
      onConnectMetamaskClick,
      wizardState,
      isNextStepValid,
      ethAccountData,
      xhdxBalanceFormatted,
      connectEthAccount,
      nextStepClick,
    };
  },
});
</script>
