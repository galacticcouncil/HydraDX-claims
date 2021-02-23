import { ApiPromise, WsProvider } from '@polkadot/api';
import BigNumber from 'bignumber.js';
import {
  web3Enable,
  web3Accounts,
  web3FromAddress,
  isWeb3Injected,
} from '@polkadot/extension-dapp';
import type {
  InjectedAccountWithMeta,
  InjectedExtension,
} from '@polkadot/extension-inject/types';

import { setApiConnection } from '@/services/polkadotApi';

import { Signer } from '@polkadot/api/types';

// const nodeAddress = 'wss://rpc-01.snakenet.hydradx.io';
const nodeAddress = 'ws://127.0.0.1:9944';
let polkadotApiInstance: ApiPromise;

const getSinger = async (account: string): Promise<Signer> => {
  const injector = await web3FromAddress(account);
  return injector.signer;
};

type ApiListeners = {
  error: (e: Error) => void;
  connected: () => void;
  disconnected: () => void;
  ready: (api: ApiPromise) => void;
};

export const initPolkadotApiInstance = async (apiListeners: ApiListeners) => {
  const createApi = new Promise((resolve: (response: ApiPromise) => void) => {
    setApiConnection(resolve, apiListeners);
  });

  polkadotApiInstance = await createApi;
};


export const getPolkadotApiInstance = () => polkadotApiInstance;

export const getPolkadotIdentityBalanceByAddress: (
  address: string
) => Promise<number> = async address => {
  try {
    const multiTokenInfo = await polkadotApiInstance.query.tokens.accounts.entries(
      address
    );
    const baseTokenInfo = await polkadotApiInstance.query.system.account(
      address
    );

    const baseTokenBalance = new BigNumber(baseTokenInfo.data.free.toString());

    const assetIds = await polkadotApiInstance.query.assetRegistry.assetIds.entries();

    // console.log('assetIds - ', assetIds);
    // console.log('multiTokenInfo - ', multiTokenInfo);
    // console.log('baseTokenInfo - ', baseTokenInfo);
    // console.log('baseTokenBalance.toString() - ', baseTokenBalance.toString());
    //
    // // const balance = await polkadotApiInstance.query.claims.hdxclaims(address);
    // //
    // console.log('multiTokenInfo - ', multiTokenInfo);
    //
    // console.log(polkadotApiInstance);

    return 0;
  } catch (e) {
    console.log(e);
    return -1;
  }
};

export const getClaimableHdxAmountByAddress: (
  address: string
) => Promise<string | null> = async (
  address = '0x19aD3978B233a91a30f9dDda6C6F6c92bA97b8f2'
) => {
  try {
    const balance = await polkadotApiInstance.query.claims.claims(address);
    const balance2 = await polkadotApiInstance.query.system.account(
      '5DycF2czjMWhuDotXYzMJbWqP516hiLPu61UpztNR1ymGqYK'
    );

    return balance.toString();
    // return '0';
  } catch (e) {
    console.log(e);
    return null;
  }
};

export const claimBalance: (
  sign: string,
  account: string
) => Promise<void> = async (sign, account) => {
  const signer = await getSinger(account);

  try {
    const claimResponse = await polkadotApiInstance.tx.claims
      .claim(sign)
      .signAndSend(
        account,
        { signer: signer },
        ({ events, status }: { events: any; status: any }) => {
          // console.log('events - ', events);
          // console.log('statu - ', status);
          // console.log('status.toHuman - ', status.toHuman());

          if (status.isFinalized) {
            console.log(
              `Transaction included at blockHash ${status.asFinalized}`
            );

            // Loop through Vec<EventRecord> to display all events
            //@ts-ignore
            events.forEach(({ phase, event: { data, method, section } }) => {
              console.log(`\t' ${phase}: ${section}.${method}:: ${data}`);
              console.log('data - ', data);
            });

            // //@ts-ignore
            // claimResponse();
          }
        }
      )
      .catch(e => {
        console.log('error - ', e);
      });

    console.log('claimResponse - ', claimResponse);

    // return '0';
  } catch (e) {
    console.log(e);
  }
};
