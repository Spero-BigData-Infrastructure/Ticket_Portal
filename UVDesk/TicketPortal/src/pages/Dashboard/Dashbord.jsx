import { useState } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import {
  InsertChart,
  PendingActions,
  TaskAlt,
  Lock,
  HeadsetMic as HeadsetMicIcon,
  SettingsSuggest as SettingsSuggestIcon,
  Storage as StorageIcon,
  Code as CodeIcon,
  Description as DescriptionIcon,
  BugReport as BugReportIcon,
  Computer as ComputerIcon,
  Security as SecurityIcon,
  Category as CategoryIcon,
  Dashboard as DashboardIcon,
  Assessment as AssessmentIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";

// 🔥 Import aapka WebSocket Hook
import { useWebSocket } from "../../hooks/useWebSocket";

// 🔥 Components Import
import StatCard from "./StatCard";
import TicketDistribution from "./TicketDistribution";
import ProjectSummaryCards from "./ProjectSummaryCards";

// =========================================
// 🔥 ANIMATION VARIANTS
// =========================================
const dashboardContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const dashboardItemVariants = {
  hidden: { y: 20, opacity: 0 }, // Animation distance thodi kam ki for tighter feel
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100, damping: 15 },
  },
};

const slideFromRightVariants = {
  hidden: { x: 30, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 120, damping: 18, delay: 0.4 },
  },
};

const MotionBox = motion(Box);

// Helper function: Dynamic Icons & Colors
const getTypeStyling = (index) => {
  const styles = [
    { icon: <HeadsetMicIcon fontSize="small" />, color: "#2962ff" },
    { icon: <SettingsSuggestIcon fontSize="small" />, color: "#7c4dff" },
    { icon: <StorageIcon fontSize="small" />, color: "#00bcd4" },
    { icon: <CodeIcon fontSize="small" />, color: "#ff9100" },
    { icon: <DescriptionIcon fontSize="small" />, color: "#00c853" },
    { icon: <BugReportIcon fontSize="small" />, color: "#ff2d78" },
    { icon: <ComputerIcon fontSize="small" />, color: "#8bc34a" },
    { icon: <SecurityIcon fontSize="small" />, color: "#ff5722" },
  ];
  return (
    styles[index % styles.length] || {
      icon: <CategoryIcon fontSize="small" />,
      color: "#9e9e9e",
    }
  );
};

