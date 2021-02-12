import BigNumber from 'bignumber.js';
const cryptoUtil = require('@polkadot/util-crypto');

const polkadotAddressPrefixes: { [key: string]: number } = {
  polkadot: 0,
  kusama: 2,
  plasm: 5,
  bifrost: 6,
  edgeware: 7,
  karura: 8,
  reynolds: 9,
  acala: 10,
  laminar: 11,
  kulupu: 16,
  darwinia: 18,
  stafi: 20,
  robonomics: 32,
  centrifuge: 36,
  substrate: 42,
};

export const getFormattedBalanceXhdx: (
  rawBalance: number
) => string = rawBalance => {
  const bnBalance = new BigNumber(rawBalance);
  return bnBalance.div(1000000000000).decimalPlaces(3).toString();
};

export const getPolkadotFormattedAddress: (
  address: string,
  parentChain?: string
) => string = (address, parentChain = 'substrate') => {
  // let decoded = util.decodeAddress(address);

  return cryptoUtil.encodeAddress(
    address,
    polkadotAddressPrefixes[parentChain]
  );
};
