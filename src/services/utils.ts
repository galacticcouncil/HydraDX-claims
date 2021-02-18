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
  hydradx: 63,
};

export const getFormattedBalance: (
  rawBalance: number | string,
  toDecimal?: boolean
) => string = (rawBalance, toDecimal = false) => {
  const bnBalance = new BigNumber(rawBalance);

  console.log('rawBalance - ', rawBalance, toDecimal);
  console.log(
    'rawBalance.toString - ',
    bnBalance.div(1000000000000).decimalPlaces(4).toString()
  );
  if (toDecimal)
    return bnBalance.div(1000000000000).decimalPlaces(4).toString();

  return bnBalance.decimalPlaces(4).toString();
};

export const isValueZero: (rawAmount: string) => boolean = rawAmount => {
  const bnAmount = new BigNumber(rawAmount);
  return bnAmount.isZero();
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
