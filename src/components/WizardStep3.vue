<template>
  <div class="wizard-step-container step-3">
    <div class="sign-message-help">
      <a href="https://docs.hydradx.io/claim#03-sign" target="_blank"
        >ADDRESS DOESN'T MATCH?
      </a>
    </div>
    <div class="sign-message-container">
      <div
        v-show="ethAccountData.accountConnectionMethod === 'manual'"
        class="copy-action-btn"
      >
        <img v-show="!step3State.copied" :src="copyIconSrc" alt="Copy" />
        <img v-show="step3State.copied" :src="checkedIconSrc" alt="Copy" />
      </div>
      <div class="sign-message">{{ step3State.messageValue }}</div>
    </div>

    <input
      type="text"
      class="hdx-input response-input"
      placeholder="Response..."
      v-model="step3State.responseValue"
      :disabled="
        step3State.isResponseInputDisabled ||
        ethAccountData.accountConnectionMethod === 'metamask'
      "
    />
    <a
      v-show="
        ethAccountData.isMetamaskAvailable &&
        step3State.responseValueForSend.length === 0
      "
      class="hdx-btn next-step"
      href="#"
      @click.prevent="onSignMessageClick"
      >SIGN
    </a>
    <a
      v-show="
        !ethAccountData.isMetamaskAvailable ||
        step3State.responseValueForSend.length > 0
      "
      :class="{ disabled: !step3State.isSignatureValid }"
      class="hdx-btn next-step"
      href="#"
      @click.prevent="onClaimClick"
      >{{
        (!step3State.isSignatureValid &&
          step3State.responseValueForSend.length === 0) ||
        (step3State.isSignatureValid &&
          step3State.responseValueForSend.length > 0)
          ? 'CLAIM'
          : 'Signature in not valid'
      }}
    </a>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, onMounted, watch, PropType } from 'vue';
import ClipboardJS from 'clipboard';
import {
  signMessageWithMetaMask,
  validateMessageSignature,
} from '@/services/ethUtils';
import { claimBalance, accountToHex } from '@/services/polkadotUtils';
import { getHydraDxFormattedAddress } from '@/services/utils';

interface Step3State {
  messageValue: string;
  responseValue: string;
  responseValueForSend: string;
  clipboardInst: any;
  copied: boolean;
  isResponseInputDisabled: boolean;
  isSignatureValid: boolean;
}

export default defineComponent({
  name: 'WizardStep3',
  props: {
    wizardState: {
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
    setClaimProcessStatus: {
      type: Function as PropType<() => void>,
      default: () => {},
    },
    isNextStepValid: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const step3State = reactive({
      messageValue: `I hereby claim all my HDX tokens to wallet:${accountToHex(
        props.hdxAccountData.connectedAccount.address
      ).replace('0x', '')}`,
      responseValue: '',
      responseValueForSend: '',
      clipboardInst: null,
      copied: false,
      isResponseInputDisabled: false,
      isSignatureValid: false,
    } as Step3State);

    onMounted(async () => {
      step3State.clipboardInst = new ClipboardJS('.copy-action-btn', {
        text() {
          return step3State.messageValue;
        },
      });

      step3State.clipboardInst.on('success', () => {
        step3State.copied = true;

        setTimeout(() => {
          step3State.copied = false;
        }, 2000);
      });
    });

    watch(
      () => step3State.responseValue,
      (newVal, oldVal) => {
        if (newVal === oldVal) return;

        try {
          const parsedJsonResult = JSON.parse(newVal);
          if (parsedJsonResult.sig !== undefined)
            step3State.responseValueForSend = parsedJsonResult.sig;
        } catch (e) {
          step3State.responseValueForSend = newVal;
        }
      }
    );

    watch(
      () => step3State.responseValueForSend,
      async (newVal, oldVal) => {
        if (newVal === oldVal) return;

        step3State.isSignatureValid = await validateMessageSignature(
          props.ethAccountData.connectedAccount,
          step3State.messageValue,
          newVal
        );
      }
    );

    const onSignMessageClick = async () => {
      step3State.responseValue = await signMessageWithMetaMask(
        props.ethAccountData.connectedAccount,
        step3State.messageValue
      );
      if (step3State.responseValue && step3State.responseValue.length > 0)
        step3State.isResponseInputDisabled = true;
    };
    const onClaimClick = async () => {
      await claimBalance(
        step3State.responseValueForSend,
        getHydraDxFormattedAddress(
          props.hdxAccountData.connectedAccount.address
        ),
        props.setClaimProcessStatus
      );
    };

    return {
      step3State,
      copyIconSrc: require('@/assets/images/copy.svg'),
      checkedIconSrc: require('@/assets/images/checked.svg'),
      onSignMessageClick,
      onClaimClick,
    };
  },
});
</script>
