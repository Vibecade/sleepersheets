import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DemoContextType {
  isDemoMode: boolean;
  setDemoMode: (isDemo: boolean) => void;
  exitDemo: () => void;
}

const DemoContext = createContext<DemoContextType | null>(null);

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

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
};