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
  TablePagination, // Pagination component import kiya gaya hai
} from "@mui/material";
import { motion } from "framer-motion";
import {
  ReceiptLongOutlined as ReceiptIcon,
  Close as CloseIcon,
} from "@mui/icons-material";

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
  // --- Pagination States ---
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Jab bhi naya agent select hoga, table automatic page 0 par reset ho jayegi
  useEffect(() => {
    setPage(0);
  }, [selectedAgentId]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (!selectedAgentId) return null;

  return (
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
                  }}
                >
                  {head}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loadingDetails ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={28} sx={{ color: "#2962ff" }} />
                </TableCell>
              </TableRow>
            ) : !agentTickets || agentTickets.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  align="center"
                  sx={{ py: 5, color: "text.secondary", fontWeight: 500 }}
                >
                  No tickets found for this agent.
                </TableCell>
              </TableRow>
            ) : (
              // Array slicing handle kar rha hai current page ka data
              agentTickets
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((ticket, idx) => (
                  <TableRow
                    key={idx}
                    sx={{
                      "&:hover": {
                        bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc",
                      },
                      "& td": {
                        borderBottom: `1px solid ${
                          isDark ? "#1e293b" : "#f1f5f9"
                        }`,
                      },
                      "&:last-child td": { borderBottom: "none" },
                    }}
                  >
                    <TableCell sx={{ fontWeight: 700, color: "text.primary" }}>
                      {ticket.ticket_id}
                    </TableCell>

                    <TableCell
                      sx={{
                        maxWidth: 280,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        color: "text.secondary",
                      }}
                    >
                      <Tooltip title={ticket.issue || ""} placement="top-start">
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

      {/* Pagination Controls Footer */}
      {!loadingDetails && agentTickets && agentTickets.length > 0 && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={agentTickets.length}
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
  );
}
