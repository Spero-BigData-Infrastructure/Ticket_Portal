// src/config/ws.js

const getWsBaseUrl = () => {
  const { hostname, port, protocol } = window.location;

  console.log("Host:", hostname, "Port:", port);

  // 🔹 Local development
  if (hostname === "localhost") {
    return "ws://192.168.1.204:8558/ws";
  }

  // 🔹 Local network IP
  if (hostname === "192.168.1.109" || hostname === "192.168.1.204") {
    return "ws://192.168.1.204:8558/ws";
  }

  // 🔹 Staging / public IP
  if (hostname === "122.176.232.35" && port === "8558") {
    return "ws://122.176.232.35:8558/ws";
  }

  // 🔹 Production domain
  if (hostname === "hhc.hospitalguru.in") {
    // 🔥 FIX: Convert http/https to ws/wss automatically
    const wsProtocol = protocol === "https:" ? "wss:" : "ws:";
    return `${wsProtocol}//${hostname}/ws`;
  }

  // 🔹 Safe fallback
  return "ws://192.168.1.204:8558/ws";
};

export const WS_URL = getWsBaseUrl();
