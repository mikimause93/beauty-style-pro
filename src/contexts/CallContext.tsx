import { createContext, useContext, ReactNode } from "react";
import { useWebRTCCall } from "@/hooks/useWebRTCCall";

type CallApi = ReturnType<typeof useWebRTCCall>;

const CallContext = createContext<CallApi | null>(null);

export function CallProvider({ children }: { children: ReactNode }) {
  const api = useWebRTCCall();
  return <CallContext.Provider value={api}>{children}</CallContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCall must be used within CallProvider");
  return ctx;
}
