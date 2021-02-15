import { ApiPromise, WsProvider } from '@polkadot/api';
import BigNumber from "bignumber.js";

const nodeAddress = 'wss://rpc-01.snakenet.hydradx.io';
let polkadotApiInstance: ApiPromise;

const setApiConnection = (
  resolvePromise: (response: ApiPromise) => void,
  apiListeners: ApiListeners
) => {
  const wsProvider = new WsProvider(nodeAddress, false);
  const reconnectionsNumber = 20;
  let reconnectionsIndex = 0;
  let isDisconnection = false;

  /**
   * Recovering connection to WS. Will be done "reconnectionsNumber" attempts.
   * If connection is not recovered, API listener "error" will be executed.
   */
  const recoverConnection = (error: Error) => {
    if (reconnectionsIndex < reconnectionsNumber) {
      setTimeout(() => {
        wsProvider.connect();
        reconnectionsIndex++;
        console.log(`Reconnection - #${reconnectionsIndex}`);
      }, 500);
    } else {
      reconnectionsIndex = 0;
      apiListeners.error(error);
    }
  };

  /**
   * We need setup websocket listeners "on" before running connection.
   */

  wsProvider.on('error', async error => {
    recoverConnection(error);
  });

  wsProvider.on('connected', async () => {
    if (polkadotApiInstance) return polkadotApiInstance;

    await new ApiPromise({
      provider: wsProvider,
      rpc: {
        amm: {
          getSpotPrice: {
            description: 'Get spot price',
            params: [
              {
                name: 'asset1',
                type: 'AssetId',
              },
              {
                name: 'asset2',
                type: 'AssetId',
              },
              {
                name: 'amount',
                type: 'Balance',
              },
            ],
            type: 'BalanceInfo',
          },
          getSellPrice: {
            description: 'Get AMM sell price',
            params: [
              {
                name: 'asset1',
                type: 'AssetId',
              },
              {
                name: 'asset2',
                type: 'AssetId',
              },
              {
                name: 'amount',
                type: 'Balance',
              },
            ],
            type: 'BalanceInfo',
          },
          getBuyPrice: {
            description: 'Get AMM buy price',
            params: [
              {
                name: 'asset1',
                type: 'AssetId',
              },
              {
                name: 'asset2',
                type: 'AssetId',
              },
              {
                name: 'amount',
                type: 'Balance',
              },
            ],
            type: 'BalanceInfo',
          },
        },
      },
      types: {
        Amount: 'i128',
        AmountOf: 'Amount',
        Address: 'AccountId',
        LookupSource: 'AccountId',
        CurrencyId: 'AssetId',
        CurrencyIdOf: 'AssetId',
        BalanceInfo: {
          amount: 'Balance',
          assetId: 'AssetId',
        },
        IntentionID: 'Hash',
        IntentionType: {
          _enum: ['SELL', 'BUY'],
        },
        Intention: {
          who: 'AccountId',
          asset_sell: 'AssetId',
          asset_buy: 'AssetId',
          amount_sell: 'Balance',
          amount_buy: 'Balance',
          trade_limit: 'Balance',
          discount: 'bool',
          sell_or_buy: 'IntentionType',
          intention_id: 'IntentionID',
        },
        Price: 'Balance',
      },
    })
      .on('error', e => {
        if (!isDisconnection) {
          console.log('ApiPromise - error ');
          apiListeners.error(e);
        }
      })
      .on('connected', () => {
        apiListeners.connected();
        isDisconnection = false;
      })
      .on('disconnected', () => {
        /**
         * This event happens when connection has been lost and each time, when
         * connection attempt has been done with error.
         */
        if (!isDisconnection) {
          apiListeners.disconnected();
          isDisconnection = true;
          wsProvider.connect();
        }
      })
      .on('ready', apiInstance => {
        polkadotApiInstance = apiInstance;
        apiListeners.ready(apiInstance);
      })
      .isReadyOrError.then(apiResponse => {
        polkadotApiInstance = apiResponse;
        apiListeners.connected();
        resolvePromise(apiResponse);
      })
      .catch(e => {
        apiListeners.error(e);
      });
  });

  wsProvider.connect();
};

type ApiListeners = {
  error: (e: Error) => void;
  connected: () => void;
  disconnected: () => void;
  ready: (api: ApiPromise) => void;
};

export const initPolkadotApiInstance = async () => {
  const createApi = new Promise((resolve: (response: ApiPromise) => void) => {
    setApiConnection(resolve, {
      error: e => console.log(e),
      connected: () => console.log('connected'),
      disconnected: () => console.log('disconnected'),
      ready: api => console.log('ready - ', api),
    });
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

    console.log('assetIds - ', assetIds);
    console.log('multiTokenInfo - ', multiTokenInfo);
    console.log('baseTokenInfo - ', baseTokenInfo);
    console.log('baseTokenBalance.toString() - ', baseTokenBalance.toString());
    return 0;
  } catch (e) {
    console.log(e);
    return -1;
  }
};
