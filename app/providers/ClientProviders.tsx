'use client';

import { FC, ReactNode } from 'react';
import { WalletProvider } from './WalletProvider';

interface Props {
  children: ReactNode;
}

export const ClientProviders: FC<Props> = ({ children }) => {
  return (
    <WalletProvider>
      {children}
    </WalletProvider>
  );
};
