import ethAbi from '@/services/ethAbi';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { Contract } from 'web3-eth-contract';
import { JsonRpcPayload } from 'web3-core-helpers';

import {
  fromRpcSig,
  ecrecover,
  pubToAddress,
  bufferToHex,
  toBuffer,
  keccak,
} from 'ethereumjs-util';

const contractAddress = '0x6FCb6408499a7c0f242E32D77EB51fFa1dD28a7E';
let web3Inst: Web3;
let tokenContract: Contract;

type EthAddressesScopeItem = {
  totalClaim: string;
  bought: string;
  gasRefund: string;
  refundedTxs: string[];
};

interface EthAddressesScope {
  [key: string]: EthAddressesScopeItem;
}

/**
 * "ethAddressesScope" will contain addresses scope after latest validation process,
 * what means that this scope must contain selected ETH address and can be
 * used for future manipulations.
 */
let ethAddressesScope: EthAddressesScope = {};

const fetchEthAddressesScope: (
  scopeBlockIdentifier: string | number
) => Promise<EthAddressesScope | null> = async scopeBlockIdentifier => {
  try {
    const scope = await import(
      `@/assets/ethAddresses/claims-${scopeBlockIdentifier}.json`
    );
    ethAddressesScope = scope;
    return scope.default;
  } catch (e) {
    console.log(e);
    return null;
  }
};

export const initWeb3Instance = async () => {
  web3Inst = new Web3(Web3.givenProvider);
  tokenContract = new web3Inst.eth.Contract(
    ethAbi as AbiItem[],
    contractAddress
  );
};

export const getWeb3Instance = () => web3Inst;
export const getTokenInstance = () => tokenContract;

export const getXhdxAmountByAddress: (
  address: string,
  amountName: string
) => Promise<string> = async (address, amountName) => {
  try {
    return ethAddressesScope
      ? (ethAddressesScope[address.trim().toLowerCase()][
          amountName as keyof EthAddressesScopeItem
        ] as string)
      : '0';
  } catch (e) {
    console.log(e);
    return '0';
  }
};

export const isEthAddressClaimable: (
  address: string
) => Promise<boolean> = async address => {
  if (address.indexOf('0x') !== 0) return false;
  const addressTrimmed = address.replace('0x', '');

  if (!addressTrimmed || addressTrimmed.length === 0) return false;

  const addressesScope = await fetchEthAddressesScope(addressTrimmed[0]);

  if (!addressesScope) return false;

  return !!addressesScope[address.trim().toLowerCase()];
};

export const signMessageWithMetaMask: (
  address: string,
  message: string
) => Promise<string> = async (address, message) => {
  const signPayload: JsonRpcPayload = {
    params: [message, address],
    method: 'personal_sign',
    jsonrpc: '2',
  };

  let response;

  try {
    response = await Web3.givenProvider.send(
      signPayload,
      (err: Error | null, result: any) => {
        return err || result;
      }
    );
  } catch (e) {
    console.log(e);
    response = {};
  }

  return response.result !== undefined ? response.result : '';
};

export const validateMessageSignature: (
  address: string,
  message: string,
  signature: string
) => Promise<boolean> = async (address, message, signature) => {
  try {
    let messageFormatted: Buffer | string = message;

    messageFormatted =
      '\x19Ethereum Signed Message:\n' +
      messageFormatted.length +
      messageFormatted;

    messageFormatted = keccak(toBuffer(Web3.utils.utf8ToHex(messageFormatted)));
    const { v, r, s } = fromRpcSig(signature);
    const pubKey = ecrecover(toBuffer(messageFormatted), v, r, s);
    const addrBuf = pubToAddress(pubKey);
    const addr = bufferToHex(addrBuf);

    return addr === address;
  } catch (e) {
    console.log(e);
    return false;
  }

  return false;
};
