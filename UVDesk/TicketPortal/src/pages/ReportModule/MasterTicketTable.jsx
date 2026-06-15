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
  alpha,
  TablePagination,
  Box,
  TextField,
  InputAdornment,
} from "@mui/material";
import { motion } from "framer-motion";
import {
  ReceiptLongOutlined as ReceiptIcon,
  Close as CloseIcon,
  Search as SearchIcon,
} from "@mui/icons-material";

// 🔥 Import Reusable Chat Modal Component
import TicketChatModal from "./TicketChatModal";

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

export default function MasterTicketTable({
  ticketDetails,
  loadingTickets,
  isDark,
  theme,
  getStatusColor,
  formatDate,
  onClose,
  activeStatus,
}) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");

  // 🔥 Chat Modal States
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [activeTicketForChat, setActiveTicketForChat] = useState(null);

  useEffect(() => {
    setPage(0);
    setSearchTerm("");
  }, [activeStatus]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 🔥 Filter logic
  const filteredTickets = (ticketDetails || []).filter((ticket) => {
    if (!searchTerm) return true;
    const lowerSearch = searchTerm.toLowerCase();
    return (
      ticket.ticket_id?.toString().toLowerCase().includes(lowerSearch) ||
      ticket.subject?.toLowerCase().includes(lowerSearch) ||
      ticket.agent_name?.toLowerCase().includes(lowerSearch)
    );
  });

  // 🔥 Handle Row Click to Open Chat
  const handleRowClick = (ticket) => {
    const structuredTicket = {
      ...ticket,
      issue: ticket.subject || ticket.issue,
    };
    setActiveTicketForChat(structuredTicket);
    setChatDialogOpen(true);
  };

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
        {/* 🔥 HEADER BOX */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
            mb: 3,
          }}
        >
          <Typography
            variant="subtitle1"
            fontWeight="700"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              color: isDark ? "#fff" : "#1e293b",
              textTransform: "capitalize",
              flexGrow: 1,
            }}
          >
            <ReceiptIcon sx={{ color: "#2962ff" }} />
            Showing Tickets for Status:{" "}
            <span style={{ color: "#2962ff", marginLeft: "4px" }}>
              {activeStatus === "total" ? "All" : activeStatus}
            </span>
          </Typography>

          {/* Search Box aur Close Button */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <TextField
              size="small"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "#94a3b8", fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                minWidth: { xs: "100%", sm: 280 },
                "& .MuiOutlinedInput-root": {
                  bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
                  borderRadius: "8px",
                  color: isDark ? "#fff" : "#1e293b",
                  "& fieldset": { borderColor: isDark ? "#334155" : "#e2e8f0" },
                  "&hover fieldset": { borderColor: "#2962ff" },
                  "&.Mui-focused fieldset": { borderColor: "#2962ff" },
                },
              }}
            />

            <IconButton
              size="small"
              onClick={onClose}
              sx={{
                bgcolor: isDark ? alpha("#fff", 0.05) : alpha("#000", 0.04),
                "&:hover": {
                  bgcolor: theme?.palette?.error?.main || "#ef4444",
                  color: "#fff",
                },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* 🔥 TABLE SECTION WITH MATCHED DESIGN */}
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
                  "Subject",
                  "Agent Name",
                  "Status",
                  "Created At",
                  "Updated At",
                ].map((head) => (
                  <TableCell
                    key={head}
                    sx={{
                      bgcolor: isDark ? "#1e293b" : "#f8fafc",
                      color: isDark ? "#94a3b8" : "#64748b",
                      fontWeight: 600,
                      borderBottom: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                      whiteSpace: "nowrap",
                      padding: "8px 10px", // Exact padding match
                    }}
                  >
                    {head}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loadingTickets ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} sx={{ color: "#2962ff" }} />
                  </TableCell>
                </TableRow>
              ) : filteredTickets.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    align="center"
                    sx={{ py: 5, color: "text.secondary", fontWeight: 500 }}
                  >
                    {searchTerm
                      ? "No tickets match your search."
                      : `No tickets found for ${activeStatus === "total" ? "any" : activeStatus} status.`}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTickets
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((ticket, idx) => (
                    <TableRow
                      key={idx}
                      onClick={() => handleRowClick(ticket)}
                      sx={{
                        cursor: "pointer",
                        "&:hover": {
                          bgcolor: isDark
                            ? "rgba(255,255,255,0.04)"
                            : "#f1f5f9",
                        },
                        "& td": {
                          borderBottom: `1px solid ${isDark ? "#1e293b" : "#f1f5f9"}`,
                          padding: "6px 10px", // Exact cell padding match
                        },
                        "&:last-child td": { borderBottom: "none" },
                      }}
                    >
                      {/* Ticket ID Cell */}
                      <TableCell
                        sx={{ fontWeight: 700, color: "text.primary" }}
                      >
                        {ticket.ticket_id || ticket.id}
                      </TableCell>

                      {/* Subject Row (With exact Ellipsis and Width configurations) */}
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
                          title={ticket.subject || ""}
                          placement="top-start"
                        >
                          <span
                            style={{
                              display: "block",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {ticket.subject || "-"}
                          </span>
                        </Tooltip>
                      </TableCell>

                      {/* Agent Name Cell */}
                      <TableCell sx={{ color: "text.primary" }}>
                        {ticket.agent_name || "-"}
                      </TableCell>

                      {/* Status Custom Chip */}
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

                      {/* Dates Mapping */}
                      <TableCell sx={{ color: "text.primary" }}>
                        {formatDate
                          ? formatDate(ticket.created_at)
                          : ticket.created_at}
                      </TableCell>

                      <TableCell sx={{ color: "text.primary" }}>
                        {formatDate
                          ? formatDate(ticket.updated_at)
                          : ticket.updated_at}
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* 🔥 Pagination Controls Match */}
        {!loadingTickets && filteredTickets.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
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

      {/* 🔥 REUSABLE CHAT MODAL INTEGRATION */}
      <TicketChatModal
        open={chatDialogOpen}
        onClose={() => setChatDialogOpen(false)}
        ticket={activeTicketForChat}
        isDark={isDark}
        theme={theme}
        formatDate={formatDate}
      />
    </>
  );
}
