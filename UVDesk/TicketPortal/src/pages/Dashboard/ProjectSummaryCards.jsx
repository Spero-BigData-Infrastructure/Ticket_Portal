import { useEffect, useState, useRef } from "react";
import {
  Box,
  Typography,
  Stack,
  Skeleton,
  useTheme,
  LinearProgress,
  Tooltip,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { motion, AnimatePresence, animate } from "framer-motion";

// API Service
import dashboardService from "../../api/dashboardService";

// Icons
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import ConfirmationNumberOutlinedIcon from "@mui/icons-material/ConfirmationNumberOutlined";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

// Components
import AgentSummaryView from "./AgentSummaryView";

// 🔥 ANIMATED COUNTER
const AnimatedCounter = ({ from = 0, to }) => {
  const nodeRef = useRef(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (node) {
      const controls = animate(from, to, {
        duration: 1.2,
        ease: "easeOut",
        onUpdate(value) {
          node.textContent = Math.round(value);
        },
      });
      return () => controls.stop();
    }
  }, [from, to]);

  return <span ref={nodeRef} />;
};

// 🔥 FRAMER MOTION VARIANTS
const gridContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 120, damping: 14 },
  },
};

const MotionBox = motion(Box);

const ProjectSummaryCards = ({ dateFilter = "till_date" }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [loading, setLoading] = useState(true);
  const [projectData, setProjectData] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentData, setAgentData] = useState([]);
  const [projectSearch, setProjectSearch] = useState("");

  const fetchProjectSummary = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getProjectSummary();
      if (data?.status) {
        setProjectData(data?.project_wise_ticket_summary || []);
      }
    } catch (error) {
      console.log("Project Summary API Error", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgentSummary = async (projectId) => {
    try {
      setAgentLoading(true);
      const data = await dashboardService.getProjectAgentSummary(projectId);
      if (data?.status) {
        setAgentData(data?.agents || []);
      }
    } catch (error) {
      console.log("Agent Summary API Error", error);
    } finally {
      setAgentLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectSummary();
  }, []);

  const handleProjectClick = (project) => {
    const projectId = project.project_id || project.id;
    setSelectedProject(project);
    fetchAgentSummary(projectId);
  };

  const handleBack = () => {
    setSelectedProject(null);
    setAgentData([]);
  };

  // 🔥 FILTERED PROJECTS
  const filteredProjects = projectData.filter((p) =>
    (p?.project_name || "").toLowerCase().includes(projectSearch.toLowerCase()),
  );

  if (loading) {
    return (
      <Box
        sx={{
          bgcolor: "background.paper",
          borderRadius: "20px",
          border: 1,
          borderColor: "divider",
          p: { xs: 2, md: 3 },
        }}
      >
        <Skeleton variant="text" width={240} height={40} animation="wave" />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              sm: "repeat(2, minmax(0, 1fr))",
              md: "repeat(3, minmax(0, 1fr))",
              xl: "repeat(3, minmax(0, 1fr))",
            },
            gap: 3,
            mt: 3,
          }}
        >
          {[...Array(6)].map((_, index) => (
            <Skeleton
              key={index}
              variant="rounded"
              height={220}
              sx={{ borderRadius: "16px" }}
              animation="wave"
            />
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        borderRadius: "20px",
        border: 1,
        borderColor: "divider",
        p: { xs: 2, md: 3 },
        boxShadow: isDark
          ? "0 4px 24px rgba(0,0,0,0.4)"
          : "0 4px 24px rgba(15,23,42,0.04)",
      }}
    >
      <AnimatePresence mode="wait">
        {!selectedProject ? (
          <motion.div
            key="projects-view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header Section */}
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: "space-between",
                alignItems: { xs: "flex-start", sm: "center" },
                width: "100%",
                mb: 3,
                gap: 2,
              }}
            >
              <Box>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Box
                    sx={{
                      width: "5px",
                      height: "22px",
                      bgcolor: "#2962ff",
                      borderRadius: "4px",
                    }}
                  />
                  <Typography
                    sx={{
                      fontSize: { xs: "18px", sm: "20px" },
                      fontWeight: 800,
                      color: "text.primary",
                    }}
                  >
                    Project Overview
                  </Typography>
                  <Chip
                    label={`${filteredProjects.length} Active Projects`}
                    color="primary"
                    variant="filled"
                    sx={{
                      fontWeight: 700,
                      borderRadius: "8px",
                      height: "32px",
                      display: { xs: "none", sm: "flex" },
                      bgcolor: "#1976d2",
                      color: "#fff",
                    }}
                  />
                </Stack>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 2,
                  width: { xs: "100%", sm: "auto" },
                  ml: { sm: "auto" },
                }}
              >
                <TextField
                  variant="outlined"
                  size="small"
                  placeholder="Search Projects..."
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon
                          sx={{ color: "text.secondary", fontSize: 20 }}
                        />
                      </InputAdornment>
                    ),
                    endAdornment: projectSearch ? (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => setProjectSearch("")}
                          edge="end"
                          sx={{ color: "text.secondary" }}
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  }}
                  sx={{
                    minWidth: { xs: "100%", sm: "260px" },
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "10px",
                      bgcolor: isDark
                        ? alpha("#fff", 0.03)
                        : alpha("#000", 0.02),
                      "& fieldset": {
                        borderColor: isDark ? alpha("#fff", 0.1) : "divider",
                      },
                      "&:hover fieldset": {
                        borderColor: theme.palette.primary.main,
                      },
                    },
                  }}
                />
              </Box>
            </Box>

            {/* 🔥 FIXED HEIGHT GRID WITH CUSTOM SCROLLBAR */}
            <MotionBox
              variants={gridContainerVariants}
              initial="hidden"
              animate="visible"
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "minmax(0, 1fr)",
                  sm: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(3, minmax(0, 1fr))",
                  xl: "repeat(3, minmax(0, 1fr))",
                },
                gap: 2.5,
                maxHeight: "65vh", // Yahan aap height adjust kar sakte hain (e.g. 600px)
                overflowY: "auto",
                pr: 1, // Scrollbar ke liye padding right
                pb: 2, // Thodi bottom padding
                pt: 1,
                pl: 1, // Shadow cut na ho uske liye left padding
                ml: -1,
                // Custom Premium Scrollbar Design
                "&::-webkit-scrollbar": {
                  width: "6px",
                },
                "&::-webkit-scrollbar-track": {
                  background: "transparent",
                },
                "&::-webkit-scrollbar-thumb": {
                  background: isDark ? "#475569" : "#cbd5e1",
                  borderRadius: "10px",
                  "&:hover": {
                    background: isDark ? "#64748b" : "#94a3b8",
                  },
                },
              }}
            >
              {filteredProjects.length === 0 ? (
                <Typography
                  sx={{
                    color: "text.secondary",
                    py: 4,
                    gridColumn: "1 / -1",
                    textAlign: "center",
                  }}
                >
                  No projects found.
                </Typography>
              ) : (
                filteredProjects.map((item, index) => {
                  const baseColors = [
                    "#2962ff",
                    "#7c4dff",
                    "#00b0ff",
                    "#ff9100",
                    "#00c853",
                  ];
                  const mainColor = baseColors[index % baseColors.length];

                  const total = Number(item?.total_tickets?.[dateFilter] || 0);
                  const resolved = Number(item?.resolved?.[dateFilter] || 0);
                  const closed = Number(item?.closed?.[dateFilter] || 0);
                  const active = Number(
                    item?.active_tickets?.[dateFilter] || 0,
                  );

                  const completedTickets = resolved + closed;
                  const progressPercent =
                    total > 0
                      ? Math.round((completedTickets / total) * 100)
                      : 0;

                  return (
                    <motion.div key={index} variants={cardVariants}>
                      <Box
                        onClick={() => handleProjectClick(item)}
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          height: "100%",
                          minHeight: "220px",
                          bgcolor: "background.paper",
                          borderRadius: "16px",
                          border: "1px solid",
                          borderColor: isDark
                            ? alpha(mainColor, 0.2)
                            : alpha(mainColor, 0.15),
                          p: 2,
                          position: "relative",
                          overflow: "hidden",
                          cursor: "pointer",
                          boxShadow: isDark
                            ? `0 4px 16px ${alpha(mainColor, 0.05)}`
                            : `0 4px 16px ${alpha(mainColor, 0.04)}`,
                          transition: "all 0.3s ease",
                          "&:hover": {
                            transform: "translateY(-5px)",
                            borderColor: alpha(mainColor, 0.5),
                            boxShadow: isDark
                              ? `0 12px 24px ${alpha(mainColor, 0.25)}`
                              : `0 12px 24px ${alpha(mainColor, 0.15)}`,
                          },
                        }}
                      >
                        {/* Background Glow Effect */}
                        <Box
                          sx={{
                            position: "absolute",
                            top: -30,
                            right: -30,
                            width: 140,
                            height: 140,
                            borderRadius: "50%",
                            background: `radial-gradient(circle, ${alpha(mainColor, 0.12)} 0%, transparent 70%)`,
                            zIndex: 0,
                          }}
                        />

                        {/* Top-Left Icon */}
                        <Box
                          sx={{
                            position: "absolute",
                            top: 16,
                            left: 16,
                            width: 34,
                            height: 34,
                            bgcolor: alpha(mainColor, isDark ? 0.2 : 0.1),
                            borderRadius: "10px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 1,
                          }}
                        >
                          <AssessmentOutlinedIcon
                            sx={{ color: mainColor, fontSize: "18px" }}
                          />
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            zIndex: 1,
                            mt: 1,
                            mb: "auto",
                          }}
                        >
                          {/* Title & Tickets */}
                          <Box sx={{ textAlign: "center", mb: 2.5 }}>
                            <Tooltip
                              title={item?.project_name || "Default Project"}
                              placement="top"
                            >
                              <Typography
                                sx={{
                                  fontSize: "16px",
                                  fontWeight: 800,
                                  color: "text.primary",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  maxWidth: "75%",
                                  px: 1,
                                  mx: "auto",
                                }}
                              >
                                {item?.project_name || "Default Project"}
                              </Typography>
                            </Tooltip>
                            <Typography
                              sx={{
                                fontSize: "13px",
                                color: "text.secondary",
                                fontWeight: 500,
                                mt: 0.5,
                              }}
                            >
                              Total Tickets:{" "}
                              <Box
                                component="span"
                                sx={{ color: "text.primary", fontWeight: 700 }}
                              >
                                {total}
                              </Box>
                            </Typography>
                          </Box>

                          {/* Progress Bar Group */}
                          <Box sx={{ width: "100%", px: 0.5 }}>
                            <Stack
                              direction="row"
                              alignItems="center"
                              justifyContent="space-between"
                              mb={0.8}
                            >
                              <Typography
                                sx={{
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  color: "text.secondary",
                                }}
                              >
                                Completion Rate
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: "13px",
                                  fontWeight: 900,
                                  color: mainColor,
                                }}
                              >
                                <AnimatedCounter to={progressPercent} />%
                              </Typography>
                            </Stack>
                            <LinearProgress
                              variant="determinate"
                              value={progressPercent}
                              sx={{
                                height: 5,
                                borderRadius: 3,
                                bgcolor: alpha(mainColor, isDark ? 0.1 : 0.1),
                                "& .MuiLinearProgress-bar": {
                                  borderRadius: 3,
                                  backgroundColor: mainColor,
                                },
                              }}
                            />
                          </Box>
                        </Box>

                        {/* BOTTOM SECTION: 4-Column Stats */}
                        <Box sx={{ width: "100%", zIndex: 1, mt: 2 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              bgcolor: isDark ? "transparent" : "#fff",
                              borderRadius: "12px",
                              p: 1.2,
                              border: `1px solid ${isDark ? alpha("#fff", 0.1) : "#e2e8f0"}`,
                            }}
                          >
                            {[
                              {
                                label: "Total",
                                icon: (
                                  <ConfirmationNumberOutlinedIcon
                                    sx={{ fontSize: "18px" }}
                                  />
                                ),
                                value: total,
                                color: "#2962ff",
                              },
                              {
                                label: "Active",
                                icon: (
                                  <PendingActionsOutlinedIcon
                                    sx={{ fontSize: "18px" }}
                                  />
                                ),
                                value: active,
                                color: "#e65100",
                              },
                              {
                                label: "Resolved",
                                icon: (
                                  <CheckCircleOutlinedIcon
                                    sx={{ fontSize: "18px" }}
                                  />
                                ),
                                value: resolved,
                                color: "#2e7d32",
                              },
                              {
                                label: "Closed",
                                icon: (
                                  <LockOutlinedIcon sx={{ fontSize: "18px" }} />
                                ),
                                value: closed,
                                color: "#c2185b",
                              },
                            ].map((stat, i) => (
                              <Tooltip
                                key={i}
                                title={stat.label}
                                placement="top"
                                arrow
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: 0.5,
                                  }}
                                >
                                  <Box sx={{ color: "text.secondary" }}>
                                    {stat.icon}
                                  </Box>
                                  <Typography
                                    sx={{
                                      fontSize: "15px",
                                      fontWeight: 900,
                                      color: stat.color,
                                      lineHeight: 1,
                                    }}
                                  >
                                    <AnimatedCounter to={stat.value || 0} />
                                  </Typography>
                                </Box>
                              </Tooltip>
                            ))}
                          </Box>
                        </Box>
                      </Box>
                    </motion.div>
                  );
                })
              )}
            </MotionBox>
          </motion.div>
        ) : (
          <AgentSummaryView
            selectedProject={selectedProject}
            agentData={agentData}
            agentLoading={agentLoading}
            onBack={handleBack}
            dateFilter={dateFilter}
          />
        )}
      </AnimatePresence>
    </Box>
  );
};

export default ProjectSummaryCards;
