import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import BigNumber from 'bignumber.js';
import { web3FromAddress } from '@polkadot/extension-dapp';

import { u8aToHex } from '@polkadot/util';

import { setApiConnection } from '@/services/polkadotApi';

import { Signer } from '@polkadot/api/types';

import type { ClaimProcessStatus, ApiListeners } from '@/types';

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
  account: string,
  statusCl: (status: ClaimProcessStatus) => void
) => Promise<void> = async (sign, account, statusCl) => {
  const signer = await getSinger(account);

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
        ({ events, status }: { events: any; status: any }) => {
          console.log('-----------------------');
          console.log('events - ', events);
          console.log('statu - ', status);
          console.log('status.toHuman - ', status.toHuman());
          console.log(
            `--- status.isInBlock - ${status.isInBlock} || status.isFinalized - ${status.isFinalized}--- `
          );

          if (status.isFinalized) {
            //@ts-ignore
            events.forEach(({ phase, event: { data, method, section } }) => {
              const [error, info] = data;
              console.log('error - ', error);
              console.log('info - ', info);
              console.log(`\t' ${phase}: ${section}.${method}:: ${data}`);

              if (method === 'ExtrinsicFailed') {
                statusCl({
                  inProgress: false,
                  completed: true,
                  resultStatus: 1,
                });
              }
              if (method === 'Claimed') {
                statusCl({
                  inProgress: false,
                  completed: true,
                  resultStatus: 0,
                });
              }
            });
          }
        }
      )
      .catch(e => {
        console.log('error - ', e);
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
