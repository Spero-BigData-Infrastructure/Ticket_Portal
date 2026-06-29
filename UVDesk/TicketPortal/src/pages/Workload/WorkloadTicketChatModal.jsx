import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Avatar,
  Paper,
  Chip,
  CircularProgress,
  IconButton,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import AttachFileIcon from "@mui/icons-material/AttachFile";

import workloadService from "../../api/workloadService";

export default function WorkloadTicketChatModal({
  open,
  onClose,
  ticket,
  isDark,
}) {
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !ticket?.ticket_id) return;
    fetchChat();
  }, [open, ticket]);

  const fetchChat = async () => {
    setLoading(true);
    setChat([]);

    try {
      const ticketId = String(ticket.ticket_id).replace("#", "");
      const res = await workloadService.getTicketChat(ticketId);

      if (res?.success || res?.status) {
        setChat(res.chat || res.data || []);
      } else {
        setChat([]);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setChat([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: "16px",
          background: isDark ? "#0F172A" : "#fff",
          minHeight: "70vh",
        },
      }}
    >
      {/* HEADER */}
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid",
          borderColor: isDark
            ? "rgba(255,255,255,0.08)"
            : "rgba(0,0,0,0.08)",
        }}
      >
        <Box>
          <Typography fontWeight={800}>
            Ticket {ticket?.ticket_id}
          </Typography>
          <Typography fontSize={12} color="text.secondary">
            {ticket?.subject}
          </Typography>
        </Box>

        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* BODY */}
      <DialogContent sx={{ p: 2 }}>
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              py: 8,
            }}
          >
            <CircularProgress />
          </Box>
        ) : chat.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Typography color="text.secondary">
              No conversation found
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {chat.map((msg, i) => {
              const isSystem = msg.type === "create";

              return (
                <Paper
                  key={i}
                  sx={{
                    p: 2,
                    borderRadius: "12px",
                    background: isDark
                      ? isSystem
                        ? "rgba(99,102,241,0.15)"
                        : "rgba(255,255,255,0.05)"
                      : isSystem
                      ? "#EEF2FF"
                      : "#fff",
                    border: "1px solid",
                    borderColor: isDark
                      ? "rgba(255,255,255,0.08)"
                      : "#E2E8F0",
                  }}
                >
                  {/* HEADER */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      mb: 1,
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        fontSize: 14,
                        bgcolor: isSystem ? "#6366F1" : "#CBD5E1",
                        color: isSystem ? "#fff" : "#000",
                        fontWeight: 800,
                      }}
                    >
                      {msg.user_name?.charAt(0)?.toUpperCase() || "U"}
                    </Avatar>

                    <Box>
                      <Typography fontWeight={700} fontSize={13}>
                        {msg.user_name || "Unknown"}
                      </Typography>

                      <Typography fontSize={11} color="text.secondary">
                        {msg.created_at}
                      </Typography>
                    </Box>

                    {isSystem && (
                      <Chip
                        label="CREATE"
                        size="small"
                        sx={{
                          ml: "auto",
                          fontSize: 10,
                          height: 18,
                          bgcolor: "#D1FAE5",
                          color: "#065F46",
                          fontWeight: 700,
                        }}
                      />
                    )}
                  </Box>

                  {/* MESSAGE */}
                  {msg.message && (
                    <Box
                      sx={{
                        fontSize: 13,
                        lineHeight: 1.6,
                        color: isDark ? "#E2E8F0" : "#0F172A",
                      }}
                      dangerouslySetInnerHTML={{
                        __html: msg.message,
                      }}
                    />
                  )}

                  {/* ATTACHMENTS */}
                  {msg.attachments?.length > 0 && (
                    <Box sx={{ mt: 1.5, display: "flex", flexDirection: "column", gap: 1 }}>
                      {msg.attachments.map((att, idx) => (
                        <Box
                          key={idx}
                          component="a"
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            p: 1,
                            borderRadius: "8px",
                            textDecoration: "none",
                            background: isDark
                              ? "rgba(99,102,241,0.08)"
                              : "#F1F5F9",
                            border: "1px solid",
                            borderColor: isDark
                              ? "rgba(99,102,241,0.2)"
                              : "#E2E8F0",
                          }}
                        >
                          <AttachFileIcon fontSize="small" />

                          <Box>
                            <Typography fontSize={12} fontWeight={700}>
                              {att.name}
                            </Typography>
                            {att.size && (
                              <Typography fontSize={10} color="text.secondary">
                                {att.size}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Paper>
              );
            })}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
