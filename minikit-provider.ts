// MiniKitContext.ts
import React, { createContext, useContext, useEffect, useState } from 'react';
import { MiniKit } from './minikit'; // Adjust path as needed
import type { ReactNode } from 'react';

interface MiniKitContextType {
  isInstalled: boolean;
}

const MiniKitContext = createContext<MiniKitContextType>({ isInstalled: false });

export const useMiniKit = () => useContext(MiniKitContext);

interface MiniKitProviderProps {
  appId?: string;
  children: ReactNode;
}

export function MiniKitProvider(props: MiniKitProviderProps): React.ReactElement {
  const [isInstalled, setIsInstalled] = useState(false);

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
        localStorage.setItem("identity", JSON.stringify(identity));
        setIsInstalled(true);
      } else {
        alert('MiniKit installation failed.');
      }
    };
    installMiniKit();
  }, [props.appId]);

  return React.createElement(
    MiniKitContext.Provider,
    { value: { isInstalled } },
    props.children
  );
}
