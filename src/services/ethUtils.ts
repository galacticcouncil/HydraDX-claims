import axios from 'axios';
import ethAbi from '@/services/ethAbi';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { Contract } from 'web3-eth-contract';
import { JsonRpcPayload, JsonRpcResponse } from 'web3-core-helpers';

import { fromRpcSig, isValidSignature } from 'ethereumjs-util';

const contractAddress = '0x6FCb6408499a7c0f242E32D77EB51fFa1dD28a7E';
let web3Inst: Web3;
let tokenContract: Contract;

interface EthAddressesScope {
  [key: string]: {
    totalClaim: string;
    bought: string;
    gasRefund: string;
    refundedTxs: string[];
  };
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
  // tokenContract = new web3Inst.eth.Contract(ethAbi as AbiItem[]).at(contractAddress);
  // await fetchEthAddressesScope();
  tokenContract = new web3Inst.eth.Contract(
    ethAbi as AbiItem[],
    contractAddress
  );
};

export const getWeb3Instance = () => web3Inst;
export const getTokenInstance = () => tokenContract;

export const getXhdxBalanceByAddress: (
  address: string
) => Promise<number> = async address => {
  try {
    return ethAddressesScope
      ? +ethAddressesScope[address.trim().toLowerCase()].bought
      : -1;
  } catch (e) {
    console.log(e);
    return -1;
  }
};
export const getOwnedHdxBalanceByAddress: (
  address: string
) => Promise<string> = async address => {
  try {
    return ethAddressesScope
      ? ethAddressesScope[address.trim().toLowerCase()].totalClaim
      : '0';
  } catch (e) {
    console.log(e);
    return '0';
  }
};

export const isEhtAddressClaimable: (
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

  //https://github.com/danfinlay/js-eth-personal-sign-examples/blob/master/index.js
  // sign example online - https://app.mycrypto.com/sign-message
  //error
  // code: 4001
  // message: "MetaMask Message Signature: User denied message signature."
  // stack: "{↵  "code": 4001,↵  "message": "M

  // success
  // id: undefined
  // jsonrpc: "2"
  // result: "0xb2bc7ba434aca4a5130e880
};

// const addressBalance = await tokenContract.methods
//   .balanceOf(address)
//   .call();
// console.log(addressBalance);
// return addressBalance;
