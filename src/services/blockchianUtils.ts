import ethAbi from '@/services/ethAbi';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { Contract } from 'web3-eth-contract';

const contractAddress = '0x6FCb6408499a7c0f242E32D77EB51fFa1dD28a7E';
let web3Inst: Web3;
let tokenContract: Contract;

export const initWeb3Instance = () => {
  web3Inst = new Web3(Web3.givenProvider);
  // tokenContract = new web3Inst.eth.Contract(ethAbi as AbiItem[]).at(contractAddress);
  tokenContract = new web3Inst.eth.Contract(
    ethAbi as AbiItem[],
    contractAddress
  );
};

export const getWeb3Instance = () => web3Inst;
export const getTokenInstance = () => tokenContract;

export const getTokenBalanceByAddress: (
  address: string
) => Promise<number> = async address => {
  try {
    const addressBalance = await tokenContract.methods
      .balanceOf(address)
      .call();
    console.log(addressBalance);
    return addressBalance;
  } catch (e) {
    console.log(e);
    return -1;
  }
};


