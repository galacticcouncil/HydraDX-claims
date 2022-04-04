import { ApiPromise, WsProvider } from '@polkadot/api';
import type { ApiListeners } from '@/types';

const local =
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === 'localhost';

const nodeAddress = local
  ? 'ws://127.0.0.1:9944'
  : 'wss://rpc-03.snakenet.hydradx.io';

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
