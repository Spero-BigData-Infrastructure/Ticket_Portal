// App.jsx

import React from "react";

import { Box } from "@mui/material";

import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import TicketDashboard from "./Component/DashboardModule/Dashboard";
import MainRoute from "./Component/ReportModule/MainRoute";

function App() {
  return (
    <BrowserRouter>
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
        <Routes>
          {/* DASHBOARD */}
          <Route
            path="/"
            element={<TicketDashboard />}
          />

          {/* REPORT MODULE */}
          <Route
            path="/report-module"
            element={<MainRoute />}
          />
        </Routes>
      </Box>
    </BrowserRouter>
  );
}

export default App;