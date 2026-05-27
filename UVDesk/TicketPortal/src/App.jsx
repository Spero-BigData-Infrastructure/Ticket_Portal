import React from "react";
import { Box } from "@mui/material";
import TicketDashboard from "./Component/Dashboard";
function App() {
  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100vw",
        minHeight: "100vh",
        overflowX: "hidden",
        boxSizing: "border-box",
        background: "#f4f7fb",
      }}
    >
      <TicketDashboard />
    </Box>
  );
}

export default App;