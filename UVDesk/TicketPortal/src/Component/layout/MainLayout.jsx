import { Outlet } from "react-router-dom";
import { Box, useTheme, alpha } from "@mui/material";
import Header from "./DashboardHeader";
import Footer from "./Footer";

function MainLayout() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100%",
        // Premium background jo Report card border ke sath match karega
        bgcolor: isDark ? "#0b0f19" : "#f1f5f9",
        overflow: "hidden", // Main window scroll disabled
      }}
    >
      {/* 1. HEADER: Fixed at top */}
      <Box
        component="header"
        sx={{
          flexShrink: 0,
          zIndex: 1200,
          width: "100%",
          boxShadow: isDark
            ? "0 4px 20px rgba(0,0,0,0.4)"
            : "0 4px 20px rgba(0,0,0,0.05)",
        }}
      >
        <Header />
      </Box>

      {/* 2. SCROLLABLE WRAPPER */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          overflowX: "hidden",
          width: "100%",
          display: "flex",
          flexDirection: "column",

          // 🔥 Slim & Professional Scrollbar Design
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: isDark
              ? alpha("#ffffff", 0.15)
              : alpha("#0f172a", 0.15),
            borderRadius: "10px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: isDark ? alpha("#ffffff", 0.3) : alpha("#0f172a", 0.3),
          },
        }}
      >
        {/* 3. CONTENT WRAPPER: Charo Taraf Se Perfect Alignment (4-sides) */}
        <Box
          sx={{
            flexGrow: 1,
            width: "100%",
            maxWidth: "1600px", // Ultra-wide screens par bhi center aur perfect rahega
            mx: "auto", // Horizontal center alignment
            display: "flex",
            flexDirection: "column",

            // 🔥 Exact Padding For All 4 Sides
            px: { xs: 2, sm: 3, md: 4, lg: 5 }, // Left & Right Breathing Room
            py: { xs: 2, sm: 3, md: 4 }, // Top & Bottom Breathing Room
          }}
        >
          <Outlet />
        </Box>
      </Box>

      {/* 4. FOOTER: Fixed at bottom */}
      <Box component="footer" sx={{ flexShrink: 0, width: "100%" }}>
        <Footer />
      </Box>
    </Box>
  );
}

export default MainLayout;
