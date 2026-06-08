import { useState } from "react";
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
  Box,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  TableSortLabel,
  Button, // <-- Added Button import
} from "@mui/material";
import {
  Assessment as AssessmentIcon,
  ChevronRight as ChevronRightIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon, // <-- Added Refresh Icon import
} from "@mui/icons-material";

const headCells = [
  { id: "agent_name", label: "Agent Name", sortable: true, type: "string" },
  { id: "total", label: "Total", sortable: true, type: "number" },
  { id: "active", label: "Active", sortable: true, type: "number" },
  { id: "resolved", label: "Resolved", sortable: true, type: "number" },
  { id: "closed", label: "Closed", sortable: true, type: "number" },
  { id: "action", label: "Action", sortable: false },
];

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
  slaFilter,
  onSlaFilterChange,
  searchTerm,
  onSearchChange,
}) {
  // --- SORTING STATES ---
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("agent_name");

  // Search filter
  const filteredData =
    summaryData?.filter((row) =>
      row.agent_name?.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || [];

  const handleFilterChange = (e) => {
    const newValue = e.target.value;
    if (onSlaFilterChange) {
      onSlaFilterChange(newValue);
    }
  };

  // --- SORTING HANDLER ---
  const handleRequestSort = (property) => {
    const isSameProperty = orderBy === property;

    if (isSameProperty) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      const clickedHeadCell = headCells.find((cell) => cell.id === property);
      const defaultOrder = clickedHeadCell?.type === "number" ? "desc" : "asc";
      setOrder(defaultOrder);
      setOrderBy(property);
    }
  };

  // --- RESET HANDLER ---
  const handleReset = () => {
    setOrder("asc");
    setOrderBy("agent_name");

    if (onSearchChange) {
      onSearchChange("");
    }
    if (onSlaFilterChange) {
      onSlaFilterChange("all");
    }
    if (handleChangePage) {
      // Paginator ko pehle page (0) pe laane ke liye null event ke sath call karein
      handleChangePage(null, 0);
    }
  };

  // --- SORTING LOGIC ---
  const sortedData = [...filteredData].sort((a, b) => {
    let valueA, valueB;

    if (orderBy === "agent_name") {
      valueA = a.agent_name?.toLowerCase() || "";
      valueB = b.agent_name?.toLowerCase() || "";
    } else {
      valueA = a.summary?.[orderBy] || 0;
      valueB = b.summary?.[orderBy] || 0;
    }

    if (valueA < valueB) {
      return order === "asc" ? -1 : 1;
    }
    if (valueA > valueB) {
      return order === "asc" ? 1 : -1;
    }
    return 0;
  });

  const getSortTooltipTitle = (headCell) => {
    if (!headCell.sortable) return "";
    if (orderBy !== headCell.id) return "Click to sort";
    if (headCell.type === "string") {
      return order === "asc"
        ? "Click to sort descending (Z-A)"
        : "Click to sort ascending (A-Z)";
    } else {
      return order === "asc"
        ? "Click to sort descending (Highest first)"
        : "Click to sort ascending (Lowest first)";
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
                minWidth: 180,
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
              <MenuItem value="lt_48">Within SLA </MenuItem>
              <MenuItem value="gt_48">Out of SLA</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <TextField
            size="small"
            placeholder="Search agent..."
            value={searchTerm}
            onChange={(e) => {
              onSearchChange(e.target.value);
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

          {/* --- RESET BUTTON ADDED HERE --- */}
          <Button
            variant="outlined"
            onClick={handleReset}
            startIcon={<RefreshIcon />}
            sx={{
              height: "40px",
              borderRadius: "8px",
              textTransform: "none",
              color: isDark ? "#e2e8f0" : "#475569",
              borderColor: isDark ? "#334155" : "#cbd5e1",
              "&:hover": {
                borderColor: "#2962ff",
                backgroundColor: isDark ? "rgba(41, 98, 255, 0.08)" : "#eff6ff",
                color: "#2962ff",
              },
            }}
          >
            Reset
          </Button>
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
        <Table size="medium" sx={{ tableLayout: "fixed" }}>
          <TableHead>
            <TableRow>
              {headCells.map((headCell) => (
                <TableCell
                  key={headCell.id}
                  sortDirection={orderBy === headCell.id ? order : false}
                  sx={{
                    bgcolor: isDark ? "#1e293b" : "#f8fafc",
                    color: isDark ? "#94a3b8" : "#64748b",
                    fontWeight: 700,
                    borderBottom: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                    whiteSpace: "nowrap",
                    width:
                      headCell.id === "agent_name"
                        ? "30%"
                        : headCell.id === "action"
                          ? "10%"
                          : "auto",
                  }}
                >
                  {headCell.sortable ? (
                    <Tooltip
                      title={getSortTooltipTitle(headCell)}
                      arrow
                      placement="top"
                    >
                      <TableSortLabel
                        active={orderBy === headCell.id}
                        direction={orderBy === headCell.id ? order : "asc"}
                        onClick={() => handleRequestSort(headCell.id)}
                        sx={{
                          "&.MuiTableSortLabel-root": {
                            color: isDark ? "#94a3b8" : "#64748b",
                          },
                          "&.MuiTableSortLabel-root:hover": {
                            color: isDark ? "#e2e8f0" : "#1e293b",
                          },
                          "&.Mui-active": {
                            color: isDark
                              ? "#fff !important"
                              : "#0f172a !important",
                          },
                          "& .MuiTableSortLabel-icon": {
                            color: isDark
                              ? "#fff !important"
                              : "#0f172a !important",
                          },
                        }}
                      >
                        {headCell.label}
                      </TableSortLabel>
                    </Tooltip>
                  ) : (
                    headCell.label
                  )}
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
            ) : sortedData.length === 0 ? (
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
              sortedData
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
        count={sortedData.length}
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
