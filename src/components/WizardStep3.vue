<template>
  <div class="wizard-step-container step-3">
    <div class="sign-address-container">
      <div class="copy-action-btn">
        <img v-show="!step3State.copied" :src="copyIconSrc" alt="Copy" />
        <img v-show="step3State.copied" :src="checkedIconSrc" alt="Copy" />
      </div>
      <div class="sign-address">{{ step3State.addressValue }}</div>
    </div>

    <input
      type="text"
      class="hdx-input response-input"
      placeholder="Response"
      v-model="step3State.responseValue"
    />

    <a
      class="hdx-btn next-step"
      :class="{ disabled: !isNextStepValid }"
      href="#"
      @click.prevent="nextStepClick"
      >SIGN
    </a>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, onMounted } from 'vue';
import ClipboardJS from 'clipboard';

interface Step3State {
  addressValue: string;
  responseValue: string;
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
    nextStepClick: {
      type: Function,
      default: () => {},
    },
    isNextStepValid: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    const step3State = reactive({
      addressValue: '0x29Fb08a81867d8F61BcE689d2dC366687291E747',
      responseValue: '',
      clipboardInst: null,
      copied: false,
    } as Step3State);

    onMounted(async () => {
      step3State.clipboardInst = new ClipboardJS('.copy-action-btn', {
        text() {
          return step3State.addressValue;
        },
      });

      step3State.clipboardInst.on('success', () => {
        step3State.copied = true;

        setTimeout(() => {
          step3State.copied = false;
        }, 2000);
      });
    });

    return {
      step3State,
      copyIconSrc: require('@/assets/images/copy.svg'),
      checkedIconSrc: require('@/assets/images/checked.svg'),
    };
  },
});
</script>
