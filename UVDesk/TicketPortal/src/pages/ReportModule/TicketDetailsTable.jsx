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
  Chip,
  Stack,
  alpha,
  TablePagination,
  Select,
  MenuItem,
} from "@mui/material";
import { motion } from "framer-motion";
import { ReceiptLongOutlined as ReceiptIcon } from "@mui/icons-material";

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
  isDark,
  theme,
  loadingTickets, // loading state for all tickets
  allTickets, // Array of all tickets across the system
  getStatusColor,
  formatDate,
}) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10); // Master table ke liye default 10 sahi rahega
  const [statusFilter, setStatusFilter] = useState("All");
  const [agentFilter, setAgentFilter] = useState("All");

  // Chat Modal Trigger States
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [activeTicketForChat, setActiveTicketForChat] = useState(null);

  // Extract unique agents for the dropdown filter
  const uniqueAgents = Array.from(
    new Set((allTickets || []).map((t) => t.agent_name).filter(Boolean)),
  );

  useEffect(() => {
    setPage(0);
  }, [statusFilter, agentFilter]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Multiple Filters logic: Status and Agent
  const filteredTickets = (allTickets || []).filter((ticket) => {
    const matchesStatus =
      statusFilter === "All" ||
      ticket.status?.toLowerCase() === statusFilter.toLowerCase();

    const matchesAgent =
      agentFilter === "All" || ticket.agent_name === agentFilter;

    return matchesStatus && matchesAgent;
  });

  const handleTicketClick = (ticket) => {
    setActiveTicketForChat(ticket);
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
          borderColor: "#0284c7", // Diff color for differentiation (Sky blue tone)
          mb: 4,
          boxShadow: isDark
            ? "0px 8px 30px rgba(2, 132, 199, 0.1)"
            : "0px 12px 40px rgba(2, 132, 199, 0.15)",
        }}
      >
        {/* Header Stack */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          gap={2}
          mb={3}
        >
          <Typography
            variant="h6"
            fontWeight="700"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              color: isDark ? "#fff" : "#1e293b",
            }}
          >
            <ReceiptIcon sx={{ color: "#0284c7" }} />
            Master Tickets Dashboard
          </Typography>

          {/* Agent Filter Dropdown (Header control) */}
          <Stack direction="row" alignItems="center" gap={1}>
            <Typography
              variant="body2"
              sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 500 }}
            >
              Filter Agent:
            </Typography>
            <Select
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              size="small"
              sx={{
                minWidth: 150,
                color: isDark ? "#fff" : "#1e293b",
                bgcolor: isDark ? "#1e293b" : "#f8fafc",
                borderRadius: "8px",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: isDark ? "#334155" : "#e2e8f0",
                },
              }}
            >
              <MenuItem value="All">All Agents</MenuItem>
              {uniqueAgents.map((agent) => (
                <MenuItem key={agent} value={agent}>
                  {agent}
                </MenuItem>
              ))}
            </Select>
          </Stack>
        </Stack>

        {/* Table Container */}
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
                  "Assigned To", // Added Agent Name Column
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
                      padding: "10px 12px",
                    }}
                  >
                    {head === "Status" ? (
                      <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
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
              {loadingTickets ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} sx={{ color: "#0284c7" }} />
                  </TableCell>
                </TableRow>
              ) : filteredTickets.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    align="center"
                    sx={{ py: 5, color: "text.secondary", fontWeight: 500 }}
                  >
                    No tickets found matching the criteria.
                  </TableCell>
                </TableRow>
              ) : (
                [...filteredTickets]
                  .reverse()
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((ticket, idx) => (
                    <TableRow
                      key={ticket.ticket_id || ticket.id || idx}
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
                          padding: "8px 12px",
                        },
                        "& :last-child td": { borderBottom: "none" },
                      }}
                    >
                      {/* Ticket ID */}
                      <TableCell
                        sx={{ fontWeight: 700, color: "text.primary" }}
                      >
                        {ticket.ticket_id || ticket.id}
                      </TableCell>

                      {/* Assigned Agent Column */}
                      <TableCell sx={{ fontWeight: 600, color: "#0284c7" }}>
                        {ticket.agent_name || "Unassigned"}
                      </TableCell>

                      {/* Issue */}
                      <TableCell
                        sx={{
                          maxWidth: 220,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          color: "text.secondary",
                        }}
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
                      </TableCell>

                      {/* Project */}
                      <TableCell sx={{ color: "text.primary" }}>
                        {ticket.project || "-"}
                      </TableCell>

                      {/* Type */}
                      <TableCell sx={{ color: "text.primary" }}>
                        {ticket.type || "-"}
                      </TableCell>

                      {/* Created Date */}
                      <TableCell sx={{ color: "text.primary" }}>
                        {formatDate(ticket.added_date)}
                      </TableCell>

                      {/* Status Chip */}
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

                      {/* Updated Date */}
                      <TableCell sx={{ color: "text.primary" }}>
                        {formatDate(ticket.updated_date)}
                      </TableCell>

                      {/* SLA Hours */}
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

        {/* Pagination */}
        {!loadingTickets && allTickets && allTickets.length > 0 && (
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

      {/* Reusable Chat Modal */}
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
