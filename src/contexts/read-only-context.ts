import { createContext, useContext } from 'react';

export interface ReadOnlyContextValue {
  readOnly: boolean;
  reason?: string;
}

export const ReadOnlyContext = createContext<ReadOnlyContextValue>({ readOnly: false });

export const useReadOnly = (): ReadOnlyContextValue => useContext(ReadOnlyContext);
