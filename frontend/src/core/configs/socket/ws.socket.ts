import { useEffect, useRef } from "react";

import { useSocketContext } from "./ws.context";
import { WS_EVENT } from "./ws.e";

export function useSocket(
  event: WS_EVENT | string,
  handler: (payload: any) => void
) {
  const { client } = useSocketContext();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!client) return;
    const cb = (payload: any) => handlerRef.current(payload);
    client.on(event, cb);
    return () => client.off(event, cb);
  }, [client, event]);
}
