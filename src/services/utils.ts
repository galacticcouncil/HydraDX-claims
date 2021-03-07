import BigNumber from 'bignumber.js';
const cryptoUtil = require('@polkadot/util-crypto');

export const getFormattedBalance: (
  rawBalance: number | string,
  toDecimal?: boolean
) => string = (rawBalance, toDecimal = false) => {
  const bnBalance = new BigNumber(rawBalance);
  if (toDecimal)
    return bnBalance.div(1000000000000).decimalPlaces(6).toString();

  return bnBalance.decimalPlaces(6).toString();
};

export const isValueZero: (rawAmount: string) => boolean = rawAmount => {
  const bnAmount = new BigNumber(rawAmount);
  return bnAmount.isZero();
};

export const getHydraDxFormattedAddress: (
  address: string
) => string = address => {
  return cryptoUtil.encodeAddress(address, 63);
};
