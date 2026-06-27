import { useEffect } from "react";
import { io } from "socket.io-client";
import { API_BASE_URL } from "./api.js";

export function useRealtime(subscription, handlers) {
  useEffect(() => {
    const socket = io(API_BASE_URL || "/", { transports: ["websocket", "polling"] });
    socket.emit("subscribe", subscription);

    for (const [event, handler] of Object.entries(handlers)) {
      socket.on(event, handler);
    }

    return () => {
      socket.disconnect();
    };
  }, [JSON.stringify(subscription), ...Object.values(handlers)]);
}
