import React, { createContext, useContext, useMemo, useState } from 'react';

export type EntryDateContextValue = {
  date: string;
  setDate: (value: string) => void;
};

const EntryDateContext = createContext<EntryDateContextValue | undefined>(undefined);

export function EntryDateProvider({ children }: { children: React.ReactNode }) {
  const todayDate = new Date();
  const pad2 = (value: number) => value.toString().padStart(2, '0');
  const today = `${todayDate.getFullYear()}-${pad2(todayDate.getMonth() + 1)}-${pad2(
    todayDate.getDate(),
  )}`;
  const [date, setDate] = useState(today);

  const value = useMemo(() => ({ date, setDate }), [date]);

  return <EntryDateContext.Provider value={value}>{children}</EntryDateContext.Provider>;
}

export function useEntryDate(): EntryDateContextValue {
  const context = useContext(EntryDateContext);
  if (!context) {
    throw new Error('useEntryDate must be used within EntryDateProvider');
  }
  return context;
}
