import React, { useState, useEffect } from "react";
import {
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  IconButton,
  Tooltip,
  Chip,
  Stack,
  alpha,
  TablePagination,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  Avatar,
  Box,
  Backdrop,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import {
  ReceiptLongOutlined as ReceiptIcon,
  Close as CloseIcon,
  QuestionAnswerOutlined as ChatIcon,
  AccountCircleOutlined as PersonIcon,
} from "@mui/icons-material";

// 🔥 Import API Service
import reportService from "../../api/reportService";

const MotionPaper = motion(Paper);

const detailCardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 },
  },
  exit: { opacity: 0, y: 15, transition: { duration: 0.2 } },
};

// 🔥 Chat Stagger Animation Variants
const chatContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15, // Ek ke baad ek bubble aayega
    },
  },
};

const chatBubbleVariants = {
  hidden: { opacity: 0, x: -30, scale: 0.95 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 250, damping: 20 },
  },
};

// Helper function: HTML decode karne ke liye
const decodeHTML = (htmlStr) => {
  if (!htmlStr) return "";
  const txt = document.createElement("textarea");
  txt.innerHTML = htmlStr;
  return txt.value;
};

export default function TicketDetailsTable({
  isDark,
  theme,
  selectedAgentId,
  selectedAgentName,
  loadingDetails,
  agentTickets,
  setSelectedAgentId,
  getStatusColor,
  formatDate,
}) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [statusFilter, setStatusFilter] = useState("All");

  // Chat Modal States
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [activeTicketForChat, setActiveTicketForChat] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);

  useEffect(() => {
    setPage(0);
    setStatusFilter("All");
  }, [selectedAgentId]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredTickets = (agentTickets || []).filter((ticket) => {
    if (statusFilter === "All") return true;
    return ticket.status?.toLowerCase() === statusFilter.toLowerCase();
  });

  const handleTicketClick = async (ticket) => {
    let actualTicketId = ticket.ticket_id || ticket.id;

    if (!actualTicketId) {
      console.error("Ticket ID missing!");
      return;
    }

    actualTicketId = String(actualTicketId).replace("#", "");

    setActiveTicketForChat(ticket);
    setChatDialogOpen(true);
    setLoadingChat(true);

    try {
      const result = await reportService.getTicketChat(actualTicketId);
      if (result && result.success && result.chat) {
        setChatHistory(result.chat);
      } else {
        setChatHistory([]);
      }
    } catch (error) {
      console.error("Error fetching chat:", error);
      setChatHistory([]);
    } finally {
      setLoadingChat(false);
    }
  };

  const closeChatDialog = () => {
    setChatDialogOpen(false);
    setTimeout(() => {
      setActiveTicketForChat(null);
      setChatHistory([]);
    }, 300); // Wait for exit animation to finish
  };

  if (!selectedAgentId) return null;

  return (
    <>
      <MotionPaper
        variants={detailCardVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        elevation={0}
        sx={{
          p: 3,
          borderRadius: "16px",
          bgcolor: isDark ? "#111827" : "#fff",
          border: 2,
          borderColor: "#2962ff",
          mb: 4,
          boxShadow: isDark
            ? "0px 8px 30px rgba(41, 98, 255, 0.1)"
            : "0px 12px 40px rgba(41, 98, 255, 0.15)",
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Typography
            variant="subtitle1"
            fontWeight="700"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              color: isDark ? "#fff" : "#1e293b",
            }}
          >
            <ReceiptIcon sx={{ color: "#2962ff" }} />
            Tickets assigned to:{" "}
            <span style={{ color: "#2962ff", marginLeft: "4px" }}>
              {selectedAgentName}
            </span>
          </Typography>
          <IconButton
            size="small"
            onClick={() => setSelectedAgentId(null)}
            sx={{ bgcolor: isDark ? alpha("#fff", 0.05) : alpha("#000", 0.04) }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        <TableContainer
          sx={{
            border: 1,
            borderColor: isDark ? "#334155" : "#e2e8f0",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                {[
                  "Ticket ID",
                  "Issue",
                  "Project",
                  "Type",
                  "Created",
                  "Status",
                  "Updated",
                  "SLA Hrs",
                ].map((head) => (
                  <TableCell
                    key={head}
                    sx={{
                      bgcolor: isDark ? "#1e293b" : "#f8fafc",
                      color: isDark ? "#94a3b8" : "#64748b",
                      fontWeight: 600,
                      borderBottom: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                      whiteSpace: "nowrap",
                      padding: "8px 10px",
                    }}
                  >
                    {head === "Status" ? (
                      <Select
                        value={statusFilter}
                        onChange={(e) => {
                          setStatusFilter(e.target.value);
                          setPage(0);
                        }}
                        size="small"
                        variant="standard"
                        disableUnderline
                        sx={{
                          color: "inherit",
                          fontWeight: 600,
                          fontSize: "0.875rem",
                          "& .MuiSelect-icon": { color: "inherit" },
                        }}
                      >
                        <MenuItem value="All">Status (All)</MenuItem>
                        <MenuItem value="Open">Open</MenuItem>
                        <MenuItem value="Pending">Pending</MenuItem>
                        <MenuItem value="Resolved">Resolved</MenuItem>
                        <MenuItem value="Closed">Closed</MenuItem>
                      </Select>
                    ) : (
                      head
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loadingDetails ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} sx={{ color: "#2962ff" }} />
                  </TableCell>
                </TableRow>
              ) : filteredTickets.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    align="center"
                    sx={{ py: 5, color: "text.secondary", fontWeight: 500 }}
                  >
                    {statusFilter !== "All"
                      ? `No ${statusFilter} tickets found for this agent.`
                      : "No tickets found for this agent."}
                  </TableCell>
                </TableRow>
              ) : (
                [...filteredTickets]
                  .reverse()
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((ticket, idx) => (
                    <TableRow
                      key={idx}
                      onClick={() => handleTicketClick(ticket)}
                      sx={{
                        cursor: "pointer",
                        "&:hover": {
                          bgcolor: isDark
                            ? "rgba(255,255,255,0.04)"
                            : "#f1f5f9",
                        },
                        "& td": {
                          borderBottom: `1px solid ${isDark ? "#1e293b" : "#f1f5f9"}`,
                          padding: "6px 10px",
                        },
                        "&:last-child td": { borderBottom: "none" },
                      }}
                    >
                      <TableCell
                        sx={{ fontWeight: 700, color: "text.primary" }}
                      >
                        {ticket.ticket_id || ticket.id}
                      </TableCell>

                      <TableCell
                        sx={{
                          maxWidth: 250,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          color: "text.secondary",
                        }}
                      >
                        <Tooltip
                          title={ticket.issue || ""}
                          placement="top-start"
                        >
                          <span
                            style={{
                              display: "block",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {ticket.issue}
                          </span>
                        </Tooltip>
                      </TableCell>

                      <TableCell sx={{ color: "text.primary" }}>
                        {ticket.project || "-"}
                      </TableCell>

                      <TableCell sx={{ color: "text.primary" }}>
                        {ticket.type || "-"}
                      </TableCell>

                      <TableCell sx={{ color: "text.primary" }}>
                        {formatDate(ticket.added_date)}
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={ticket.status}
                          size="small"
                          sx={{
                            bgcolor: alpha(getStatusColor(ticket.status), 0.12),
                            color: getStatusColor(ticket.status),
                            fontWeight: 700,
                            borderRadius: "6px",
                            height: "24px",
                            textTransform: "capitalize",
                          }}
                        />
                      </TableCell>

                      <TableCell sx={{ color: "text.primary" }}>
                        {formatDate(ticket.updated_date)}
                      </TableCell>

                      <TableCell
                        sx={{
                          fontWeight: 600,
                          color:
                            ticket.sla_hours > 48
                              ? theme.palette.error.main
                              : "inherit",
                        }}
                      >
                        {ticket.sla_hours !== null &&
                        ticket.sla_hours !== undefined
                          ? `${ticket.sla_hours} hrs`
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {!loadingDetails && agentTickets && agentTickets.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredTickets.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              color: isDark ? "#94a3b8" : "#64748b",
              mt: 1,
              "& .MuiTablePagination-selectIcon": {
                color: isDark ? "#94a3b8" : "#64748b",
              },
            }}
          />
        )}
      </MotionPaper>

      {/* 🔥 PREMIUM ANIMATED CHAT MODAL */}
      <Dialog
        open={chatDialogOpen}
        onClose={closeChatDialog}
        maxWidth="md"
        fullWidth
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            sx: {
              backdropFilter: "blur(6px)",
              backgroundColor: isDark
                ? "rgba(0,0,0,0.6)"
                : "rgba(255,255,255,0.3)",
            },
          },
        }}
        PaperComponent={(props) => (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            transition={{ type: "spring", stiffness: 250, damping: 24 }}
            style={{
              width: "100%",
              margin: "32px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Paper {...props} />
          </motion.div>
        )}
        PaperProps={{
          sx: {
            m: 0,
            width: "100%",
            borderRadius: "24px",
            bgcolor: isDark ? "#0f172a" : "#ffffff",
            backgroundImage: "none",
            border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
            boxShadow: isDark
              ? "0 25px 50px -12px rgba(41, 98, 255, 0.25)"
              : "0 25px 60px -12px rgba(41, 98, 255, 0.15)",
            maxHeight: "85vh",
            overflow: "hidden", // Paper overflow hidden taaki internal scroll chal sake
          },
        }}
      >
        {/* 🔥 Fixed Title Section */}
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 3,
            pb: 2.5,
            background: isDark
              ? "linear-gradient(to right, #0f172a, #1e293b)"
              : "linear-gradient(to right, #ffffff, #f8fafc)",
            borderBottom: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
          }}
        >
          <Box>
            <Typography
              variant="h6"
              fontWeight="800"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                color: isDark ? "#fff" : "#0f172a",
              }}
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: alpha("#2962ff", 0.1),
                  color: "#2962ff",
                }}
              >
                <ChatIcon fontSize="small" />
              </Avatar>
              Ticket #
              {activeTicketForChat?.ticket_id || activeTicketForChat?.id}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", mt: 0.5, ml: 6 }}
            >
              {activeTicketForChat?.issue || "Chat History"}
            </Typography>
          </Box>
          <motion.div whileHover={{ rotate: 90 }} whileTap={{ scale: 0.9 }}>
            <IconButton
              onClick={closeChatDialog}
              sx={{
                bgcolor: isDark ? alpha("#fff", 0.05) : alpha("#000", 0.04),
                "&:hover": { bgcolor: theme.palette.error.main, color: "#fff" },
              }}
            >
              <CloseIcon />
            </IconButton>
          </motion.div>
        </DialogTitle>

        {/* 🔥 Scrollable Content Section */}
        <DialogContent
          sx={{
            p: 0,
            bgcolor: isDark ? "#0b1120" : "#f8fafc",
            overflowY: "auto", // Yahan scroll hoga
            maxHeight: "60vh",
            "&::-webkit-scrollbar": { width: "6px" },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: isDark ? "#334155" : "#cbd5e1",
              borderRadius: "10px",
            },
          }}
        >
          {loadingChat ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "200px",
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              >
                <CircularProgress size={28} sx={{ color: "#2962ff" }} />
              </motion.div>
            </Box>
          ) : chatHistory.length === 0 ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "200px",
              }}
            >
              <Typography color="text.secondary" fontWeight="500">
                No conversation history found.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ p: { xs: 2, sm: 4 }, position: "relative" }}>
              <Box
                sx={{
                  position: "absolute",
                  top: 32,
                  bottom: 32,
                  left: { xs: 34, sm: 50 },
                  width: "2px",
                  bgcolor: isDark ? "#1e293b" : "#e2e8f0",
                  zIndex: 0,
                }}
              />
              <motion.div
                variants={chatContainerVariants}
                initial="hidden"
                animate="visible"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "28px",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                {chatHistory.map((chat, idx) => {
                  const isReply = chat.thread_type === "reply";
                  return (
                    <motion.div
                      key={chat.id || idx}
                      variants={chatBubbleVariants}
                    >
                      <Stack
                        direction="row"
                        spacing={{ xs: 2, sm: 2.5 }}
                        alignItems="flex-start"
                      >
                        <Avatar
                          sx={{
                            bgcolor: isDark ? "#1e293b" : "#fff",
                            color: isReply
                              ? "#2962ff"
                              : theme.palette.success.main,
                            border: `2px solid ${isReply ? "#2962ff" : theme.palette.success.main}`,
                            width: 44,
                            height: 44,
                            fontWeight: 700,
                            boxShadow: `0 4px 10px ${alpha(isReply ? "#2962ff" : theme.palette.success.main, 0.2)}`,
                            zIndex: 2,
                          }}
                        >
                          {chat.user_name ? (
                            chat.user_name.charAt(0).toUpperCase()
                          ) : (
                            <PersonIcon />
                          )}
                        </Avatar>

                        <Box sx={{ flex: 1, mt: -0.5 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "baseline",
                              flexWrap: "wrap",
                              gap: 1.5,
                              mb: 0.8,
                            }}
                          >
                            <Typography
                              variant="subtitle2"
                              fontWeight="700"
                              sx={{
                                color: isDark ? "#f8fafc" : "#0f172a",
                                fontSize: "0.95rem",
                              }}
                            >
                              {chat.user_name || "Unknown User"}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: "text.secondary", fontWeight: 500 }}
                            >
                              {formatDate(chat.created_at)}
                            </Typography>
                          </Box>

                          <Paper
                            elevation={0}
                            sx={{
                              p: 2.5,
                              borderRadius: "0px 16px 16px 16px",
                              bgcolor: isDark ? "#1e293b" : "#ffffff",
                              border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                              color: isDark ? "#cbd5e1" : "#334155",
                              fontSize: "0.9rem",
                              lineHeight: 1.6,
                            }}
                          >
                            <div
                              dangerouslySetInnerHTML={{
                                __html: decodeHTML(chat.message),
                              }}
                            />
                          </Paper>
                        </Box>
                      </Stack>
                    </motion.div>
                  );
                })}
              </motion.div>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
