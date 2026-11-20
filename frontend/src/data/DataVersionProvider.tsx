import React, { createContext, useCallback, useContext, useState } from "react";

export interface DataVersionContextType {
  version: number;
  bump: () => void;
}

export const DataVersionContext = createContext<DataVersionContextType | undefined>(undefined);

export function DataVersionProvider({ children }: { children: React.ReactNode }) {
  const [version, setVersion] = useState(0);
  const bump = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  return (
    <DataVersionContext.Provider value={{ version, bump }}>
      {children}
    </DataVersionContext.Provider>
  );
}

export function useDataVersion(): DataVersionContextType {
  const ctx = useContext(DataVersionContext);
  if (!ctx) {
    throw new Error("useDataVersion must be used within DataVersionProvider");
  }
  return ctx;
}
