import { ApiPromise } from '@polkadot/api';

export type ClaimProcessStatus = {
  inProgress: boolean;
  completed: boolean;
  resultStatus: number;
  resultMessage?: string;
  processMessage?: string;
};

export type ApiListeners = {
  error: (e: Error) => void;
  connected: () => void;
  disconnected: () => void;
  ready: (api: ApiPromise) => void;
};
