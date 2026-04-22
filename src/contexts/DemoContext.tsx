import React, { useState, ReactNode } from 'react';
import { DemoContext } from '@/contexts/demo-context';

interface DemoProviderProps {
  children: ReactNode;
}

export const DemoProvider: React.FC<DemoProviderProps> = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = useState(false);

  const setDemoMode = (isDemo: boolean) => {
    setIsDemoMode(isDemo);
  };

  const exitDemo = () => {
    setIsDemoMode(false);
  };

  return (
    <DemoContext.Provider value={{ isDemoMode, setDemoMode, exitDemo }}>
      {children}
    </DemoContext.Provider>
  );
};

DemoProvider.displayName = 'DemoProvider';
