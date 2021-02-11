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
            <a
              class="hdx-btn connect-metamask"
              :class="{
                disabled: ethAccountData.manuallyEnteredAccount.length > 0,
              }"
              href="#"
              @click.prevent="onConnectMetamaskClick"
              >Connect Metamask</a
            >

            <div class="text-label">Or Enter your ETH address</div>

            <input
              type="text"
              class="hdx-input eth-addres"
              placeholder="ETH address"
              v-model="ethAccountData.manuallyEnteredAccount"
            />

            <a
              class="hdx-btn next-step"
              :class="{ disabled: !isNextStepValid }"
              href="#"
              @click.prevent="onConnectMetamaskClick"
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

export default defineComponent({
  components: {
    ProgressLine,
  },
  setup() {
    const wizardState = reactive({
      wizardStep: 0,
      stepValidationStatus: [false, false, false, false],
    });
    const ethAccountData = reactive({
      metamaskAccount: '',
      manuallyEnteredAccount: '',
    });

    watch(
      () => ethAccountData.manuallyEnteredAccount,
      newVal => {
        console.log('manuallyEnteredAccount newVal - ', newVal);
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
      } catch (e) {
        console.log(e);
      }
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
    };
  },
});
</script>
