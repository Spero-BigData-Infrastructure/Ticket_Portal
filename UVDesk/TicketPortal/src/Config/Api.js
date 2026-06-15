// src/config/api.js

const getApiBaseUrl = () => {
  const { hostname, port, protocol } = window.location;

  console.log("Host:", hostname, "Port:", port);

  // 🔹 Local development
  if (hostname === "localhost") {
    return "http://192.168.1.204:8558";
    
  }

  // 🔹 Local network IP
  if (hostname === "192.168.1.109") {
    return "http://192.168.1.204:8558";
  }

  // 🔹 Staging / public IP
  if (hostname === "122.176.232.35:") {
    return "http://122.176.232.35:8558";
  }
 

  // 🔹 Production domain
//   if (hostname === "hhc.hospitalguru.in") {
//     return `${protocol}//${hostname}`;
//   }

  // 🔹 Safe fallback
  return "http://192.168.1.204:8558";
};

export const API_URL = getApiBaseUrl();
