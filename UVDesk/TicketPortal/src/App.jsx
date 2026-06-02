import { Suspense, lazy, useState, useMemo } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import GlobalStyles from "@mui/material/GlobalStyles"; // 🔥 1. GlobalStyles import kiya
import { ColorModeContext } from "./Context/ColorModeContext";

// Layout aur Loader
import MainLayout from "./Component/layout/MainLayout";
import Loader from "./Component/common/Loader";

// Lazy loading the pages

const Dashboard = lazy(() => import("./pages/Dashboard/Dashbord"));
const Report = lazy(() => import("./pages/ReportModule/report"));

function App() {
  // Theme state manage kar rahe hain
  const [mode, setMode] = useState("light");

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
      },
    }),
    [],
  );

  // MUI Theme create kar rahe hain based on current mode
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: mode,
          // Aap default background colors ko yahan customize kar sakte hain
          background: {
            default: mode === "light" ? "#f4f7fb" : "#121212",
            paper: mode === "light" ? "#ffffff" : "#1e1e1e",
          },
        },
      }),
    [mode],
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        {/* CssBaseline MUI ke default styles aur body background ko handle karega */}
        <CssBaseline />

        {/* 🔥 2. Ye GlobalStyles poore app me colors ko automatically animate karega */}
        <GlobalStyles
          styles={{
            "body, .MuiBox-root, .MuiPaper-root, .MuiTypography-root, .MuiTableCell-root, .MuiButtonBase-root":
              {
                transition:
                  "background-color 0.4s ease-in-out, color 0.4s ease-in-out, border-color 0.4s ease-in-out, box-shadow 0.4s ease-in-out !important",
              },
          }}
        />

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
