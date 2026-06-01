import { useEffect, useState, useRef } from "react";
import {
  Box,
  Typography,
  Stack,
  Avatar,
  Skeleton,
  useTheme,
  LinearProgress,
  Tooltip,
  Chip,
  Divider,
  TextField,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { motion, AnimatePresence, animate } from "framer-motion";
import axios from "axios";

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
      const response = await axios.get(
        "http://192.168.1.204:8558/api/project-summary",
      );
      if (response?.data?.status) {
        setProjectData(response?.data?.project_wise_ticket_summary || []);
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
      const response = await axios.get(
        `http://192.168.1.204:8558/api/project-agent-summary?project_id=${projectId}`,
      );
      if (response?.data?.status) {
        setAgentData(response?.data?.agents || []);
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
              xs: "1fr",
              sm: "repeat(2,1fr)",
              md: "repeat(3,1fr)",
              xl: "repeat(4,1fr)",
            },
            gap: 3,
            mt: 3,
          }}
        >
          {[...Array(8)].map((_, index) => (
            <Skeleton
              key={index}
              variant="rounded"
              height={190}
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
        minHeight: "500px",
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
            {/* 🔥 BULLETPROOF HEADER FOR EXTREME RIGHT ALIGNMENT */}
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
              {/* LEFT SIDE: Title */}
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
                    label={`${filteredProjects.length} Active`}
                    color="primary"
                    variant={isDark ? "outlined" : "filled"}
                    sx={{
                      fontWeight: 700,
                      borderRadius: "8px",
                      height: "36px",
                      display: { xs: "none", sm: "flex" },
                    }}
                  />
                </Stack>
              </Box>

              {/* RIGHT SIDE: Chip & Search Bar (Extreme Right Aligned) */}
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
                          onClick={() => setProjectSearch("")}
                          edge="end"
                          sx={{
                            color: "text.secondary",
                            "&:hover": { color: "text.primary" },
                          }}
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  }}
                  sx={{
                    minWidth: { xs: "100%", sm: "260px" },
                    transition: "all 0.3s ease",
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "10px",
                      bgcolor: isDark
                        ? alpha("#fff", 0.03)
                        : alpha("#000", 0.02),
                      transition: "all 0.3s ease",
                      paddingRight: projectSearch ? "8px" : "14px",
                      "& fieldset": {
                        borderColor: isDark ? alpha("#fff", 0.1) : "divider",
                      },
                      "&:hover": {
                        bgcolor: isDark
                          ? alpha("#fff", 0.05)
                          : alpha("#000", 0.04),
                      },
                      "&:hover fieldset": {
                        borderColor: theme.palette.primary.main,
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: theme.palette.primary.main,
                        borderWidth: "1px",
                      },
                      "&.Mui-focused": {
                        bgcolor: isDark ? alpha("#fff", 0.02) : "#fff",
                        boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.2)}`,
                      },
                    },
                  }}
                />
              </Box>
            </Box>

            <MotionBox
              variants={gridContainerVariants}
              initial="hidden"
              animate="visible"
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2,1fr)",
                  md: "repeat(3,1fr)",
                  xl: "repeat(4,1fr)",
                },
                gap: 3,
                maxHeight: "75vh",
                overflowY: "auto",
                pr: 1,
                pb: 1,
                pt: 1,
                "&::-webkit-scrollbar": { width: "6px" },
                "&::-webkit-scrollbar-thumb": {
                  background: isDark ? "#475569" : "#cbd5e1",
                  borderRadius: "10px",
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
                  const completedTickets = resolved + closed;
                  const progressPercent =
                    total > 0
                      ? Math.round((completedTickets / total) * 100)
                      : 0;

                  return (
                    <motion.div
                      key={index}
                      variants={cardVariants}
                      style={{ height: "100%" }}
                    >
                      <Box
                        onClick={() => handleProjectClick(item)}
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          height: "100%",
                          bgcolor: "background.paper",
                          borderRadius: "16px",
                          border: "1px solid",
                          borderColor: isDark
                            ? alpha(mainColor, 0.2)
                            : alpha(mainColor, 0.15),
                          p: 2.5,
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
                        <Box
                          sx={{
                            position: "absolute",
                            top: -25,
                            right: -25,
                            width: 100,
                            height: 100,
                            borderRadius: "50%",
                            background: `radial-gradient(circle, ${alpha(mainColor, 0.15)} 0%, transparent 70%)`,
                            zIndex: 0,
                          }}
                        />

                        {/* 🔥 TOP SECTION: Increased mb from 2.5 to 4 for perfect vertical gap */}
                        <Stack
                          direction="row"
                          spacing={2}
                          alignItems="flex-start"
                          mb={4}
                          sx={{ position: "relative", zIndex: 1 }}
                        >
                          <Avatar
                            sx={{
                              width: 42,
                              height: 42,
                              bgcolor: alpha(mainColor, isDark ? 0.2 : 0.1),
                              color: mainColor,
                              borderRadius: "12px",
                            }}
                          >
                            <AssessmentOutlinedIcon sx={{ fontSize: "22px" }} />
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Tooltip
                              title={item?.project_name || "Default Project"}
                              placement="top"
                              arrow
                            >
                              <Typography
                                sx={{
                                  fontSize: "16px",
                                  fontWeight: 700,
                                  color: "text.primary",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
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
                                <AnimatedCounter to={total} />
                              </Box>
                            </Typography>
                          </Box>
                        </Stack>

                        {/* PROGRESS BAR SECTION */}
                        <Box
                          sx={{
                            mb: 3,
                            flexGrow: 1,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            zIndex: 1,
                          }}
                        >
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            mb={1}
                          >
                            <Typography
                              sx={{
                                fontSize: "12px",
                                fontWeight: 600,
                                color: "text.secondary",
                              }}
                            >
                              Completion Rate
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: "14px",
                                fontWeight: 800,
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
                              height: 6,
                              borderRadius: 3,
                              bgcolor: alpha(mainColor, isDark ? 0.1 : 0.08),
                              "& .MuiLinearProgress-bar": {
                                borderRadius: 3,
                                backgroundColor: mainColor,
                              },
                            }}
                          />
                        </Box>

                        {/* BOTTOM COUNTERS ROW */}
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            bgcolor: isDark ? alpha("#fff", 0.03) : "#f8fafc",
                            borderRadius: "12px",
                            p: 1.5,
                            border: 1,
                            borderColor: isDark
                              ? alpha("#fff", 0.05)
                              : "divider",
                            mt: "auto",
                            position: "relative",
                            zIndex: 1,
                          }}
                        >
                          {[
                            {
                              label: "Open Tickets",
                              icon: (
                                <ConfirmationNumberOutlinedIcon
                                  sx={{ fontSize: "18px", mb: 0.5 }}
                                />
                              ),
                              value: item?.open?.[dateFilter],
                              color: isDark ? "#4dabf5" : "#1976d2",
                            },
                            {
                              label: "Active Tickets",
                              icon: (
                                <PendingActionsOutlinedIcon
                                  sx={{ fontSize: "18px", mb: 0.5 }}
                                />
                              ),
                              value: item?.active_tickets?.[dateFilter],
                              color: isDark ? "#ffb74d" : "#f57c00",
                            },
                            {
                              label: "Resolved Tickets",
                              icon: (
                                <CheckCircleOutlinedIcon
                                  sx={{ fontSize: "18px", mb: 0.5 }}
                                />
                              ),
                              value: item?.resolved?.[dateFilter],
                              color: isDark ? "#81c784" : "#388e3c",
                            },
                            {
                              label: "Closed Tickets",
                              icon: (
                                <LockOutlinedIcon
                                  sx={{ fontSize: "18px", mb: 0.5 }}
                                />
                              ),
                              value: item?.closed?.[dateFilter],
                              color: isDark ? "#f48fb1" : "#d81b60",
                            },
                          ].map((stat, i, arr) => (
                            <Box
                              key={i}
                              sx={{
                                display: "flex",
                                flex: 1,
                                alignItems: "center",
                              }}
                            >
                              <Tooltip title={stat.label} placement="top" arrow>
                                <Box
                                  sx={{
                                    flex: 1,
                                    textAlign: "center",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    cursor: "pointer",
                                  }}
                                >
                                  <Box
                                    sx={{
                                      color: "text.secondary",
                                      display: "flex",
                                    }}
                                  >
                                    {stat.icon}
                                  </Box>
                                  <Typography
                                    sx={{
                                      fontSize: "15px",
                                      fontWeight: 800,
                                      color: stat.color,
                                      lineHeight: 1.1,
                                    }}
                                  >
                                    <AnimatedCounter to={stat.value || 0} />
                                  </Typography>
                                </Box>
                              </Tooltip>
                              {i !== arr.length - 1 && (
                                <Divider
                                  orientation="vertical"
                                  flexItem
                                  sx={{
                                    borderColor: isDark
                                      ? alpha("#fff", 0.1)
                                      : "divider",
                                    height: "24px",
                                    alignSelf: "center",
                                  }}
                                />
                              )}
                            </Box>
                          ))}
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
