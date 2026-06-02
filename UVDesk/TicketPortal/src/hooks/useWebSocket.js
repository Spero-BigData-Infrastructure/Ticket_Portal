import { useState, useEffect, useRef } from "react";
// 🔥 Import dynamic WS_URL from your config
import { WS_URL } from "../Config/ws";

export const useWebSocket = (endpoint) => {
  const [data, setData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const ws = useRef(null);
  const reconnectTimeout = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const connect = () => {
     
      const formattedBaseUrl = WS_URL.endsWith("/")
        ? WS_URL.slice(0, -1)
        : WS_URL;
      const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

      console.log("Connecting to:", `${formattedBaseUrl}${path}`);
      ws.current = new WebSocket(`${formattedBaseUrl}${path}`);

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

      // Best practice: Add error catching so it reconnects properly on failure
      ws.current.onerror = (error) => {
        console.error("WebSocket Error:", error);
      };

      ws.current.onclose = () => {
        if (isMounted) {
          setIsConnected(false);
          // Auto-reconnect after 3 seconds
          if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
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
