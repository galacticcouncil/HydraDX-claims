<template>
  <div class="wizard-step-container step-3">
    <div class="sign-message-container">
      <div class="copy-action-btn">
        <img v-show="!step3State.copied" :src="copyIconSrc" alt="Copy" />
        <img v-show="step3State.copied" :src="checkedIconSrc" alt="Copy" />
      </div>
      <div class="sign-message">{{ step3State.messageValue }}</div>
    </div>

    <input
      type="text"
      class="hdx-input response-input"
      placeholder="Response"
      v-model="step3State.responseValue"
    />
    <!--    :class="{ disabled: !isNextStepValid }"-->
    <a
      v-show="step3State.responseValueForSend.length === 0"
      class="hdx-btn next-step"
      href="#"
      @click.prevent="onSignMessageClick"
      >SIGN
    </a>
    <a
      v-show="step3State.responseValueForSend.length > 0"
      class="hdx-btn next-step"
      href="#"
      @click.prevent="onClaimClick"
      >CLAIM
    </a>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, onMounted, watch } from 'vue';
import ClipboardJS from 'clipboard';
import { signMessageWithMetaMask } from '@/services/ethUtils';
import { claimBalance } from '@/services/polkadotUtils';
import { getPolkadotFormattedAddress } from '@/services/utils';

interface Step3State {
  messageValue: string;
  responseValue: string;
  responseValueForSend: string;
  clipboardInst: any;
  copied: boolean;
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
    isNextStepValid: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const step3State = reactive({
      messageValue: `I hereby claim all my xHDX tokens to wallet:${getPolkadotFormattedAddress(
        props.hdxAccountData.connectedAccount.address,
        'hydradx'
      )}`,
      responseValue: '',
      responseValueForSend: '',
      clipboardInst: null,
      copied: false,
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
        console.log(
          'step3State.responseValueForSend - ',
          step3State.responseValueForSend
        );
      }
    );

    const onSignMessageClick = async () => {
      step3State.responseValue = await signMessageWithMetaMask(
        props.ethAccountData.connectedAccount,
        step3State.messageValue
      );
    };
    const onClaimClick = async () => {
      console.log('claim');
      await claimBalance(
        step3State.responseValueForSend,
        getPolkadotFormattedAddress(props.hdxAccountData.connectedAccount.address)
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
