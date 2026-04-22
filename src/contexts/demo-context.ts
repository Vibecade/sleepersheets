import { createContext, useContext } from 'react';

export interface DemoContextType {
  isDemoMode: boolean;
  setDemoMode: (isDemo: boolean) => void;
  exitDemo: () => void;
}

export const DemoContext = createContext<DemoContextType | null>(null);

export const useDemo = () => {
  const context = useContext(DemoContext);

  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider');
  }

  return context;
};