function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const [dateFilter, setDateFilter] = useState("till_date");

  const activeTab = location.pathname.includes("report-module")
    ? "report"
    : "dashboard";

  const handleTabChange = (event, newValue) => {
    if (newValue !== null && newValue !== activeTab) {
      navigate(newValue === "dashboard" ? "/" : "/report-module");
    }
  };

  const { data: wsData, isConnected } = useWebSocket("/uvdesk_dashboard");

  const handleDateFilterChange = (event, newValue) => {
    if (newValue !== null) setDateFilter(newValue);
  };

  // 🔥 Data Calculations
  const totalTickets = wsData?.total_tickets?.[dateFilter] || 0;
  const activeTickets = wsData?.active_tickets?.[dateFilter] || 0;
  const resolvedTickets = wsData?.resolved_tickets?.[dateFilter] || 0;
  const closedTickets = wsData?.closed_tickets?.[dateFilter] || 0;

  const pieData = (wsData?.ticket_type_summary || [])
    .map((item) => ({ name: item.ticket_type, value: item[dateFilter] || 0 }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);

  const gridData = (wsData?.ticket_type_summary || []).map((item, index) => {
    const style = getTypeStyling(index);
    return {
      title: item.ticket_type,
      today: item.today,
      month: item.this_month,
      tillDate: item.till_date,
      icon: style.icon,
      color: style.color,
    };
  });

  return (
    <Box sx={{ width: "100%" }}>
      <MotionBox
        key="dashboard"
        variants={dashboardContainerVariants}
        initial="hidden"
        animate="visible"
      >
        {!isConnected && (
          <Typography
            variant="caption"
            color="error"
            sx={{ mb: 1, display: "block", textAlign: "right" }}
          >
            Reconnecting to real-time data...
          </Typography>
        )}

        {/* 🔥 DATE FILTER (Left) & TAB SWITCHER (Right) CONTAINER */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
            mb: 2, // ✅ Reduced from 3 to 2 (24px to 16px) for tighter top spacing
          }}
        >
          {/* 1. ANIMATED DATE FILTER */}
          <MotionBox variants={slideFromRightVariants}>
            <Box
              sx={{
                display: "flex",
                bgcolor: "background.paper",
                borderRadius: "999px",
                padding: "4px",
                boxShadow:
                  theme.palette.mode === "dark"
                    ? "0px 4px 15px rgba(0,0,0,0.4)"
                    : "0px 4px 15px rgba(124, 77, 255, 0.08)",
                border: 1,
                borderColor:
                  theme.palette.mode === "dark"
                    ? "rgba(124, 77, 255, 0.2)"
                    : "rgba(124, 77, 255, 0.1)",
                position: "relative",
              }}
            >
              {["today", "this_month", "till_date"].map((val) => {
                const isActive = dateFilter === val;
                return (
                  <Box
                    key={val}
                    onClick={() => handleDateFilterChange(null, val)}
                    sx={{
                      position: "relative",
                      px: 3,
                      py: 0.8,
                      cursor: "pointer",
                      zIndex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    {isActive && (
                      <MotionBox
                        layoutId="dateFilterBg"
                        initial={false}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 35,
                        }}
                        sx={{
                          position: "absolute",
                          inset: 0,
                          bgcolor:
                            theme.palette.mode === "dark"
                              ? "rgba(124, 77, 255, 0.25)"
                              : "rgba(124, 77, 255, 0.12)",
                          borderRadius: "999px",
                          zIndex: -1,
                        }}
                      />
                    )}
                    <Typography
                      sx={{
                        fontWeight: isActive ? 700 : 600,
                        fontSize: "13px",
                        fontFamily: "'Poppins', sans-serif",
                        transition: "all 0.3s ease",
                        color: isActive
                          ? theme.palette.mode === "dark"
                            ? "#b388ff"
                            : "#4527a0"
                          : theme.palette.mode === "dark"
                            ? "#94a3b8"
                            : "#64748b",
                      }}
                    >
                      {val === "today"
                        ? "Today"
                        : val === "this_month"
                          ? "This Month"
                          : "Till Date"}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </MotionBox>

          {/* 2. ANIMATED TAB SWITCHER */}
          <MotionBox variants={slideFromRightVariants}>
            <Box
              sx={{
                display: "flex",
                bgcolor: "background.paper",
                borderRadius: "10px",
                padding: "4px",
                border: 1,
                borderColor:
                  theme.palette.mode === "dark"
                    ? "rgba(41, 98, 255, 0.2)"
                    : "rgba(41, 98, 255, 0.1)",
                boxShadow:
                  theme.palette.mode === "dark"
                    ? "0px 4px 15px rgba(0,0,0,0.4)"
                    : "0px 4px 15px rgba(41, 98, 255, 0.08)",
                position: "relative",
              }}
            >
              {[
                {
                  id: "dashboard",
                  label: "Dashboard",
                  icon: <DashboardIcon sx={{ mr: 1, fontSize: 16 }} />,
                },
                {
                  id: "report",
                  label: "Report",
                  icon: <AssessmentIcon sx={{ mr: 1, fontSize: 16 }} />,
                },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <Box
                    key={tab.id}
                    onClick={() => handleTabChange(null, tab.id)}
                    sx={{
                      position: "relative",
                      px: 2.5,
                      py: 0.8,
                      cursor: "pointer",
                      zIndex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    {isActive && (
                      <MotionBox
                        layoutId="tabSwitcherBg"
                        initial={false}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 35,
                        }}
                        sx={{
                          position: "absolute",
                          inset: 0,
                          bgcolor: "#2962ff",
                          borderRadius: "7px",
                          boxShadow: "0 4px 12px rgba(41, 98, 255, 0.4)",
                          zIndex: -1,
                        }}
                      />
                    )}
                    <Typography
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        fontWeight: 700,
                        fontSize: "12px",
                        fontFamily: "'Poppins', sans-serif",
                        transition: "all 0.3s ease",
                        color: isActive
                          ? "#fff"
                          : theme.palette.mode === "dark"
                            ? "#94a3b8"
                            : "#64748b",
                        "&:hover": {
                          color: isActive ? "#fff" : "#2962ff",
                        },
                      }}
                    >
                      {tab.icon} {tab.label}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </MotionBox>
        </Box>

        {/* KPI CARDS */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              lg: "repeat(4, 1fr)",
            },
            gap: 2, // Cards ke beech ka gap intact rakha hai
            mb: 2, // ✅ Reduced from 3 to 2 (24px to 16px) yahan bhi
          }}
        >
          <MotionBox variants={dashboardItemVariants}>
            <StatCard
              title="Total Tickets"
              value={totalTickets}
              color="#1877F2"
              icon={<InsertChart />}
            />
          </MotionBox>
          <MotionBox variants={dashboardItemVariants}>
            <StatCard
              title="Active Tickets"
              value={activeTickets}
              color="#FF922B"
              icon={<PendingActions />}
            />
          </MotionBox>
          <MotionBox variants={dashboardItemVariants}>
            <StatCard
              title="Resolved/Testing Phase"
              value={resolvedTickets}
              color="#2EA44F"
              icon={<TaskAlt />}
            />
          </MotionBox>
          <MotionBox variants={dashboardItemVariants}>
            <StatCard
              title="Closed Tickets"
              value={closedTickets}
              color="#7952B3"
              icon={<Lock />}
            />
          </MotionBox>
        </Box>

        {/* CHARTS SECTION */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "1fr 2.2fr" },
            gap: 2, // ✅ Reduced from 3 to 2 for tighter layout
            alignItems: "stretch",
          }}
        >
          <MotionBox variants={dashboardItemVariants} sx={{ display: "flex" }}>
            <Box sx={{ width: "100%" }}>
              <TicketDistribution pieData={pieData} />
            </Box>
          </MotionBox>
          <MotionBox variants={dashboardItemVariants} sx={{ display: "flex" }}>
            <Box sx={{ width: "100%" }}>
              <ProjectSummaryCards data={gridData} dateFilter={dateFilter} />
            </Box>
          </MotionBox>
        </Box>
      </MotionBox>
    </Box>
  );
}

export default Dashboard;
