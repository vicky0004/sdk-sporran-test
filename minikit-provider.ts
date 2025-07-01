// MiniKitContext.ts
import React, { createContext, useContext, useEffect, useState } from 'react';
import { MiniKit } from './minikit'; // Adjust path as needed
import type { ReactNode } from 'react';

interface MiniKitContextType {
  isInstalled: boolean;
  identity: {
    did?: string;
    web3Name?: string;
    address?: string;
    email?: string;
    name?: string;
  };
}

const MiniKitContext = createContext<MiniKitContextType>({ isInstalled: false , identity: {} });

export const useMiniKit = () => useContext(MiniKitContext);

interface MiniKitProviderProps {
  appId?: string;
  children: ReactNode;
}

export function MiniKitProvider(props: MiniKitProviderProps): React.ReactElement {
  const [isInstalled, setIsInstalled] = useState(false);
  const [identity, setIdentity ]  = useState({});

  useEffect(() => {
    const installMiniKit = async () => {
      const result = await MiniKit.install(props.appId ?? 'unknown-app-id');
      if (result.success) {
        const { did, web3Name,email, name } = result.initResult || {};
        const identity = {
          did: did || '',
          web3Name: web3Name || '',
          address: did || '',
          email: email || '',
          name: name || '',
        };
        setIdentity(identity);
        setIsInstalled(true);
      } else {
        console.log('MiniKit installation failed.');
      }
    };
    installMiniKit();
  }, [props.appId]);

  return React.createElement(
    MiniKitContext.Provider,
    { value: { isInstalled, identity } },
    props.children
  );
}
