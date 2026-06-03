import { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  Stack,
  Avatar,
  Skeleton,
  useTheme,
  IconButton,
  TextField,
  InputAdornment,
  Tooltip,
  Pagination,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { motion, animate } from "framer-motion";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

// Stat Icons
import ConfirmationNumberOutlinedIcon from "@mui/icons-material/ConfirmationNumberOutlined";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

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

const AgentSummaryView = ({
  selectedProject,
  agentData,
  agentLoading,
  onBack,
  dateFilter,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [agentSearch, setAgentSearch] = useState("");

  // 🔥 PAGINATION STATE (6 Cards Per Page)
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  // Search filter
  const filteredAgents = agentData.filter((a) =>
    (a?.agent_name || "").toLowerCase().includes(agentSearch.toLowerCase()),
  );

  // Search input type karne par page 1 par reset kare
  useEffect(() => {
    setPage(1);
  }, [agentSearch]);

  // 🔥 PAGINATION LOGIC
  const totalPages = Math.ceil(filteredAgents.length / ITEMS_PER_PAGE);
  const paginatedAgents = filteredAgents.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  return (
    <MotionBox
      key="agents-view"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      sx={{
        pt: 0,
        pb: 1,
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Header Area */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        mb={2}
        px={1}
        spacing={2}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <IconButton
            onClick={onBack}
            sx={{
              bgcolor: isDark ? alpha("#fff", 0.05) : alpha("#000", 0.04),
              "&:hover": {
                bgcolor: isDark ? alpha("#fff", 0.1) : alpha("#000", 0.08),
              },
            }}
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Box>
            <Typography
              sx={{
                fontSize: { xs: "18px", sm: "20px" },
                fontWeight: 800,
                color: "text.primary",
                lineHeight: 1.2,
              }}
            >
              {selectedProject?.project_name || "Project"} Agents
            </Typography>
            <Typography
              sx={{
                fontSize: "13px",
                color: "text.secondary",
                fontWeight: 500,
                mt: 0.3,
              }}
            >
              Agent-wise ticket performance for this project.
            </Typography>
          </Box>
        </Stack>

        {/* Local Search for Agents */}
        <Box width={{ xs: "100%", sm: "auto" }}>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search agents..."
            value={agentSearch}
            onChange={(e) => setAgentSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "text.secondary", fontSize: 20 }} />
                </InputAdornment>
              ),
              // 🔥 Adornment hamesha rahega, bas jab text nahi hoga toh hide ho jayega
              endAdornment: (
                <InputAdornment
                  position="end"
                  sx={{
                    display: agentSearch ? "flex" : "none", // Text hone par hi dikhega
                    mr: -0.5, // Thoda right align karne ke liye
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={() => setAgentSearch("")}
                    onMouseDown={(e) => e.preventDefault()} // Focus maintain rakhega
                    edge="end"
                    sx={{
                      color: "text.secondary",
                      "&:hover": { color: "text.primary" },
                    }}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              minWidth: { xs: "100%", sm: "280px" },
              transition: "all 0.3s ease",
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                bgcolor: isDark ? alpha("#fff", 0.04) : alpha("#000", 0.03),
                // 🔥 Yahan se paddingRight hata diya hai taaki MUI apna default space use kare aur icon na chhipe
                "& fieldset": {
                  borderColor: isDark ? alpha("#fff", 0.1) : alpha("#000", 0.1),
                },
                "&:hover": {
                  bgcolor: isDark ? alpha("#fff", 0.06) : alpha("#000", 0.05),
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
      </Stack>

      {/* Grid Content */}
      {agentLoading ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2,1fr)",
              md: "repeat(3,1fr)",
              xl: "repeat(3,1fr)", // Symmetrical for 6 cards
            },
            gap: 3,
            px: 1,
            pt: 2,
          }}
        >
          {[...Array(6)].map((_, i) => (
            <Skeleton
              key={i}
              variant="rounded"
              height={120}
              sx={{ borderRadius: "14px" }}
            />
          ))}
        </Box>
      ) : (
        <>
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
                xl: "repeat(3,1fr)",
              },
              gap: 3,
              maxHeight: "65vh",
              overflowY: "auto",
              px: 1,
              pt: 1.5,
              pb: 4,
              "&::-webkit-scrollbar": { width: "6px" },
              "&::-webkit-scrollbar-thumb": {
                background: isDark ? "#475569" : "#cbd5e1",
                borderRadius: "10px",
              },
            }}
          >
            {filteredAgents.length === 0 ? (
              <Typography
                sx={{
                  color: "text.secondary",
                  py: 4,
                  gridColumn: "1 / -1",
                  textAlign: "center",
                }}
              >
                No agents found matching your search.
              </Typography>
            ) : (
              // 🔥 Paginated Data Map
              paginatedAgents.map((agent, index) => {
                // Safeguard ticket counts: fallbacks applied to support both formats (active_tickets or calculated open+pending)
                const totalTickets = Number(
                  agent.total_tickets?.[dateFilter] || 0,
                );
                const activeTickets = Number(
                  agent.active_tickets?.[dateFilter] ||
                    Number(agent.open?.[dateFilter] || 0) +
                      Number(agent.pending?.[dateFilter] || 0),
                );
                const resolvedTickets = Number(
                  agent.resolved?.[dateFilter] || 0,
                );
                const closedTickets = Number(agent.closed?.[dateFilter] || 0);

                return (
                  <motion.div key={index} variants={cardVariants}>
                    <Box
                      sx={{
                        p: 2.5,
                        borderRadius: "16px",
                        bgcolor: isDark ? alpha("#fff", 0.02) : "#f8fafc",
                        border: "1px solid",
                        borderColor: "divider",
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        transition: "all 0.2s ease",
                        "&:hover": {
                          borderColor: theme.palette.primary.main,
                          transform: "translateY(-4px)",
                          boxShadow: isDark
                            ? `0 10px 20px ${alpha(theme.palette.primary.main, 0.15)}`
                            : `0 10px 20px ${alpha(theme.palette.primary.main, 0.1)}`,
                        },
                      }}
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar
                          sx={{
                            width: 42,
                            height: 42,
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main,
                            fontSize: "18px",
                            fontWeight: 700,
                          }}
                        >
                          {agent.agent_name ? (
                            agent.agent_name.charAt(0).toUpperCase()
                          ) : (
                            <PersonOutlineOutlinedIcon fontSize="small" />
                          )}
                        </Avatar>
                        <Box>
                          <Typography
                            sx={{
                              fontSize: "16px",
                              fontWeight: 700,
                              color: "text.primary",
                              lineHeight: 1.2,
                            }}
                          >
                            {agent.agent_name || "Unknown Agent"}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: "12px",
                              fontWeight: 600,
                              color: "text.secondary",
                              mt: 0.3,
                            }}
                          >
                            Support Agent
                          </Typography>
                        </Box>
                      </Stack>

                      {/* 🔥 FIXED: 4 Stats showing Total, Active, Resolved, and Closed */}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mt: 1,
                          pt: 2,
                          borderTop: "1px dashed",
                          borderColor: "divider",
                        }}
                      >
                        {[
                          {
                            label: "Total Tickets",
                            icon: (
                              <ConfirmationNumberOutlinedIcon
                                sx={{ fontSize: "18px", mb: 0.5 }}
                              />
                            ),
                            val: totalTickets,
                            color: isDark ? "#4dabf5" : "#1976d2",
                          },
                          {
                            label: "Active Tickets",
                            icon: (
                              <PendingActionsOutlinedIcon
                                sx={{ fontSize: "18px", mb: 0.5 }}
                              />
                            ),
                            val: activeTickets,
                            color: isDark ? "#ffb74d" : "#f57c00",
                          },
                          {
                            label: "Resolved Tickets",
                            icon: (
                              <CheckCircleOutlinedIcon
                                sx={{ fontSize: "18px", mb: 0.5 }}
                              />
                            ),
                            val: resolvedTickets,
                            color: isDark ? "#81c784" : "#388e3c",
                          },
                          {
                            label: "Closed Tickets",
                            icon: (
                              <LockOutlinedIcon
                                sx={{ fontSize: "18px", mb: 0.5 }}
                              />
                            ),
                            val: closedTickets,
                            color: isDark ? "#f48fb1" : "#d81b60",
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
                                textAlign: "center",
                                flex: 1,
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
                                <AnimatedCounter to={stat.val || 0} />
                              </Typography>
                            </Box>
                          </Tooltip>
                        ))}
                      </Box>
                    </Box>
                  </motion.div>
                );
              })
            )}
          </MotionBox>

          {/* 🔥 PREMIUM PAGINATION COMPONENT */}
          {totalPages > 1 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mt: 2,
                pt: 2,
                borderTop: `1px dashed ${isDark ? alpha("#fff", 0.1) : alpha("#000", 0.1)}`,
              }}
            >
              <Pagination
                count={totalPages}
                page={page}
                onChange={(event, value) => setPage(value)}
                shape="rounded"
                variant="outlined"
                size="large"
                sx={{
                  "& .MuiPaginationItem-root": {
                    fontWeight: 700,
                    fontSize: "14px",
                    borderColor: isDark
                      ? alpha("#fff", 0.1)
                      : alpha("#000", 0.15),
                    color: "text.primary",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      bgcolor: isDark
                        ? alpha("#2962ff", 0.2)
                        : alpha("#2962ff", 0.1),
                      borderColor: "#2962ff",
                      color: isDark ? "#82b1ff" : "#2962ff",
                    },
                  },
                  "& .Mui-selected": {
                    bgcolor: "#2962ff !important",
                    color: "#fff !important",
                    borderColor: "#2962ff !important",
                    boxShadow: "0 4px 12px rgba(41, 98, 255, 0.4)",
                  },
                }}
              />
            </Box>
          )}
        </>
      )}
    </MotionBox>
  );
};

export default AgentSummaryView;
