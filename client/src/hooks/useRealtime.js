import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { API_BASE } from "../api/client.js";

// One shared socket for the whole app session
let _socket = null;

function getSocket() {
  if (!_socket) {
    _socket = io(API_BASE || undefined, { path: "/socket.io", autoConnect: true });
  }
  return _socket;
}

/**
 * Subscribe to socket.io events.
 *
 * @param {{ role?: string }} options
 * @param {Record<string, Function>} handlers  { 'event.name': callbackFn }
 */
export function useRealtime({ role } = {}, handlers = {}) {
  // Keep a stable ref so wrappers always call the latest handler version
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    const socket = getSocket();
    if (role) socket.emit("subscribe", { role });

    // Register one wrapper per event key so we can clean up precisely
    const eventKeys = Object.keys(handlers);
    const wrappers = eventKeys.map((event) => {
      const wrapper = (...args) => handlersRef.current[event]?.(...args);
      socket.on(event, wrapper);
      return { event, wrapper };
    });

    return () => {
      wrappers.forEach(({ event, wrapper }) => socket.off(event, wrapper));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);
}
