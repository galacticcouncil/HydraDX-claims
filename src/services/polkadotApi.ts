import { ApiPromise, WsProvider } from '@polkadot/api';
import type { ApiListeners } from '@/types';

const nodeAddress = 'wss://hydration-rpc.n.dwellir.com';

let polkadotApiInstance: ApiPromise;

export const setApiConnection = (
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
    if (polkadotApiInstance) {
      apiListeners.ready(polkadotApiInstance);
      return;
    }

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
        Fee: {
          numerator: 'u32',
          denominator: 'u32',
        },
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
