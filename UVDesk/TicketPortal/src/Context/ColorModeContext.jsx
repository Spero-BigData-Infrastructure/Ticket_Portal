// src/context/ColorModeContext.jsx
import { createContext } from "react";

// Ye default value hai. Agar Provider connect nahi hoga, toh ye khali function chalega
export const ColorModeContext = createContext({
  toggleColorMode: () => console.log("Context connect nahi hua!"),
});
