'use client';
import { createContext, useContext, useState, useCallback } from 'react';

const PageTitleContext = createContext<{
  title: string | null;
  setTitle: (t: string | null) => void;
}>({ title: null, setTitle: () => {} });

export function PageTitleProvider({ children }: { children: React.ReactNode }) {
  const [title, setTitleState] = useState<string | null>(null);
  const setTitle = useCallback((t: string | null) => setTitleState(t), []);
  return (
    <PageTitleContext.Provider value={{ title, setTitle }}>
      {children}
    </PageTitleContext.Provider>
  );
}

export function usePageTitle() {
  return useContext(PageTitleContext);
}
