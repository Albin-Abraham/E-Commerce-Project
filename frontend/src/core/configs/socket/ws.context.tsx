import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { WSClient } from "./ws.client";
import type { WSConfig } from "./ws.model";

const SocketContext = createContext<{ client: WSClient | null } | undefined>(
  undefined
);

export const SocketProvider: React.FC<{
  config: WSConfig;
  children?: React.ReactNode;
}> = ({ config, children }) => {
  const [client, setClient] = useState<WSClient | null>(null);

  const memoConfig = useMemo(() => config, [config.url]);

  useEffect(() => {
    const c = new WSClient(memoConfig);
    c.connect();
    setClient(c);

    return () => c.close();
  }, [memoConfig]);

  const value = useMemo(() => ({ client }), [client]);

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

// hook to access the client
export function useSocketContext() {
  const ctx = useContext(SocketContext);
  if (!ctx)
    throw new Error("useSocketContext must be used within SocketProvider");
  return ctx;
}
