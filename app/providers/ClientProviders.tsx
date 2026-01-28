'use client';

import { FC, ReactNode } from 'react';
import { WalletProvider } from './WalletProvider';
import { AuthProvider } from './AuthProvider';

interface Props {
  children: ReactNode;
}

export const ClientProviders: FC<Props> = ({ children }) => {
  return (
    <AuthProvider>
      <WalletProvider>
        {children}
      </WalletProvider>
    </AuthProvider>
  );
};
