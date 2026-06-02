import { Suspense, lazy, useState, useMemo, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import {
  CssBaseline,
  GlobalStyles,
  Box,
  Typography,
  Fade,
} from "@mui/material";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import { ColorModeContext } from "./Context/ColorModeContext";

import MainLayout from "./Component/layout/MainLayout";
import Loader from "./Component/common/Loader";

const Dashboard = lazy(() => import("./pages/Dashboard/Dashbord"));
const Report = lazy(() => import("./pages/ReportModule/report"));

function App() {
  const [mode, setMode] = useState("light");
  const [isOnline, setIsOnline] = useState(navigator.onLine);

 useEffect(() => {
   const handleOnline = () => {
     
     window.location.reload();
   };

   const handleOffline = () => {
     setIsOnline(false);
   };

   window.addEventListener("online", handleOnline);
   window.addEventListener("offline", handleOffline);

   return () => {
     window.removeEventListener("online", handleOnline);
     window.removeEventListener("offline", handleOffline);
   };
 }, []);

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () =>
        setMode((prev) => (prev === "light" ? "dark" : "light")),
    }),
    [],
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          background: { default: mode === "light" ? "#f4f7fb" : "#121212" },
        },
      }),
    [mode],
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles
          styles={{
            "@keyframes pulse": {
              "0%, 100%": { opacity: 1 },
              "50%": { opacity: 0.5 },
            },
            ".offline-overlay": {
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              backgroundColor: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(8px)",
            },
          }}
        />

        {/* --- PREMIUM CENTERED ALERT --- */}
        {!isOnline && (
          <Fade in={!isOnline}>
            <Box className="offline-overlay">
              <Box
                sx={{
                  background: mode === "light" ? "#fff" : "#1e1e1e",
                  p: 5,
                  borderRadius: "24px",
                  textAlign: "center",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
                  maxWidth: "400px",
                  mx: 2,
                  animation: "pulse 2s infinite",
                }}
              >
                <WifiOffIcon sx={{ fontSize: 60, color: "#ff4d4d", mb: 2 }} />
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                  Connection Lost
                </Typography>
                <Typography variant="body1" sx={{ color: "text.secondary" }}>
                  Please check your internet connection. We will automatically
                  restore access once you are back online.
                </Typography>
              </Box>
            </Box>
          </Fade>
        )}

        <BrowserRouter>
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route element={<MainLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/report-module" element={<Report />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
