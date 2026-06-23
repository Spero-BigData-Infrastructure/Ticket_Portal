import React, { useState, useEffect } from "react";
import {
  Typography,
  Paper,
  CircularProgress,
  IconButton,
  Avatar,
  Box,
  Backdrop,
  Dialog,
  DialogTitle,
  DialogContent,
  Stack,
  alpha,
  Chip,
} from "@mui/material";
import { motion } from "framer-motion";
import {
  Close as CloseIcon,
  ForumOutlined as ChatIcon,
  SupportAgentOutlined as AgentIcon,
  PersonOutlineOutlined as UserIcon,
} from "@mui/icons-material";

// 🔥 Import API Service
import reportService from "../../api/reportService";

// Modern Chat Stagger Animation Variants
const chatContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const getBubbleVariants = (isReply) => ({
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 25 },
  },
});

// Helper function: HTML decode karne ke liye
const decodeHTML = (htmlStr) => {
  if (!htmlStr) return "";
  const txt = document.createElement("textarea");
  txt.innerHTML = htmlStr;
  return txt.value;
};

export default function TicketChatModal({
  open,
  onClose,
  ticket,
  isDark,
  theme,
  formatDate,
}) {
  const [chatHistory, setChatHistory] = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);

  useEffect(() => {
    if (!open || !ticket) return;

    let actualTicketId = ticket.ticket_id || ticket.id;
    if (!actualTicketId) {
      console.error("Ticket ID missing!");
      return;
    }

    actualTicketId = String(actualTicketId).replace("#", "");

    const fetchChat = async () => {
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

    fetchChat();
  }, [open, ticket]);

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setChatHistory([]);
    }, 300);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      // 🔥 'xl' lagane se Material-UI ko allow milta hai maximum space lene ka
      maxWidth="xl"
      fullWidth
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: "blur(8px)",
            backgroundColor: isDark
              ? "rgba(15, 23, 42, 0.7)"
              : "rgba(71, 85, 105, 0.4)",
          },
        },
      }}
      PaperComponent={(props) => (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 360, damping: 28 }}
          style={{
            width: "100%",
            // 🔥 Framer motion div ki limits aur bada di hain (ab almost edge-to-edge jayega)
            maxWidth: "1500px",
            margin: "24px",
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
          borderRadius: "20px",
          bgcolor: isDark ? "#0f172a" : "#ffffff",
          backgroundImage: "none",
          border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
          boxShadow: isDark
            ? "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
            : "0 25px 50px -12px rgba(148, 163, 184, 0.25)",
          // 🔥 Modal ko screen ka 90% space lene ko bol diya
          height: "90vh",
          maxHeight: "95vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* 🏷️ Sticky Premium Header */}
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 2.5,
          bgcolor: isDark ? "#1e293b" : "#f8fafc",
          borderBottom: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
          zIndex: 10,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              bgcolor: isDark ? alpha("#3b82f6", 0.15) : alpha("#2563eb", 0.1),
              color: isDark ? "#60a5fa" : "#2563eb",
              border: `1px solid ${isDark ? alpha("#3b82f6", 0.3) : alpha("#2563eb", 0.2)}`,
            }}
          >
            <ChatIcon sx={{ fontSize: "1.3rem" }} />
          </Avatar>
          <Box>
            <Typography
              variant="h6"
              fontWeight="800"
              sx={{
                color: isDark ? "#f8fafc" : "#0f172a",
                fontSize: "1.1rem", // Thoda bada header text
                lineHeight: 1.2,
              }}
            >
              Ticket {ticket?.ticket_id || ticket?.id || "N/A"}
            </Typography>
            <Typography
              variant="body2"
              fontWeight="500"
              sx={{
                color: isDark ? "#94a3b8" : "#64748b",
                mt: 0.3,
                maxWidth: { xs: "300px", sm: "600px" },
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                overflow: "hidden",
                fontSize: "0.875rem",
              }}
            >
              {ticket?.issue || "View conversation log"}
            </Typography>
          </Box>
        </Box>
        <IconButton
          onClick={handleClose}
          sx={{
            color: isDark ? "#94a3b8" : "#64748b",
            bgcolor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
            transition: "all 0.2s",
            p: 1.2,
            "&:hover": {
              bgcolor: isDark ? "rgba(239, 68, 68, 0.2)" : "#fee2e2",
              color: "#ef4444",
            },
          }}
        >
          <CloseIcon fontSize="medium" />
        </IconButton>
      </DialogTitle>

      {/* 💬 Smooth Scroll Chat Area */}
      <DialogContent
        sx={{
          p: 0,
          bgcolor: isDark ? "#0b1329" : "#ffffff",
          overflowY: "auto",
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          // 🔥 Chat section ki height nayi height ke hisab se set ki (90vh - header height)
          maxHeight: "calc(90vh - 85px)",
          "&::-webkit-scrollbar": { width: "8px" },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: isDark ? "#334155" : "#cbd5e1",
            borderRadius: "100px",
          },
        }}
      >
        {loadingChat ? (
          <Box
            sx={{
              display: "flex",
              flexGrow: 1,
              justifyContent: "center",
              alignItems: "center",
              minHeight: "300px",
            }}
          >
            <CircularProgress
              size={35}
              thickness={4}
              sx={{ color: "#2563eb" }}
            />
          </Box>
        ) : chatHistory.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexGrow: 1,
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "300px",
              gap: 2,
            }}
          >
            <ChatIcon
              sx={{ fontSize: 48, color: isDark ? "#475569" : "#cbd5e1" }}
            />
            <Typography
              variant="body1"
              fontWeight="600"
              sx={{ color: isDark ? "#64748b" : "#94a3b8" }}
            >
              No conversation history found.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ p: { xs: 2, sm: 4, md: 5 } }}>
            <motion.div
              variants={chatContainerVariants}
              initial="hidden"
              animate="visible"
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              {chatHistory.map((chat, idx) => {
                const isReply = chat.thread_type === "reply";
                const roleColor = isReply ? "#3b82f6" : "#10b981";

                return (
                  <motion.div
                    key={chat.id || idx}
                    variants={getBubbleVariants(isReply)}
                    style={{
                      display: "flex",
                      justifyContent: isReply ? "flex-end" : "flex-start",
                      width: "100%",
                    }}
                  >
                    <Stack
                      direction={isReply ? "row-reverse" : "row"}
                      spacing={{ xs: 1.5, sm: 2 }}
                      alignItems="flex-start"
                      sx={{ maxWidth: { xs: "100%", sm: "85%", md: "75%" } }} // 🔥 Text bubble ki width badi screen par manage karne ke liye
                    >
                      {/* Avatar Mapping */}
                      <Avatar
                        sx={{
                          bgcolor: isDark ? "#1e293b" : "#f1f5f9",
                          color: roleColor,
                          border: `1.5px solid ${alpha(roleColor, 0.4)}`,
                          width: 40,
                          height: 40,
                          boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                        }}
                      >
                        {isReply ? (
                          <AgentIcon sx={{ fontSize: "1.2rem" }} />
                        ) : (
                          <UserIcon sx={{ fontSize: "1.2rem" }} />
                        )}
                      </Avatar>

                      {/* Content Stack */}
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: isReply ? "flex-end" : "flex-start",
                        }}
                      >
                        {/* Meta Row */}
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.2,
                            mb: 0.6,
                            px: 0.5,
                            flexDirection: isReply ? "row-reverse" : "row",
                          }}
                        >
                          <Typography
                            variant="body2"
                            fontWeight="700"
                            sx={{
                              color: isDark ? "#e2e8f0" : "#1e293b",
                              fontSize: "0.9rem",
                            }}
                          >
                            {chat.user_name ||
                              (isReply ? "Support Agent" : "Customer")}
                          </Typography>

                          <Chip
                            label={chat.thread_type || "Message"}
                            size="small"
                            sx={{
                              height: "20px",
                              fontSize: "0.65rem",
                              fontWeight: "700",
                              textTransform: "uppercase",
                              borderRadius: "6px",
                              letterSpacing: "0.02em",
                              px: 0.5,
                              bgcolor: isReply
                                ? alpha("#3b82f6", 0.12)
                                : alpha("#10b981", 0.12),
                              color: isReply ? "#60a5fa" : "#34d399",
                              border: "none",
                            }}
                          />

                          <Typography
                            variant="caption"
                            sx={{
                              color: isDark ? "#64748b" : "#94a3b8",
                              fontWeight: "500",
                              fontSize: "0.75rem",
                            }}
                          >
                            {formatDate
                              ? formatDate(chat.created_at)
                              : chat.created_at}
                          </Typography>
                        </Box>

                        {/* Speech Bubble */}
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            borderRadius: isReply
                              ? "16px 4px 16px 16px"
                              : "4px 16px 16px 16px",
                            bgcolor: isReply
                              ? isDark
                                ? "#1e293b"
                                : "#eff6ff"
                              : isDark
                                ? "#142521"
                                : "#f0fdf4",
                            border: `1px solid ${
                              isReply
                                ? isDark
                                  ? "#334155"
                                  : "#dbeafe"
                                : isDark
                                  ? "#1e3a34"
                                  : "#dcfce7"
                            }`,
                            color: isDark ? "#cbd5e1" : "#334155",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                          }}
                        >
                          <Box
                            sx={{
                              fontSize: "0.95rem", // 🔥 Badi screen par text bhi clear dikhega
                              lineHeight: 1.6,
                              letterSpacing: "0.01em",
                              wordBreak: "break-word",
                              "& p": { m: 0 },
                              "& p:not(:last-child)": { mb: 1.5 },
                              "& strong": {
                                fontWeight: "700",
                                color: isDark ? "#fff" : "#0f172a",
                              },
                            }}
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
  );
}
