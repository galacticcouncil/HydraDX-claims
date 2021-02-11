import BigNumber from 'bignumber.js';

export const getFormattedBalanceXhdx: (
  rawBalance: number
) => string = rawBalance => {
  const bnBalance = new BigNumber(rawBalance);
  return bnBalance.div(1000000000000).decimalPlaces(3).toString();
};
