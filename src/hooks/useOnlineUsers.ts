import { useEffect, useState } from "react";

import { SseTopics } from "@/enums";
import { SseConnectionState, getSseConnection } from "@/utils/sse";

/** 在线用户数 */
export function useOnlineUsers() {
  const [onlineUserCount, setOnlineUserCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const connection = getSseConnection();
    setIsConnected(connection.getState() === SseConnectionState.CONNECTED);

    const unsubscribeEvent = connection.on(SseTopics.ONLINE_USERS, (data) => {
      const count = Number(data);
      if (Number.isFinite(count) && count >= 0) {
        setOnlineUserCount(count);
      }
    });

    const unsubscribeState = connection.onStateChange((state) =>
      setIsConnected(state === SseConnectionState.CONNECTED)
    );

    return () => {
      unsubscribeEvent();
      unsubscribeState();
    };
  }, []);

  return { onlineUserCount, isConnected };
}
