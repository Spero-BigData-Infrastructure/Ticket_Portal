import { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  useTheme,
  Paper,
  TextField,
  Button,
  Grid,
  Stack,
  alpha,
  Divider,
  Avatar,
  CircularProgress,
} from "@mui/material";
import {
  motion,
  AnimatePresence,
  useSpring,
  useTransform,
} from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";

import reportService from "../../api/reportService";

import {
  Dashboard as DashboardIcon,
  Assessment as AssessmentIcon,
  GridView as GridViewIcon,
} from "@mui/icons-material";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import DownloadIcon from "@mui/icons-material/Download";
import DescriptionIcon from "@mui/icons-material/Description";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import InventoryIcon from "@mui/icons-material/Inventory2Outlined";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

import AgentSummaryTable from "./AgentSummaryTable";
import TicketDetailsTable from "./TicketDetailsTable";
import MasterTicketTable from "./MasterTicketTable"; // 🔥 MASTER TABLE IMPORT
import { API_URL } from "../../Config/Api";

const MotionPaper = motion(Paper);
const MotionBox = motion(Box);

const Counter = ({ value }) => {
  const count = useSpring(0, { stiffness: 100, damping: 20 });
  useEffect(() => {
    count.set(value);
  }, [value, count]);
  const display = useTransform(count, (latest) => Math.round(latest));
  return <motion.span>{display}</motion.span>;
};

