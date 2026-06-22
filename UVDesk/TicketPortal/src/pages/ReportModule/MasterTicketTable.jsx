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
  Select,
  MenuItem,
} from "@mui/material";
import { motion } from "framer-motion";
import {
  ReceiptLongOutlined as ReceiptIcon,
  Close as CloseIcon,
  Search as SearchIcon,
} from "@mui/icons-material";

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
  onSlaFilterChange,
}) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [slaFilter, setSlaFilter] = useState("All");

  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [activeTicketForChat, setActiveTicketForChat] = useState(null);

  useEffect(() => {
    setPage(0);
    setSearchTerm("");
    setStatusFilter("All");
    setSlaFilter("All");
  }, [activeStatus]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSlaChange = (e) => {
    const selectedValue = e.target.value;
    setSlaFilter(selectedValue);
    setPage(0);

    if (onSlaFilterChange) {
      onSlaFilterChange(selectedValue === "All" ? "" : selectedValue);
    }
  };

  const filteredTickets = (ticketDetails || []).filter((ticket) => {
    let matchesSearch = true;
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      matchesSearch =
        ticket.ticket_id?.toString().toLowerCase().includes(lowerSearch) ||
        ticket.subject?.toLowerCase().includes(lowerSearch) ||
        ticket.agent_name?.toLowerCase().includes(lowerSearch) ||
        ticket.project?.toLowerCase().includes(lowerSearch) ||
        ticket.type?.toLowerCase().includes(lowerSearch);
    }

    let matchesStatus = true;
    if (statusFilter !== "All") {
      matchesStatus =
        ticket.status?.toLowerCase() === statusFilter.toLowerCase();
    }

    return matchesSearch && matchesStatus;
  });

  const handleRowClick = (ticket) => {
    const structuredTicket = {
      ...ticket,
      issue: ticket.subject || ticket.issue,
    };
    setActiveTicketForChat(structuredTicket);
    setChatDialogOpen(true);
  };

  const getSlaHoursNumeric = (slaString) => {
    if (!slaString) return 0;
    return parseFloat(slaString);
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
                  "Project",
                  "Type",
                  "Agent",
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
                        <MenuItem value="Answered">Answered</MenuItem>
                        <MenuItem value="Resolved">Resolved</MenuItem>
                        <MenuItem value="Closed">Closed</MenuItem>
                      </Select>
                    ) : head === "SLA Hrs" ? (
                      <Select
                        value={slaFilter}
                        onChange={handleSlaChange}
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
                        <MenuItem value="All">SLA (All)</MenuItem>
                        <MenuItem value="lt_48">Within SLA 48 Hrs</MenuItem>
                        <MenuItem value="gt_48">Out of SLA 48 Hrs</MenuItem>
                      </Select>
                    ) : (
                      head
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loadingTickets ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} sx={{ color: "#2962ff" }} />
                  </TableCell>
                </TableRow>
              ) : filteredTickets.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    align="center"
                    sx={{ py: 5, color: "text.secondary", fontWeight: 500 }}
                  >
                    {searchTerm || statusFilter !== "All" || slaFilter !== "All"
                      ? "No tickets match your filters."
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
                          maxWidth: 200,
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

                      <TableCell sx={{ color: "text.primary" }}>
                        {ticket.project || "-"}
                      </TableCell>
                      <TableCell sx={{ color: "text.primary" }}>
                        {ticket.type || "-"}
                      </TableCell>
                      <TableCell sx={{ color: "text.primary" }}>
                        {ticket.agent_name || "-"}
                      </TableCell>
                      <TableCell sx={{ color: "text.primary" }}>
                        {formatDate
                          ? formatDate(ticket.created_at)
                          : ticket.created_at}
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
                        {formatDate
                          ? formatDate(ticket.updated_at)
                          : ticket.updated_at}
                      </TableCell>

                      <TableCell
                        sx={{
                          fontWeight: 600,
                          color:
                            getSlaHoursNumeric(ticket.sla_hours) > 48
                              ? theme?.palette?.error?.main || "#ef4444"
                              : "inherit",
                        }}
                      >
                        {ticket.sla_hours || "-"}
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

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
