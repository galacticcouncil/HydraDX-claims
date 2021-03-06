import { ApiPromise, Keyring } from '@polkadot/api';
import BigNumber from 'bignumber.js';
import { web3FromAddress } from '@polkadot/extension-dapp';
import { u8aToHex } from '@polkadot/util';
import { Signer } from '@polkadot/api/types';
import type { EventRecord } from '@polkadot/types/interfaces';
import type { ISubmittableResult } from '@polkadot/types/types';

import type { ClaimProcessStatus, ApiListeners } from '@/types';
import { setApiConnection } from '@/services/polkadotApi';

const keyring = new Keyring();

let polkadotApiInstance: ApiPromise;

const getSinger = async (account: string): Promise<Signer> => {
  const injector = await web3FromAddress(account);
  return injector.signer;
};

export const initPolkadotApiInstance = async (apiListeners: ApiListeners) => {
  const createApi = new Promise((resolve: (response: ApiPromise) => void) => {
    setApiConnection(resolve, apiListeners);
  });

  polkadotApiInstance = await createApi;
};

export const getPolkadotApiInstance = () => polkadotApiInstance;

export const getClaimableHdxAmountByAddress: (
  address: string
) => Promise<string> = async (address = '') => {
  try {
    const balance = await polkadotApiInstance.query.claims.claims(address);
    return balance.toString();
  } catch (e) {
    console.log(e);
    return '0';
  }
};

export const claimBalance: (
  sign: string,
  account: string,
  statusCl: (status: ClaimProcessStatus) => void
) => Promise<void> = async (sign, account, statusCl) => {
  const signer = await getSinger(account);
  let isCompleted = false;

  try {
    statusCl({
      inProgress: true,
      completed: false,
      resultStatus: 0,
    });
    const claimResponse = await polkadotApiInstance.tx.claims
      .claim(sign)
      .signAndSend(
        account,
        { signer: signer },
        ({ events, status }: ISubmittableResult) => {
          console.log('-----------------------');
          console.log('events - ', events);
          console.log('statu - ', status);
          console.log('status.toHuman - ', status.toHuman());
          console.log(
            `--- status.isInBlock - ${status.isInBlock} || status.isFinalized - ${status.isFinalized}--- `
          );

          events.forEach(
            ({ phase, event: { data, method, section } }: EventRecord) => {
              const [error, info] = data;
              console.log('error - ', error);
              console.log('info - ', info);
              console.log(`\t' ${phase}: ${section}.${method}:: ${data}`);

              if (!isCompleted && method === 'ExtrinsicFailed') {
                isCompleted = true;
                statusCl({
                  inProgress: false,
                  completed: true,
                  resultStatus: 1,
                });
              }
              if (!isCompleted && status.isInBlock && method === 'Claim') {
                statusCl({
                  inProgress: true,
                  completed: false,
                  resultStatus: 0,
                  resultMessage: 'Almost done! Request is already in block.',
                });
              }
              if (!isCompleted && status.isFinalized && method === 'Claim') {
                isCompleted = true;
                statusCl({
                  inProgress: false,
                  completed: true,
                  resultStatus: 0,
                  resultMessage: '',
                });
              }
            }
          );
        }
      )
      .catch(e => {
        console.log('error - ', e);
        if (isCompleted) return;
        isCompleted = true;
        statusCl({
          inProgress: false,
          completed: true,
          resultStatus: 1,
        });
      });

    console.log('claimResponse - ', claimResponse);

    // return '0';
  } catch (e) {
    console.log(e);
    if (isCompleted) return;
    statusCl({
      inProgress: false,
      completed: true,
      resultStatus: 1,
    });
  }
};

export const accountToHex: (address: string) => string = address => {
  return u8aToHex(keyring.decodeAddress(address));
};

// TODO should be removed as legacy functions

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

    console.log('assetIds - ', assetIds);
    console.log('multiTokenInfo - ', multiTokenInfo);
    // console.log('baseTokenInfo - ', baseTokenInfo);
    console.log('baseTokenBalance.toString() - ', baseTokenBalance.toString());

    return 0;
  } catch (e) {
    console.log(e);
    return -1;
  }
};
