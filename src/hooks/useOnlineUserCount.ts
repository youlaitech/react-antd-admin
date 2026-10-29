import { useRealtimeStore } from "@/stores/realtime";
import { RealtimeConnectionStatus } from "@/utils/realtime/client";

/**
 * 读取当前节点的在线用户数与连接状态，首次快照前人数为 null
 */
export function useOnlineUserCount() {
  const presence = useRealtimeStore((state) => state.presence);
  const status = useRealtimeStore((state) => state.status);

  return {
    onlineUserCount: presence?.onlineUsers ?? null,
    presence,
    isConnected: status === RealtimeConnectionStatus.CONNECTED,
  };
}
