import {
  InjectedAccountWithMeta,
  InjectedExtension,
  InjectedMetadataKnown,
  MetadataDef,
} from '@polkadot/extension-inject/types';
import { web3Accounts, web3Enable } from '@polkadot/extension-dapp';
import { ApiPromise } from '@polkadot/api';
import { reactive, unref } from 'vue';
import { getPolkadotApiInstance } from '@/services/polkadotUtils';
import { getSpecTypes } from '@polkadot/types-known';

interface ExtensionKnown {
  extension: InjectedExtension;
  known: InjectedMetadataKnown[];
  update: (def: MetadataDef) => Promise<boolean>;
}

interface ExtensionInfo extends ExtensionKnown {
  current: InjectedMetadataKnown | null;
}

interface Extensions {
  count: number;
  extensions: ExtensionInfo[];
}

interface ExtensionProperties {
  extensionVersion: string;
  tokenDecimals: number;
  tokenSymbol: string;
  ss58Format?: number;
}

interface SavedProperties {
  [name: string]: ExtensionProperties;
}

const extStore = reactive({
  extensions: [] as ExtensionKnown[],
  properties: {} as SavedProperties,
  genesisHash: '' as string,
});

// save the properties for a specific extension
function saveProperties(
  api: ApiPromise,
  { name, version }: InjectedExtension
): void {
  const propKey = api.genesisHash.toHex();
  const allProperties = extStore.properties[propKey] || ({} as SavedProperties);

  //@ts-ignore
  allProperties[name] = {
    extensionVersion: version,
    ss58Format: api.registry.chainSS58,
    tokenDecimals: api.registry.chainDecimals[0],
    tokenSymbol: api.registry.chainTokens[0],
  };

  extStore.properties[propKey] = allProperties;
}

// determines if the extension has current properties
function hasCurrentProperties(
  api: ApiPromise,
  { extension }: ExtensionKnown
): boolean {
  const allProperties =
    extStore.properties[api.genesisHash.toHex()] || ({} as SavedProperties);

  // when we don't have properties yet, assume nothing has changed and store
  //@ts-ignore
  if (!allProperties[extension.name]) {
    saveProperties(api, extension);
    return true;
  }

  //@ts-ignore
  const { ss58Format, tokenDecimals, tokenSymbol } = allProperties[
    extension.name
  ];

  return (
    ss58Format === api.registry.chainSS58 &&
    tokenDecimals === api.registry.chainDecimals[0] &&
    tokenSymbol === api.registry.chainTokens[0]
  );
}

// filter extensions based on the properties we have available
const filterAll: (
  api: ApiPromise,
  all: ExtensionKnown[]
) => Promise<Extensions> = async (api, all) => {
  const extensions = all
    .map((info): ExtensionInfo | null => {
      const current =
        info.known.find(({ genesisHash }) => api.genesisHash.eq(genesisHash)) ||
        null;

      // if we cannot find it as known, or either the specVersion or properties mismatches, mark it as upgradable
      return !current ||
        api.runtimeVersion.specVersion.gtn(current.specVersion) ||
        !hasCurrentProperties(api, info)
        ? { ...info, current }
        : null;
    })
    .filter((info): info is ExtensionInfo => !!info);

  return {
    count: extensions.length,
    extensions,
  };
};

async function getExtensionInfo(
  api: ApiPromise,
  extension: InjectedExtension
): Promise<ExtensionKnown | null> {
  if (!extension.metadata) {
    return null;
  }

  try {
    const metadata = extension.metadata;
    const known = await metadata.get();

    return {
      extension,
      known,
      update: async (def: MetadataDef): Promise<boolean> => {
        let isOk = false;

        try {
          isOk = await metadata.provide(def);

          if (isOk) {
            saveProperties(api, extension);
          }
        } catch (error) {
          // ignore
        }

        return isOk;
      },
    };
  } catch (error) {
    return null;
  }
}

async function getKnown(
  api: ApiPromise,
  extensions: InjectedExtension[]
): Promise<ExtensionKnown[]> {
  const all = await Promise.all(
    extensions.map(extension => getExtensionInfo(api, extension))
  );

  return all.filter((info): info is ExtensionKnown => !!info);
}

export const initPolkadotExtension: (
  successCb: (injectedExt: ExtensionKnown | null) => void,
  errorCb: (e: Error) => void
) => Promise<ExtensionKnown | null> = async (successCb, errorCb) => {
  let injectedExt: InjectedExtension[] = [];
  const api = getPolkadotApiInstance();

  try {
    injectedExt = await web3Enable('CLAIM.HYDRA.DX');

    if (!injectedExt || injectedExt.length === 0) {
      throw Error('no_extension');
    }

    extStore.extensions = await getKnown(api, injectedExt);
    extStore.genesisHash = api.genesisHash.toHex();
    const filteredExts: Extensions = await filterAll(api, extStore.extensions);
    const systemChain = await api.rpc.system.chain();

    // Check if user should update metadata : if current metadata of extension is empty
    // or check spec version in extension and api by genesisHash (api.genesisHash.toHex(),)

    if (filteredExts.count > 0) {
      const chainInfo = {
        chain: systemChain.toString(),
        color: '#0044ff', // TODO must be changed
        genesisHash: extStore.genesisHash,
        icon: 'substrate',
        metaCalls: Buffer.from(
          api.runtimeMetadata.asCallsOnly.toU8a()
        ).toString('base64'),
        specVersion: api.runtimeVersion.specVersion.toNumber(),
        ss58Format: api.registry.chainSS58,
        tokenDecimals: api.registry.chainDecimals[0],
        tokenSymbol: api.registry.chainTokens[0],
        types: getSpecTypes(
          api.registry,
          systemChain.toString(),
          api.runtimeVersion.specName,
          api.runtimeVersion.specVersion
        ),
      };

      console.log('testInfo ---- ', chainInfo);

      try {
        //@ts-ignore
        await filteredExts.extensions[0].update(chainInfo);
      } catch (e) {
        console.log(e);
      }
    }

    successCb(extStore.extensions[0]);
    return extStore.extensions[0];
  } catch (e) {
    errorCb(e);
    return null;
  }
};

export const getHydraDxAccountsFromExtension: () => Promise<
  InjectedAccountWithMeta[]
> = async () => {
  if (!extStore.extensions[0]) return [];

  const allAccounts: InjectedAccountWithMeta[] = await web3Accounts();

  return allAccounts.filter(account => {
    return (
      account.meta.genesisHash &&
      extStore.genesisHash === account.meta.genesisHash
    );
  });
};
