<template>
  <div
    class="wizard-step-container step-2"
    v-show="
      (!step2State.openAccountsList && !hdxAccountData.connectedAccount) ||
      (step2State.allAvailableAccounts.length > 0 &&
        hdxAccountData.connectedAccount)
    "
  >
    <div class="selected-account-view eth-account">
      {{ ethAccountData.connectedAccount }}
    </div>
    <a
      v-if="!hdxAccountData.connectedAccount"
      class="hdx-btn connect-metamask"
      href="#"
      @click.prevent="onConnectPolkadotExtClick"
      >Connect HydraDX account</a
    >

    <div
      v-if="hdxAccountData.connectedAccount"
      class="selected-account-view hydradx-account"
    >
      {{ getHydraDxFormattedAddress(hdxAccountData.connectedAccount.address) }}
    </div>

    <HdxBalanceDetails
      v-if="ethAccountData.connectedAccount.length !== 0"
      :eth-account-data="ethAccountData"
    />

    <a
      class="hdx-btn next-step"
      :class="{ disabled: !isNextStepValid }"
      href="#"
      @click.prevent="nextStepClick"
      >Next
      <span>&#10145;</span>
    </a>
  </div>
  <div
    v-show="step2State.openAccountsList && !hdxAccountData.connectedAccount"
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
          {{ getHydraDxFormattedAddress(account.address) }}
        </div>
      </div>
      <div
        v-if="step2State.allAvailableAccounts.length === 0"
        class="empty-accounts-list-notice"
      >
        You don't have existing accounts for HydraDX network in your Polkadot.js
        extension. Please, create new one or attach existing to extension.
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
import { defineComponent, reactive } from 'vue';
import { getHydraDxFormattedAddress } from '@/services/utils';
import {
  getHydraDxAccountsFromExtension,
  addPolkadotExtListener,
} from '@/services/polkadotExtension';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import XhdxBalanceDetails from '@/components/XhdxBalanceDetails.vue';
import HdxBalanceDetails from '@/components/HdxBalanceDetails.vue';

type Step2State = {
  isPDExtensionApproveWaiting: boolean;
  isPDExtensionApproved: boolean;
  selectedAccount: InjectedAccountWithMeta | null;
  allAvailableAccounts: InjectedAccountWithMeta[];
  currentExtAccountsList: InjectedAccountWithMeta[];
  openAccountsList: boolean;
};

export default defineComponent({
  name: 'WizardStep2',
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
    goToStep: {
      type: Function,
      default: () => {},
    },
    setGlobalNotice: {
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
      openAccountsList: false,
      currentExtAccountsList: [],
    } as Step2State);

    const onConnectPolkadotExtClick = async () => {
      if (!props.hdxAccountData.isPolkadotExtAvailable) return;

      const allAccounts = await getHydraDxAccountsFromExtension();

      addPolkadotExtListener(async accounts => {
        if (step2State.currentExtAccountsList.length !== accounts.length) {
          step2State.allAvailableAccounts = await getHydraDxAccountsFromExtension();
        }
        step2State.currentExtAccountsList = accounts;

        if (
          (props.hdxAccountData.connectedAccount ||
            step2State.selectedAccount) &&
          !accounts.find(extAcc => {
            return (
              (props.hdxAccountData.connectedAccount &&
                extAcc.address ===
                  props.hdxAccountData.connectedAccount.address) ||
              (step2State.selectedAccount &&
                extAcc.address === step2State.selectedAccount.address)
            );
          })
        ) {
          // TODO Text should be updated
          props.setGlobalNotice(
            true,
            'Previously selected HydraDX account is not available anymore. Please, select another one.'
          );
          props.goToStep(2);
          step2State.selectedAccount = null;
          props.onConnectHdxAccount(null);
          setTimeout(() => {
            props.setGlobalNotice(false);
          }, 5000);
        }
      });

      step2State.allAvailableAccounts = allAccounts;
      step2State.openAccountsList = true;
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
      props.onConnectHdxAccount(step2State.selectedAccount);
      step2State.openAccountsList = false;
    };

    return {
      step2State,
      onConnectPolkadotExtClick,
      selectPdAccount,
      connectPdAccount,
      getHydraDxFormattedAddress,
    };
  },
});
</script>
