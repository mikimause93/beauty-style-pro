import { createContext, useContext, ReactNode } from "react";
import { useRadioPlayer } from "@/hooks/useRadioPlayer";

type RadioContextType = ReturnType<typeof useRadioPlayer>;

const RadioContext = createContext<RadioContextType | null>(null);

export function RadioProvider({ children }: { children: ReactNode }) {
  const radio = useRadioPlayer();
  return <RadioContext.Provider value={radio}>{children}</RadioContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRadio(): RadioContextType {
  const ctx = useContext(RadioContext);
  if (!ctx) throw new Error("useRadio must be used within RadioProvider");
  return ctx;
}
