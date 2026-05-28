import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Stack,
  Box,
  Chip,
  TablePagination,
  CardContent,
} from "@mui/material";

import { useState } from "react";

import { SupportAgent } from "@mui/icons-material";

export default function AgenSummaryTable({ rows = [] }) {
  const [page, setPage] = useState(0);

  const [rowsPerPage, setRowsPerPage] = useState(5);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusStyle = (value, type) => {
    if (value === 0) {
      return {
        bg: "#F3F4F6",
        color: "#6B7280",
      };
    }

    switch (type) {
      case "open":
        return {
          bg: "#DCFCE7",
          color: "#15803D",
        };

      case "pending":
        return {
          bg: "#FEF3C7",
          color: "#B45309",
        };

      case "answered":
        return {
          bg: "#E0E7FF",
          color: "#4338CA",
        };

      case "resolved":
        return {
          bg: "#DBEAFE",
          color: "#1D4ED8",
        };

      case "closed":
        return {
          bg: "#FEE2E2",
          color: "#B91C1C",
        };

      default:
        return {
          bg: "#F3F4F6",
          color: "#111827",
        };
    }
  };

  const cellStyle = {
    p: "6px !important",
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <Paper
      sx={{
        p: { xs: 1, sm: 2 },
        borderRadius: 4,
        mb: 3,
        boxShadow: "0px 2px 12px rgba(15, 23, 42, 0.06)",
        overflow: "hidden",
      }}
    >
      {/* HEADER */}
      <Stack direction="row" alignItems="center" spacing={2} mb={1}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "12px",
            background: "linear-gradient(135deg,#0076F7,#0059D6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0px 4px 10px rgba(25,118,210,0.25)",
            m: 1,
          }}
        >
          <SupportAgent sx={{ color: "#fff", fontSize: 20 }} />
        </Box>
        <Typography
          sx={{
            fontSize: {
              xs: "16px",
              sm: "18px",
              md: "16px",
            },
            fontWeight: 700,
            color: "#0F172A",
          }}
        >
          Agent-wise Ticket Status Summary
        </Typography>
      </Stack>

      {/* TABLE */}
      <TableContainer
        sx={{
          borderRadius: 4,
          border: "1px solid #E2E8F0",
          overflowX: "auto",
        }}
      >
        <Table
          sx={{
            minWidth: 800,

            "& .MuiTableCell-root": {
              borderBottom: "1px solid #E2E8F0",
              p: 0,
              verticalAlign: "middle",
            },
          }}
        >
          {/* HEADER */}
          <TableHead>
            <TableRow
              sx={{
                backgroundColor: "#1976d2",
              }}
            >
              {/* AGENT */}
              <TableCell>
                <CardContent sx={cellStyle}>
                  <Typography
                    sx={{
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "12px",
                    }}
                  >
                    Agent Name
                  </Typography>
                </CardContent>
              </TableCell>

              {/* OPEN */}
              <TableCell align="center">
                <CardContent sx={cellStyle}>
                  <Typography
                    sx={{
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "12px",
                      textAlign: "center",
                    }}
                  >
                    Open
                  </Typography>
                </CardContent>
              </TableCell>

              {/* PENDING */}
              <TableCell align="center">
                <CardContent sx={cellStyle}>
                  <Typography
                    sx={{
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "12px",
                      textAlign: "center",
                    }}
                  >
                    Pending
                  </Typography>
                </CardContent>
              </TableCell>

              {/* ANSWERED */}
              <TableCell align="center">
                <CardContent sx={cellStyle}>
                  <Typography
                    sx={{
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "12px",
                      textAlign: "center",
                    }}
                  >
                    Answered
                  </Typography>
                </CardContent>
              </TableCell>

              {/* RESOLVED */}
              <TableCell align="center">
                <CardContent sx={cellStyle}>
                  <Typography
                    sx={{
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "12px",
                      textAlign: "center",
                    }}
                  >
                    Resolved
                  </Typography>
                </CardContent>
              </TableCell>

              {/* CLOSED */}
              <TableCell align="center">
                <CardContent sx={cellStyle}>
                  <Typography
                    sx={{
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "12px",
                      textAlign: "center",
                    }}
                  >
                    Closed
                  </Typography>
                </CardContent>
              </TableCell>

              {/* TOTAL */}
              <TableCell align="center">
                <CardContent sx={cellStyle}>
                  <Typography
                    sx={{
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "12px",
                      textAlign: "center",
                    }}
                  >
                    Total
                  </Typography>
                </CardContent>
              </TableCell>
            </TableRow>
          </TableHead>

          {/* BODY */}
          <TableBody
            sx={{
              "& .MuiTableRow-root:nth-of-type(even)": {
                backgroundColor: "#FAFBFC",
              },

              "& .MuiTableRow-root:hover": {
                backgroundColor: "#F1F5F9",
              },
            }}
          >
            {rows
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row, index) => (
                <TableRow key={index} hover>
                  {/* AGENT */}
                  <TableCell>
                    <CardContent sx={cellStyle}>
                      <Typography
                        sx={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#0F172A",
                        }}
                      >
                        {row.agent}
                      </Typography>
                    </CardContent>
                  </TableCell>

                  {/* OPEN */}
                  <TableCell align="center">
                    <CardContent
                      sx={{
                        ...cellStyle,
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      <Chip
                        label={row.open}
                        size="small"
                        sx={{
                          bgcolor: getStatusStyle(row.open, "open").bg,
                          color: getStatusStyle(row.open, "open").color,
                          fontWeight: 700,
                          height: 24,
                          fontSize: "11px",
                        }}
                      />
                    </CardContent>
                  </TableCell>

                  {/* PENDING */}
                  <TableCell align="center">
                    <CardContent
                      sx={{
                        ...cellStyle,
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      <Chip
                        label={row.pending}
                        size="small"
                        sx={{
                          bgcolor: getStatusStyle(row.pending, "pending").bg,
                          color: getStatusStyle(row.pending, "pending").color,
                          fontWeight: 700,
                          height: 24,
                          fontSize: "11px",
                        }}
                      />
                    </CardContent>
                  </TableCell>

                  {/* ANSWERED */}
                  <TableCell align="center">
                    <CardContent
                      sx={{
                        ...cellStyle,
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      <Chip
                        label={row.answered}
                        size="small"
                        sx={{
                          bgcolor: getStatusStyle(row.answered, "answered").bg,
                          color: getStatusStyle(row.answered, "answered").color,
                          fontWeight: 700,
                          height: 24,
                          fontSize: "11px",
                        }}
                      />
                    </CardContent>
                  </TableCell>

                  {/* RESOLVED */}
                  <TableCell align="center">
                    <CardContent
                      sx={{
                        ...cellStyle,
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      <Chip
                        label={row.resolved}
                        size="small"
                        sx={{
                          bgcolor: getStatusStyle(row.resolved, "resolved").bg,
                          color: getStatusStyle(row.resolved, "resolved").color,
                          fontWeight: 700,
                          height: 24,
                          fontSize: "11px",
                        }}
                      />
                    </CardContent>
                  </TableCell>

                  {/* CLOSED */}
                  <TableCell align="center">
                    <CardContent
                      sx={{
                        ...cellStyle,
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      <Chip
                        label={row.closed}
                        size="small"
                        sx={{
                          bgcolor: getStatusStyle(row.closed, "closed").bg,
                          color: getStatusStyle(row.closed, "closed").color,
                          fontWeight: 700,
                          height: 24,
                          fontSize: "11px",
                        }}
                      />
                    </CardContent>
                  </TableCell>

                  {/* TOTAL */}
                  <TableCell align="center">
                    <CardContent sx={cellStyle}>
                      <Typography
                        sx={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#0F172A",
                          textAlign: "center",
                        }}
                      >
                        {row.total}
                      </Typography>
                    </CardContent>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* PAGINATION */}
      <TablePagination
        component="div"
        count={rows.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
        sx={{
          ".MuiTablePagination-toolbar": {
            minHeight: "42px",
          },
        }}
      />
    </Paper>
  );
}
