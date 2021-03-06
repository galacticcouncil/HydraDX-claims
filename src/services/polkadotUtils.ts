import { ApiPromise, Keyring } from '@polkadot/api';
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
  //TODO text must be updated
  const nodeErrorMessages = ['Message signature is wrong', 'Nothing to claim'];

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
          events.forEach(({ phase, event: { data, method } }: EventRecord) => {
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
                processMessage: 'Almost done! Request is already in block.',
              });
            }
            if (!isCompleted && status.isFinalized && method === 'Claim') {
              isCompleted = true;
              statusCl({
                inProgress: false,
                completed: true,
                resultStatus: 0,
                processMessage: '',
              });
            }
          });
        }
      )
      .catch(e => {
        console.log('error - ', e.message);

        const errorMessage = e.message ? e.message.split('Custom error: ') : [];
        const errorResultMessage = errorMessage[1]
          ? nodeErrorMessages[+errorMessage[1].trim()]
          : '';
        if (isCompleted) return;
        isCompleted = true;
        statusCl({
          inProgress: false,
          completed: true,
          resultStatus: 1,
          resultMessage: errorResultMessage,
        });
      });
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
