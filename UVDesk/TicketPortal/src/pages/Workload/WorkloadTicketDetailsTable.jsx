import { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  TablePagination,
  CircularProgress,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

import workloadService from "../../api/workloadService";

const STATUS_COLORS = {
  open: "#F59E0B",
  pending: "#3B82F6",
  answered: "#10B981",
  resolved: "#8B5CF6",
  closed: "#94A3B8",
};

export default function WorkloadTicketDetailsTable({
  payload,
  onTicketClick,
  isDark,
}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    if (!payload) return;
    fetchTickets();
  }, [payload]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await workloadService.getTicketDetails(payload);

      if (res?.status || res?.success) {
        setData(res.data || []);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error("Ticket details error:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = data.filter((t) => {
    const s = search.toLowerCase();
    return (
      t.ticket_id?.toLowerCase().includes(s) ||
      t.subject?.toLowerCase().includes(s) ||
      t.agent_name?.toLowerCase().includes(s)
    );
  });

  const paginated = filtered.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Paper
      sx={{
        p: 2,
        borderRadius: "14px",
        background: isDark ? "#1E293B" : "#fff",
        border: "1px solid",
        borderColor: isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0",
      }}
    >
      {/* HEADER */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mb: 2,
          alignItems: "center",
        }}
      >
        <Typography fontWeight={800}>Ticket Details</Typography>

        <TextField
          size="small"
          placeholder="Search tickets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: search && (
              <IconButton onClick={() => setSearch("")} size="small">
                <CloseIcon fontSize="small" />
              </IconButton>
            ),
          }}
        />
      </Box>

      {/* TABLE */}
      {loading ? (
        <Box sx={{ py: 6, textAlign: "center" }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["ID", "Subject", "Project", "Agent", "Status"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "10px",
                      fontSize: "12px",
                      color: isDark ? "#94A3B8" : "#64748B",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {paginated.map((t) => (
                <tr
                  key={t.ticket_id}
                  onClick={() => onTicketClick?.(t)}
                  style={{
                    cursor: "pointer",
                    borderTop: "1px solid #E2E8F0",
                  }}
                >
                  <td style={{ padding: "10px", fontWeight: 700 }}>
                    {t.ticket_id}
                  </td>

                  <td style={{ padding: "10px" }}>{t.subject}</td>

                  <td style={{ padding: "10px" }}>{t.project}</td>

                  <td style={{ padding: "10px" }}>{t.agent_name}</td>

                  <td style={{ padding: "10px" }}>
                    <Chip
                      size="small"
                      label={t.status}
                      sx={{
                        background: STATUS_COLORS[t.status] + "22",
                        color: STATUS_COLORS[t.status],
                        fontWeight: 700,
                      }}
                    />
                  </td>
                </tr>
              ))}

              {paginated.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 20 }}>
                    No tickets found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Box>
      )}

      {/* PAGINATION */}
      <TablePagination
        component="div"
        count={filtered.length}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
      />
    </Paper>
  );
}
