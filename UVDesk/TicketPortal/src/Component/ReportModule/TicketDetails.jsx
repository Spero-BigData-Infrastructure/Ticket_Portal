import React, { useState } from "react";

import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Stack,
  Chip,
  CardContent,
  TablePagination,
} from "@mui/material";

import { Assignment } from "@mui/icons-material";

export default function TicketDetails({ rows }) {
  const [page, setPage] = useState(0);

  const [rowsPerPage, setRowsPerPage] = useState(5);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusStyles = (status) => {
    switch (status?.toLowerCase()) {
      case "open":
        return {
          bg: "#DCFCE7",
          color: "#15803D",
        };

      case "pending":
        return {
          bg: "#FEF3C7",
          color: "#D97706",
        };

      case "answered":
        return {
          bg: "#EDE9FE",
          color: "#7C3AED",
        };

      case "resolved":
        return {
          bg: "#CCFBF1",
          color: "#0F766E",
        };

      default:
        return {
          bg: "#F1F5F9",
          color: "#475569",
        };
    }
  };

  const cellContentStyle = {
    p: "8px !important",
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <Paper
      elevation={0}
      sx={{
        width: "100%",
        borderRadius: "14px",
        border: "1px solid #E2E8F0",
        overflow: "hidden",
        background: "#fff",
        boxShadow: "0 4px 18px rgba(15,23,42,0.05)",
        // mb: 3,
        p: 1.5,
        boxSizing: "border-box",
      }}
    >
      {/* HEADER */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={2}
        sx={{
          px: 2,
          py: 1,
          borderBottom: "1px solid #EEF2F7",
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "10px",
            background: "linear-gradient(135deg,#0076F7,#0059D6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
          }}
        >
          <Assignment sx={{ fontSize: 18 }} />
        </Box>

        <Typography
          sx={{
            fontSize: "16px",
            fontWeight: 700,
            color: "#0F172A",
          }}
        >
          Ticket Details
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
            minWidth: 1600,
            tableLayout: "fixed",
            "& .MuiTableCell-root": {
              borderBottom: "1px solid #E2E8F0",
              verticalAlign: "middle",
              p: 0,
            },
          }}
        >
          {/* ================= HEADER ================= */}
          <TableHead>
            <TableRow
              sx={{
                backgroundColor: "#1976d2",
              }}
            >
              {/* TICKET ID */}
              <TableCell sx={{ width: 110 }}>
                <CardContent sx={cellContentStyle}>
                  <Typography
                    sx={{
                      color: "#FFFFFF",
                      fontSize: "12px",
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Ticket ID
                  </Typography>
                </CardContent>
              </TableCell>

              {/* ISSUE */}
              <TableCell sx={{ width: 280 }}>
                <CardContent sx={cellContentStyle}>
                  <Typography
                    sx={{
                      color: "#FFFFFF",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    Issue
                  </Typography>
                </CardContent>
              </TableCell>

              {/* ADDED BY */}
              <TableCell sx={{ width: 170 }}>
                <CardContent sx={cellContentStyle}>
                  <Typography
                    sx={{
                      color: "#FFFFFF",
                      fontSize: "12px",
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Added By
                  </Typography>
                </CardContent>
              </TableCell>

              {/* ADDED DATE */}
              <TableCell sx={{ width: 150 }}>
                <CardContent sx={cellContentStyle}>
                  <Typography
                    sx={{
                      color: "#FFFFFF",
                      fontSize: "12px",
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      textAlign: "center",
                    }}
                  >
                    Added Date
                  </Typography>
                </CardContent>
              </TableCell>

              {/* PROJECT */}
              <TableCell sx={{ width: 140 }}>
                <CardContent sx={cellContentStyle}>
                  <Typography
                    sx={{
                      color: "#FFFFFF",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    Project
                  </Typography>
                </CardContent>
              </TableCell>

              {/* TYPE */}
              <TableCell sx={{ width: 180 }}>
                <CardContent sx={cellContentStyle}>
                  <Typography
                    sx={{
                      color: "#FFFFFF",
                      fontSize: "12px",
                      fontWeight: 700,
                      textAlign: "center",
                    }}
                  >
                    Type
                  </Typography>
                </CardContent>
              </TableCell>

              {/* ASSIGNED TO */}
              <TableCell sx={{ width: 170 }}>
                <CardContent sx={cellContentStyle}>
                  <Typography
                    sx={{
                      color: "#FFFFFF",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    Assigned To
                  </Typography>
                </CardContent>
              </TableCell>

              {/* STATUS */}
              <TableCell sx={{ width: 120 }}>
                <CardContent sx={cellContentStyle}>
                  <Typography
                    sx={{
                      color: "#FFFFFF",
                      fontSize: "12px",
                      fontWeight: 700,
                      textAlign: "center",
                    }}
                  >
                    Status
                  </Typography>
                </CardContent>
              </TableCell>

              {/* UPDATED DATE */}
              <TableCell sx={{ width: 150 }}>
                <CardContent sx={cellContentStyle}>
                  <Typography
                    sx={{
                      color: "#FFFFFF",
                      fontSize: "12px",
                      fontWeight: 700,
                      textAlign: "center",
                    }}
                  >
                    Updated Date
                  </Typography>
                </CardContent>
              </TableCell>

              {/* CLOSED DATE */}
              <TableCell sx={{ width: 150 }}>
                <CardContent sx={cellContentStyle}>
                  <Typography
                    sx={{
                      color: "#FFFFFF",
                      fontSize: "12px",
                      fontWeight: 700,
                      textAlign: "center",
                    }}
                  >
                    Closed Date
                  </Typography>
                </CardContent>
              </TableCell>

              {/* SLA DAYS */}
              <TableCell sx={{ width: 100 }}>
                <CardContent sx={cellContentStyle}>
                  <Typography
                    sx={{
                      color: "#FFFFFF",
                      fontSize: "12px",
                      fontWeight: 700,
                      textAlign: "center",
                    }}
                  >
                    SLA Days
                  </Typography>
                </CardContent>
              </TableCell>

              {/* SLA HOURS */}
              <TableCell sx={{ width: 100 }}>
                <CardContent sx={cellContentStyle}>
                  <Typography
                    sx={{
                      color: "#FFFFFF",
                      fontSize: "12px",
                      fontWeight: 700,
                      textAlign: "center",
                    }}
                  >
                    SLA Hours
                  </Typography>
                </CardContent>
              </TableCell>
            </TableRow>
          </TableHead>

          {/* ================= BODY ================= */}
          <TableBody>
            {rows
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row, index) => {
                const statusStyle = getStatusStyles(row.status);

                return (
                  <TableRow
                    key={index}
                    hover
                    sx={{
                      "& td": {
                        verticalAlign: "middle",
                      },
                    }}
                  >
                    {/* TICKET ID */}
                    <TableCell>
                      <CardContent sx={cellContentStyle}>
                        <Typography
                          sx={{
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "#0F172A",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {row.ticket_id}
                        </Typography>
                      </CardContent>
                    </TableCell>

                    {/* ISSUE */}
                    <TableCell>
                      <CardContent sx={cellContentStyle}>
                        <Typography
                          sx={{
                            fontSize: "12px",
                            color: "#1E293B",
                            wordBreak: "break-word",
                            whiteSpace: "normal",
                            lineHeight: 1.5,
                          }}
                        >
                          {row.issue}
                        </Typography>
                      </CardContent>
                    </TableCell>

                    {/* ADDED BY */}
                    <TableCell>
                      <CardContent sx={cellContentStyle}>
                        <Typography
                          sx={{
                            fontSize: "12px",
                            color: "#1E293B",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {row.added_by}
                        </Typography>
                      </CardContent>
                    </TableCell>

                    {/* ADDED DATE */}
                    <TableCell>
                      <CardContent sx={cellContentStyle}>
                        <Typography
                          sx={{
                            fontSize: "11px",
                            color: "#475569",
                            whiteSpace: "nowrap",
                            textAlign: "center",
                          }}
                        >
                          {row.added_date}
                        </Typography>
                      </CardContent>
                    </TableCell>

                    {/* PROJECT */}
                    <TableCell>
                      <CardContent sx={cellContentStyle}>
                        <Typography
                          sx={{
                            fontSize: "12px",
                            color: "#1E293B",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {row.project || "-"}
                        </Typography>
                      </CardContent>
                    </TableCell>

                    {/* TYPE */}
                    <TableCell>
                      <CardContent sx={cellContentStyle}>
                        <Typography
                          sx={{
                            fontSize: "11px",
                            color: "#334155",
                            textAlign: "center",
                            wordBreak: "break-word",
                          }}
                        >
                          {row.type || "-"}
                        </Typography>
                      </CardContent>
                    </TableCell>

                    {/* ASSIGNED TO */}
                    <TableCell>
                      <CardContent sx={cellContentStyle}>
                        <Typography
                          sx={{
                            fontSize: "12px",
                            color: "#1E293B",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {row.assigned_to}
                        </Typography>
                      </CardContent>
                    </TableCell>

                    {/* STATUS */}
                    <TableCell>
                      <CardContent
                        sx={{
                          ...cellContentStyle,
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        <Chip
                          label={row.status}
                          size="small"
                          sx={{
                            background: statusStyle.bg,
                            color: statusStyle.color,
                            fontWeight: 700,
                            fontSize: "10px",
                            height: 22,
                            borderRadius: "6px",
                            minWidth: 75,
                          }}
                        />
                      </CardContent>
                    </TableCell>

                    {/* UPDATED DATE */}
                    <TableCell>
                      <CardContent sx={cellContentStyle}>
                        <Typography
                          sx={{
                            fontSize: "11px",
                            color: "#475569",
                            whiteSpace: "nowrap",
                            textAlign: "center",
                          }}
                        >
                          {row.updated_date}
                        </Typography>
                      </CardContent>
                    </TableCell>

                    {/* CLOSED DATE */}
                    <TableCell>
                      <CardContent sx={cellContentStyle}>
                        <Typography
                          sx={{
                            fontSize: "11px",
                            color: "#475569",
                            whiteSpace: "nowrap",
                            textAlign: "center",
                          }}
                        >
                          {row.closed_date || "-"}
                        </Typography>
                      </CardContent>
                    </TableCell>

                    {/* SLA DAYS */}
                    <TableCell>
                      <CardContent sx={cellContentStyle}>
                        <Typography
                          sx={{
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "#0F172A",
                            textAlign: "center",
                          }}
                        >
                          {row.sla_days}
                        </Typography>
                      </CardContent>
                    </TableCell>

                    {/* SLA HOURS */}
                    <TableCell>
                      <CardContent sx={cellContentStyle}>
                        <Typography
                          sx={{
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "#0F172A",
                            textAlign: "center",
                          }}
                        >
                          {row.sla_hours}
                        </Typography>
                      </CardContent>
                    </TableCell>
                  </TableRow>
                );
              })}
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
            minHeight: "48px",
          },
        }}
      />
    </Paper>
  );
}
