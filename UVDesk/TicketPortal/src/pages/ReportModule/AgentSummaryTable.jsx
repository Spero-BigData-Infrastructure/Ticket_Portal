import  { useState } from "react";
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
  TablePagination,
  alpha,
  Box,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";
import {
  Assessment as AssessmentIcon,
  ChevronRight as ChevronRightIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
} from "@mui/icons-material";

export default function AgentSummaryTable({
  isDark,
  loadingSummary,
  summaryData,
  page,
  rowsPerPage,
  handleChangePage,
  handleChangeRowsPerPage,
  selectedAgentId,
  fetchAgentDetails,
  getStatusColor,
  onSlaFilterChange, // <-- Is prop ka use karke hum API call karenge
}) {
  const [searchTerm, setSearchTerm] = useState("");

  // Local state for dropdown UI
  const [slaFilter, setSlaFilter] = useState("all");

  // Search filter (Agent Name ke liye)
  const filteredData =
    summaryData?.filter((row) =>
      row.agent_name?.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || [];

  // Jab Dropdown change hoga:
  const handleFilterChange = (e) => {
    const newValue = e.target.value;
    setSlaFilter(newValue);

    // Parent component ko batayega ki naya filter select hua hai (Taki API wapas call ho)
    if (onSlaFilterChange) {
      onSlaFilterChange(newValue);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: "16px",
        bgcolor: isDark ? "#111827" : "#fff",
        border: 1,
        borderColor: isDark ? "#334155" : "#e2e8f0",
        mb: 4,
        boxShadow: isDark
          ? "0px 4px 20px rgba(0, 0, 0, 0.2)"
          : "0px 4px 20px rgba(0, 0, 0, 0.05)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
          mb: 3,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
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
            }}
          >
            <AssessmentIcon sx={{ color: "#2962ff" }} /> Agent Performance
          </Typography>

          {/* SLA Filter Dropdown */}
          <FormControl size="small">
            <Select
              value={slaFilter}
              onChange={handleFilterChange}
              displayEmpty
              startAdornment={
                <InputAdornment position="start">
                  <FilterIcon
                    sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: 18 }}
                  />
                </InputAdornment>
              }
              sx={{
                minWidth: 160,
                bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
                color: isDark ? "#fff" : "#1e293b",
                borderRadius: "8px",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: isDark ? "#334155" : "#e2e8f0",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#2962ff",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#2962ff",
                },
                "& .MuiSelect-icon": { color: isDark ? "#94a3b8" : "#64748b" },
              }}
            >
              <MenuItem value="all">All SLAs</MenuItem>
              <MenuItem value="lt_48">Below 48 Hrs</MenuItem>
              <MenuItem value="gt_48">After 48 Hrs</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Search Box */}
        <TextField
          size="small"
          placeholder="Search agent..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            handleChangePage(null, 0);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon
                  sx={{ color: isDark ? "#94a3b8" : "#94a3b8", fontSize: 20 }}
                />
              </InputAdornment>
            ),
          }}
          sx={{
            minWidth: { xs: "100%", sm: 250 },
            "& .MuiOutlinedInput-root": {
              bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
              borderRadius: "8px",
              color: isDark ? "#fff" : "#1e293b",
              "& fieldset": { borderColor: isDark ? "#334155" : "#e2e8f0" },
              "&:hover fieldset": { borderColor: "#2962ff" },
              "&.Mui-focused fieldset": { borderColor: "#2962ff" },
            },
          }}
        />
      </Box>

      {/* Table Section */}
      <TableContainer
        sx={{
          border: 1,
          borderColor: isDark ? "#334155" : "#e2e8f0",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        <Table size="medium" sx={{ tableLayout: "fixed" }}>
          <TableHead>
            <TableRow>
              {[
                "Agent Name",
                "Total",
                "Active",
                "Resolved",
                "Closed",
                "Action",
              ].map((head) => (
                <TableCell
                  key={head}
                  sx={{
                    bgcolor: isDark ? "#1e293b" : "#f8fafc",
                    color: isDark ? "#94a3b8" : "#64748b",
                    fontWeight: 700,
                    borderBottom: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                    whiteSpace: "nowrap",
                    width:
                      head === "Agent Name"
                        ? "30%"
                        : head === "Action"
                          ? "10%"
                          : "auto",
                  }}
                >
                  {head}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loadingSummary ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                  <CircularProgress size={30} sx={{ color: "#2962ff" }} />
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  align="center"
                  sx={{ py: 6, color: "text.secondary", fontWeight: 500 }}
                >
                  {searchTerm
                    ? "No agents match your search."
                    : "No Data Found"}
                </TableCell>
              </TableRow>
            ) : (
              filteredData
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row, idx) => {
                  const isSelected = selectedAgentId === row.agent_id;
                  return (
                    <TableRow
                      key={idx}
                      onClick={() =>
                        fetchAgentDetails(row.agent_id, row.agent_name)
                      }
                      sx={{
                        cursor: "pointer",
                        bgcolor: isSelected
                          ? isDark
                            ? "rgba(41, 98, 255, 0.15)"
                            : "rgba(41, 98, 255, 0.05)"
                          : "transparent",
                        "&:hover": {
                          bgcolor: isDark
                            ? "rgba(255,255,255,0.04)"
                            : "#f1f5f9",
                        },
                        "& td": {
                          borderBottom: `1px dashed ${isDark ? "#334155" : "#e2e8f0"}`,
                        },
                        "&:last-child td": { borderBottom: "none" },
                      }}
                    >
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          color: isSelected
                            ? "#2962ff"
                            : isDark
                              ? "#e2e8f0"
                              : "#0f172a",
                          position: "relative",
                          "&::before": isSelected
                            ? {
                                content: '""',
                                position: "absolute",
                                left: 0,
                                top: 0,
                                bottom: 0,
                                width: "4px",
                                bgcolor: "#2962ff",
                                borderTopRightRadius: "4px",
                                borderBottomRightRadius: "4px",
                              }
                            : {},
                        }}
                      >
                        {row.agent_name}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 800,
                          color: isDark ? "#fff" : "#0f172a",
                        }}
                      >
                        {row.summary?.total || 0}
                      </TableCell>
                      <TableCell
                        sx={{ color: getStatusColor("open"), fontWeight: 600 }}
                      >
                        {row.summary?.active || 0}
                      </TableCell>
                      <TableCell
                        sx={{
                          color: getStatusColor("resolved"),
                          fontWeight: 600,
                        }}
                      >
                        {row.summary?.resolved || 0}
                      </TableCell>
                      <TableCell
                        sx={{
                          color: getStatusColor("closed"),
                          fontWeight: 600,
                        }}
                      >
                        {row.summary?.closed || 0}
                      </TableCell>
                      <TableCell>
                        <Tooltip
                          title={isSelected ? "Close Details" : "View Tickets"}
                        >
                          <IconButton
                            size="small"
                            sx={{
                              color: isSelected ? "#2962ff" : "text.secondary",
                              transform: isSelected
                                ? "rotate(90deg)"
                                : "rotate(0deg)",
                              transition: "transform 0.3s ease",
                            }}
                          >
                            <ChevronRightIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredData.length}
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
    </Paper>
  );
}
