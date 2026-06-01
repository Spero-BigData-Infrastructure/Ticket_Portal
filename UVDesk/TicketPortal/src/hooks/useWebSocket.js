import { useState, useEffect, useRef } from "react";

export const useWebSocket = (endpoint) => {
  const [data, setData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const ws = useRef(null);
  const reconnectTimeout = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const connect = () => {
      // 🔥 Hardcoded fallback added for safety
      const baseUrl =
        import.meta.env.VITE_WS_BASE_URL || "ws://192.168.1.204:8558/ws";
      const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

      console.log("Connecting to:", `${baseUrl}${path}`);
      ws.current = new WebSocket(`${baseUrl}${path}`);

      ws.current.onopen = () => {
        if (isMounted) setIsConnected(true);
      };

      ws.current.onmessage = (event) => {
        if (!isMounted) return;
        try {
          setData(JSON.parse(event.data));
        } catch (err) {
          console.error("Parse Error:", err);
        }
      };

      ws.current.onclose = () => {
        if (isMounted) {
          setIsConnected(false);
          reconnectTimeout.current = setTimeout(connect, 3000);
        }
      };
    };

    connect();
    return () => {
      isMounted = false;
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (ws.current) ws.current.close();
    };
  }, [endpoint]);

  return { data, isConnected };
};