const StatCard = ({ title, value, color, icon, delay = 0 }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <MotionPaper
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 15, delay }}
      whileHover={{ scale: 1.02, y: -5 }}
      elevation={0}
      sx={{
        position: "relative",
        overflow: "hidden",
        height: "100%",
        width: "100%",
        minHeight: { xs: 90, sm: 100 },
        px: { xs: 1.5, sm: 2 },
        py: { xs: 1.5, sm: 2 },
        borderRadius: "20px",
        background: isDark
          ? `linear-gradient(135deg, ${color}25 0%, ${color}10 45%, ${theme.palette.background.paper} 100%)`
          : `linear-gradient(135deg, ${color}14 0%, ${color}08 45%, #ffffff 100%)`,
        border: `2px solid ${color}${isDark ? "30" : "18"}`,
        boxShadow: isDark
          ? "0 10px 30px rgba(0,0,0,0.2)"
          : "0 10px 30px rgba(0,0,0,0.04)",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: "-45px",
          right: "-45px",
          width: "140px",
          height: "140px",
          borderRadius: "50%",
          background: `${color}${isDark ? "20" : "10"}`,
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: -15,
          right: -10,
          opacity: isDark ? 0.1 : 0.05,
          pointerEvents: "none",
          "& > svg": { fontSize: { xs: 80, sm: 110 }, color: color },
        }}
      >
        {icon}
      </Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
          zIndex: 2,
          width: "100%",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: 1.5, sm: 2 },
            flex: 1,
            minWidth: 0,
          }}
        >
          <Avatar
            sx={{
              width: { xs: 50, sm: 55 },
              height: { xs: 50, sm: 55 },
              flexShrink: 0,
              background: `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)`,
              boxShadow: `0 12px 24px ${color}30`,
              "& > svg": { fontSize: { xs: 22, sm: 26 }, color: "#fff" },
            }}
          >
            {icon}
          </Avatar>
          <Stack spacing={0.3} sx={{ minWidth: 0 }}>
            <Typography
              fontWeight={"bold"}
              sx={{
                color: "text.secondary",
                fontSize: { xs: 11, sm: 12 },
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {title}
            </Typography>
            <Typography
              fontWeight={800}
              sx={{
                color: "text.primary",
                fontSize: { xs: 22, sm: 26, md: 28 },
                lineHeight: 1,
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              <Counter value={value} />
            </Typography>
          </Stack>
        </Box>
        <Box
          sx={{
            width: { xs: 32, sm: 36 },
            height: { xs: 32, sm: 36 },
            borderRadius: "50%",
            bgcolor: `${color}${isDark ? "25" : "15"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            "& > svg": { color: color, fontSize: { xs: 14, sm: 18 } },
          }}
        >
          {icon}
        </Box>
      </Box>
    </MotionPaper>
  );
};

const pageContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
};
const slideFromRightVariants = {
  hidden: { x: 20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 120, damping: 20 },
  },
};
const contentVariants = {
  hidden: { y: 15, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100, damping: 18 },
  },
};

function Report() {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isDark = theme.palette.mode === "dark";

  const ticketSectionRef = useRef(null);
  const masterTicketRef = useRef(null); // 🔥 Scroll ref for master table

  // --- PURANE STATES ---
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [slaFilter, setSlaFilter] = useState("all");
  const [summaryData, setSummaryData] = useState([]);
  const [overallKpi, setOverallKpi] = useState({});
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [selectedAgentName, setSelectedAgentName] = useState("");
  const [agentTickets, setAgentTickets] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // --- STATES FOR TICKETS & KPI CLICKS ---
  const [ticketDetails, setTicketDetails] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [activeStatus, setActiveStatus] = useState(null);

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

const activeTab = location.pathname.includes("report-module")
  ? "report"
  : location.pathname.includes("workload")
    ? "workload"          // ← ADD THIS
    : "dashboard";
const handleTabChange = (targetTab) => {
  if (targetTab !== activeTab) {
    if (targetTab === "dashboard") navigate("/");
    else if (targetTab === "report") navigate("/report-module");
    else if (targetTab === "workload") navigate("/workload");  // ← ADD THIS
  }
};
  // Agent table scroll
  useEffect(() => {
    if (selectedAgentId && ticketSectionRef.current) {
      const timer = setTimeout(() => {
        ticketSectionRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedAgentId]);

  const formatDate = (isoString) => {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const fetchSummaryData = async (
    start = fromDate,
    end = toDate,
    filter = slaFilter,
  ) => {
    setLoadingSummary(true);
    setSelectedAgentId(null);
    setSelectedAgentName("");
    setPage(0);
    try {
      const data = await reportService.getAgentSummary({
        from_date: start,
        to_date: end,
        sla_filter: filter,
      });
      if (data && data.status) {
        setSummaryData(data.data || []);
        setOverallKpi(data.overall || {});
      }
    } catch (error) {
      console.error("Error fetching summary:", error);
    } finally {
      setLoadingSummary(false);
    }
  };

const fetchTicketsByStatus = async (
  statusType,
  start = fromDate,
  end = toDate,
  slaFilterValue = "", 
) => {
  setLoadingTickets(true);
  setActiveStatus(statusType);

  try {
    const payload = {
      from_date: start || null,
      to_date: end || null,
      status: statusType === "total" ? null : statusType,
    };

   
    if (slaFilterValue) {
      payload.sla_filter = slaFilterValue;
    }


    const data = await reportService.getMasterTicketDetails(payload);

    if (data && data.status && data.data) {
      setTicketDetails(data.data);
    } else {
      setTicketDetails([]);
    }
  } catch (error) {
    console.error("Error fetching ticket details:", error);
    setTicketDetails([]);
  } finally {
    setLoadingTickets(false);
  }
};

  const handleSlaFilterChange = (newSla) => {
    setSlaFilter(newSla);
    fetchSummaryData(fromDate, toDate, newSla);
  };

  const handleReset = () => {
    setFromDate("");
    setToDate("");
    setSlaFilter("all");
    setSearchTerm("");
    setSelectedAgentId(null);
    setSelectedAgentName("");
    setAgentTickets([]);
    setPage(0);
    setActiveStatus(null);
    fetchSummaryData("", "", "all");
  };

  const handleFetchAllData = () => {
    fetchSummaryData();
    if (activeStatus) {
      fetchTicketsByStatus(activeStatus);
    }
  };

  const fetchAgentDetails = async (agentId, agentName) => {
    if (selectedAgentId === agentId) {
      setSelectedAgentId(null);
      return;
    }
    setSelectedAgentId(agentId);
    setSelectedAgentName(agentName);
    setLoadingDetails(true);

    try {
      const data = await reportService.getAgentDetails({
        from_date: fromDate,
        to_date: toDate,
        sla_type: slaFilter,
        agent_id: agentId,
      });
      if (data && data.data && data.data.length > 0) {
        setAgentTickets(data.data[0].tickets || []);
      } else {
        setAgentTickets([]);
      }
    } catch (error) {
      console.error("Error fetching details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const payload = {
        from_date: fromDate,
        to_date: toDate,
        sla_type: slaFilter,
      };
      if (selectedAgentName) payload.agent_name = selectedAgentName;

      const blobData = await reportService.downloadReport(payload);

      const url = window.URL.createObjectURL(new Blob([blobData]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        selectedAgentName
          ? `${selectedAgentName.replace(/\s+/g, "_")}_Report.xlsx`
          : `UVDesk_Master_Report.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error("Error downloading report:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    fetchSummaryData();
  }, []);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "open":
        return theme.palette.success.main;
      case "pending":
        return theme.palette.warning.main;
      case "answered":
        return theme.palette.secondary.main;
      case "resolved":
        return theme.palette.info.main;
      case "closed":
        return theme.palette.error.main;
      default:
        return theme.palette.primary.main;
    }
  };

  const kpiData = [
    {
      id: "total",
      title: "Total Tickets",
      count: overallKpi.total || 0,
      color: "#4F46E5",
      icon: <DescriptionIcon />,
    },
    {
      id: "active",
      title: "Active",
      count: overallKpi.active || 0,
      color: "#F59E0B",
      icon: <FolderOpenIcon />,
    },
    {
      id: "resolved",
      title: "Resolved",
      count: overallKpi.resolved || 0,
      color: "#06B6D4",
      icon: <CheckCircleOutlineIcon />,
    },
    {
      id: "closed",
      title: "Closed",
      count: overallKpi.closed || 0,
      color: "#EF4444",
      icon: <InventoryIcon />,
    },
  ];

  return (
    <Box sx={{ width: "100%" }}>
      <MotionBox
        key="report-page"
        variants={pageContainerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* HEADER SECTION */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1.5,
            mb: 2,
          }}
        >
          <MotionBox variants={slideFromRightVariants}>
            <Typography
              variant="h5"
              sx={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 800,
                letterSpacing: "-0.5px",
                color: isDark ? "#f8fafc" : "#0f172a",
              }}
            >
              UV Desk Master Reports
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: isDark ? "#94a3b8" : "#64748b",
                fontWeight: 500,
                mt: 0.2,
              }}
            >
              Analyze your ticketing data in detail
            </Typography>
          </MotionBox>
          <MotionBox variants={slideFromRightVariants}>
            <Box
              sx={{
                display: "flex",
                bgcolor: isDark ? alpha("#000", 0.3) : "#f1f5f9",
                borderRadius: "10px",
                padding: "3px",
                border: "1px solid",
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.06)"
                  : "rgba(0, 0, 0, 0.04)",
              }}
            >
              {[
                {
                  id: "dashboard",
                  label: "Dashboard",
                  icon: <DashboardIcon sx={{ mr: 0.8, fontSize: 15 }} />,
                },
                {
                  id: "report",
                  label: "Report",
                  icon: <AssessmentIcon sx={{ mr: 0.8, fontSize: 15 }} />,
                },

                {
                 id: "workload",                                          // ← ADD THIS
                 label: "Workload",
                 icon: <GridViewIcon sx={{ mr: 0.8, fontSize: 15 }} />,
                },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <Box
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    sx={{
                      position: "relative",
                      px: 2,
                      py: 0.6,
                      cursor: "pointer",
                      zIndex: 1,
                      display: "flex",
                      alignItems: "center",
                      borderRadius: "7px",
                    }}
                  >
                    {isActive && (
                      <MotionBox
                        layoutId="tabSwitcherBg"
                        sx={{
                          position: "absolute",
                          inset: 0,
                          bgcolor: theme.palette.primary.main,
                          borderRadius: "7px",
                          zIndex: -1,
                          boxShadow: `0 3px 8px ${alpha(theme.palette.primary.main, 0.35)}`,
                        }}
                      />
                    )}
                    <Typography
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        fontWeight: 700,
                        fontSize: "0.78rem",
                        color: isActive
                          ? "#fff"
                          : isDark
                            ? "#94a3b8"
                            : "#64748b",
                        transition: "color 0.2s",
                        "&:hover": {
                          color: !isActive && (isDark ? "#fff" : "#0f172a"),
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

        {/* FILTERS SECTION */}
        <MotionBox variants={contentVariants}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, md: 3 },
              mb: 2.5,
              width: "100%",
              borderRadius: "20px",
              background: isDark
                ? "linear-gradient(145deg, rgba(22,28,45,0.9) 0%, rgba(15,23,42,0.98) 100%)"
                : "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
              backdropFilter: "blur(20px)",
              border: "1px solid",
              borderColor: isDark
                ? alpha("#ffffff", 0.05)
                : alpha("#000", 0.04),
              boxShadow: isDark
                ? "0 10px 30px -10px rgba(0,0,0,0.7)"
                : "0 15px 35px -10px rgba(148,163,184,0.12)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", lg: "row" },
                alignItems: { xs: "stretch", lg: "center" },
                justifyContent: "space-between",
                gap: 2,
                mb: 3,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 1.5,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    bgcolor: isDark ? alpha("#ffffff", 0.02) : "#ffffff",
                    px: 2,
                    py: 0.5,
                    borderRadius: "12px",
                    border: "1px solid",
                    borderColor: isDark ? alpha("#ffffff", 0.06) : "#e2e8f0",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color="text.secondary"
                      sx={{ textTransform: "uppercase", fontSize: "0.7rem" }}
                    >
                      From
                    </Typography>
                    <TextField
                      type="date"
                      variant="standard"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      InputProps={{ disableUnderline: true }}
                      sx={{
                        "& input": {
                          colorScheme: isDark ? "dark" : "light",
                          fontWeight: 600,
                          fontSize: "0.85rem",
                          color: isDark ? "#f8fafc" : "#1e293b",
                          p: 0,
                        },
                      }}
                    />
                  </Box>
                  <Box
                    sx={{
                      width: "1px",
                      height: "24px",
                      bgcolor: isDark ? alpha("#fff", 0.1) : "#cbd5e1",
                      display: { xs: "none", sm: "block" },
                    }}
                  />
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color="text.secondary"
                      sx={{ textTransform: "uppercase", fontSize: "0.7rem" }}
                    >
                      To
                    </Typography>
                    <TextField
                      type="date"
                      variant="standard"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      InputProps={{ disableUnderline: true }}
                      sx={{
                        "& input": {
                          colorScheme: isDark ? "dark" : "light",
                          fontWeight: 600,
                          fontSize: "0.85rem",
                          color: isDark ? "#f8fafc" : "#1e293b",
                          p: 0,
                        },
                      }}
                    />
                  </Box>
                </Box>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 1.5,
                }}
              >
                <Button
                  variant="contained"
                  startIcon={<FilterAltIcon sx={{ fontSize: 18 }} />}
                  onClick={handleFetchAllData}
                  sx={{
                    height: "42px",
                    background:
                      "linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)",
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    borderRadius: "10px",
                    px: 2.5,
                    boxShadow: `0 4px 12px ${alpha("#3B82F6", 0.3)}`,
                    "&:hover": {
                      background:
                        "linear-gradient(135deg, #4338CA 0%, #2563EB 100%)",
                      boxShadow: `0 6px 16px ${alpha("#3B82F6", 0.45)}`,
                    },
                  }}
                >
                  Fetch Data
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RestartAltIcon sx={{ fontSize: 18 }} />}
                  onClick={handleReset}
                  sx={{
                    height: "42px",
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    borderRadius: "10px",
                    px: 2,
                    borderWidth: "1.5px",
                    borderColor: isDark ? alpha("#fff", 0.15) : "#cbd5e1",
                    color: isDark ? "#fff" : "#334155",
                    "&:hover": {
                      borderWidth: "1.5px",
                      borderColor: theme.palette.error.main,
                      bgcolor: alpha(theme.palette.error.main, 0.08),
                      color: theme.palette.error.main,
                    },
                  }}
                >
                  Reset
                </Button>

                <Button
                  variant="outlined"
                  disabled={isDownloading}
                  startIcon={
                    isDownloading ? (
                      <CircularProgress size={16} />
                    ) : (
                      <DownloadIcon sx={{ fontSize: 18 }} />
                    )
                  }
                  onClick={handleDownload}
                  sx={{
                    height: "42px",
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    borderRadius: "10px",
                    px: 2.5,
                    borderWidth: "1.5px",
                    borderColor: isDark ? alpha("#fff", 0.15) : "#cbd5e1",
                    color: isDark ? "#fff" : "#334155",
                    "&:hover": {
                      borderWidth: "1.5px",
                      borderColor: isDark ? "#fff" : "#94a3b8",
                      bgcolor: isDark ? alpha("#fff", 0.04) : "#f8fafc",
                    },
                  }}
                >
                  {isDownloading
                    ? "Exporting..."
                    : selectedAgentName
                      ? `Export ${selectedAgentName}`
                      : "Export Master"}
                </Button>
              </Box>
            </Box>
            <Divider
              sx={{
                borderStyle: "dashed",
                borderColor: isDark ? alpha("#fff", 0.1) : "#e2e8f0",
                mb: 3,
              }}
            />

            {/* KPI CARDS SECTION (Clickable) */}
            <Grid
              container
              spacing={2}
              alignItems="stretch"
              sx={{ width: "100%", m: 0 }}
            >
              {kpiData.map((kpi, idx) => {
                const isActive = activeStatus === kpi.id;

                return (
                  <Grid
                    item
                    xs={12}
                    sm={6}
                    md={3}
                    key={idx}
                    sx={{ display: "flex", p: { xs: 1, sm: 2 } }}
                  >
                    <Box
                      onClick={() => {
                        fetchTicketsByStatus(kpi.id);
                        // 🔥 YAHAN SCROLL LOGIC HAI
                        setTimeout(() => {
                          if (masterTicketRef.current) {
                            masterTicketRef.current.scrollIntoView({
                              behavior: "smooth",
                              block: "start",
                            });
                          }
                        }, 200);
                      }}
                      sx={{
                        width: "100%",
                        height: "100%",
                        cursor: "pointer",
                        transform: isActive ? "scale(1.03)" : "none",
                        transition: "all 0.2s ease-in-out",
                        boxShadow: isActive
                          ? `0 8px 25px ${kpi.color}50`
                          : "none",
                        borderRadius: "24px",
                        border: isActive
                          ? `2px solid ${kpi.color}`
                          : "2px solid transparent",
                      }}
                    >
                      <StatCard
                        title={kpi.title}
                        value={kpi.count}
                        color={kpi.color}
                        icon={kpi.icon}
                        delay={idx * 0.05}
                      />
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </Paper>
        </MotionBox>

        {/* 🔥 YAHAN SCROLL HOGA MASTER TABLE KE LIYE */}
        <div ref={masterTicketRef} style={{ scrollMarginTop: "24px" }}></div>

        {/* 🔥 MASTER TICKET TABLE COMPONENT */}
        <AnimatePresence>
          {activeStatus && (
            <Box sx={{ mb: 3 }}>
              <MasterTicketTable
                ticketDetails={ticketDetails}
                loadingTickets={loadingTickets}
                isDark={isDark}
                theme={theme}
                getStatusColor={getStatusColor}
                formatDate={formatDate}
                activeStatus={activeStatus}
                onClose={() => setActiveStatus(null)}
                onSlaFilterChange={(newSlaValue) => {
                  fetchTicketsByStatus(
                    activeStatus,
                    fromDate,
                    toDate,
                    newSlaValue,
                  );
                }}
              />
            </Box>
          )}
        </AnimatePresence>

        {/* AGENT SUMMARY TABLE */}
        <MotionBox variants={contentVariants}>
          <AgentSummaryTable
            isDark={isDark}
            loadingSummary={loadingSummary}
            summaryData={summaryData}
            page={page}
            rowsPerPage={rowsPerPage}
            handleChangePage={handleChangePage}
            handleChangeRowsPerPage={handleChangeRowsPerPage}
            selectedAgentId={selectedAgentId}
            fetchAgentDetails={fetchAgentDetails}
            getStatusColor={getStatusColor}
            slaFilter={slaFilter}
            onSlaFilterChange={handleSlaFilterChange}
            searchTerm={searchTerm}
            onSearchChange={(newVal) => {
              setSearchTerm(newVal);
              setPage(0);
            }}
          />
        </MotionBox>

        {/* YAHAN SCROLL HOGA AGENT TABLE KE LIYE */}
        <div ref={ticketSectionRef} style={{ scrollMarginTop: "16px" }} />

        {/* TICKET DETAILS TABLE (Agent Specific) */}
        <AnimatePresence>
          {selectedAgentId && (
            <Box mt={3}>
              <TicketDetailsTable
                isDark={isDark}
                theme={theme}
                selectedAgentId={selectedAgentId}
                selectedAgentName={selectedAgentName}
                loadingDetails={loadingDetails}
                agentTickets={agentTickets}
                setSelectedAgentId={setSelectedAgentId}
                getStatusColor={getStatusColor}
                formatDate={formatDate}
              />
            </Box>
          )}
        </AnimatePresence>
      </MotionBox>
    </Box>
  );
}

export default Report;
