import { ApiPromise, WsProvider } from '@polkadot/api';
import type { ApiListeners } from '@/types';

const local =
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === 'localhost';

const nodeAddress = local
  ? 'ws://127.0.0.1:9944'
  : 'wss://rpc-01.snakenet.hydradx.io';

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
    console.log('recoverConnection');
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
    console.log("wsProvider.on('connected'");
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
        console.log('ApiPromise - error ');
        if (!isDisconnection) {
          apiListeners.error(e);
        }
      })
      .on('connected', () => {
        console.log('ApiPromise - connected ');
        apiListeners.connected();
        isDisconnection = false;
      })
      .on('disconnected', () => {
        /**
         * This event happens when connection has been lost and each time, when
         * connection attempt has been done with error.
         */
        console.log('ApiPromise - disconnected ');
        if (!isDisconnection) {
          apiListeners.disconnected();
          isDisconnection = true;
          wsProvider.connect();
        }
      })
      .on('ready', apiInstance => {
        console.log('ApiPromise - ready ');
        polkadotApiInstance = apiInstance;
        apiListeners.ready(apiInstance);
      })
      .isReadyOrError.then(apiResponse => {
        console.log('isReadyOrError - catch ');
        polkadotApiInstance = apiResponse;
        apiListeners.connected();
        resolvePromise(apiResponse);
      })
      .catch(e => {
        console.log('isReadyOrError - error ');
        apiListeners.error(e);
      });
  });

  wsProvider.connect();
};
