// TicketSummarySection.jsx

import React from "react";

import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { InputBase, Paper } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import {
  ConfirmationNumberOutlined,
  FolderOpenOutlined,
  AccessTimeOutlined,
  ChatBubbleOutlineOutlined,
  CheckCircleOutlineOutlined,
  LockOutlined,
  FilterAlt,
  FileDownload,
  Person,
  AssessmentOutlined,
  ArrowBack,
} from "@mui/icons-material";
import { API_BASE_URL } from "../../config";
import { useNavigate } from "react-router-dom";

export default function TicketSummarySection({
  fromDate,
  toDate,
  searchText,
  setSearchText,
  setFromDate,
  setToDate,
  getReportData,
  ticketDetails = [],
}) {
  // =========================
  // DYNAMIC COUNTS
  // =========================
  const totalTickets = ticketDetails.length;

  const openCount = ticketDetails.filter(
    (item) => item.status === "Open",
  ).length;

  const pendingCount = ticketDetails.filter(
    (item) => item.status === "Pending",
  ).length;

  const answeredCount = ticketDetails.filter(
    (item) => item.status === "Answered",
  ).length;

  const resolvedCount = ticketDetails.filter(
    (item) => item.status === "Resolved",
  ).length;

  const closedCount = ticketDetails.filter(
    (item) => item.status === "Closed",
  ).length;
  const navigate = useNavigate();

  const ticketData = [
    {
      title: "Total Tickets",
      count: totalTickets,
      color: "#2563EB",
      bg: "rgba(37, 99, 235, 0.10)",
      border: "rgba(37, 99, 235, 0.18)",
      icon: <ConfirmationNumberOutlined />,
    },

    {
      title: "Open",
      count: openCount,
      color: "#16A34A",
      bg: "rgba(22, 163, 74, 0.10)",
      border: "rgba(22, 163, 74, 0.18)",
      icon: <FolderOpenOutlined />,
    },

    {
      title: "Pending",
      count: pendingCount,
      color: "#F59E0B",
      bg: "rgba(245, 158, 11, 0.10)",
      border: "rgba(245, 158, 11, 0.18)",
      icon: <AccessTimeOutlined />,
    },

    {
      title: "Answered",
      count: answeredCount,
      color: "#7C3AED",
      bg: "rgba(124, 58, 237, 0.10)",
      border: "rgba(124, 58, 237, 0.18)",
      icon: <ChatBubbleOutlineOutlined />,
    },

    {
      title: "Resolved",
      count: resolvedCount,
      color: "#0F766E",
      bg: "rgba(15, 118, 110, 0.10)",
      border: "rgba(15, 118, 110, 0.18)",
      icon: <CheckCircleOutlineOutlined />,
    },

    {
      title: "Closed",
      count: closedCount,
      color: "#E11D48",
      bg: "rgba(225, 29, 72, 0.10)",
      border: "rgba(225, 29, 72, 0.18)",
      icon: <LockOutlined />,
    },
  ];
  const handleDownload = () => {
    if (!fromDate || !toDate) return;

    const url = `http://192.168.1.204:8558/api/download/uvdesk-report?from_date=${fromDate}&to_date=${toDate}`;

    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.click();
  };
  return (
    <Box
      sx={{
        p: { xs: 1.5, md: 2 },
        borderRadius: 3,
        background: "#fff",
      }}
    >
      {/* ================= HEADER ================= */}
      <>
        {/* ================= ROW 1: TITLE ONLY ================= */}
        <Grid container alignItems="center" sx={{ mb: 1.5 }}>
          <Grid item xs={12}>
            <Stack direction="row" alignItems="center" spacing={1}>
              {/* BACK ICON */}
              <Box
                onClick={() => navigate(-1)}
                sx={{
                  cursor: "pointer",
                  width: 38,
                  height: 38,
                  borderRadius: "10px",
                  background: "rgba(37, 99, 235, 0.10)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ArrowBack sx={{ color: "#2563EB", fontSize: 22 }} />
              </Box>

              {/* TITLE */}
              <Typography
                sx={{
                  fontSize: { xs: "16px", md: "20px" },
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                UVdesk Ticket Master Report
              </Typography>
            </Stack>
          </Grid>
        </Grid>

        {/* ================= ROW 2: FILTERS + BUTTONS ================= */}
        <Grid container spacing={1.5} alignItems="center">
          {/* DATE FILTER */}
          <Grid item xs={12} md={6} lg={4}>
            <Stack direction="row" spacing={1}>
              <TextField
                fullWidth
                size="small"
                type="date"
                value={fromDate ?? ""}
                onChange={(e) => setFromDate(e.target.value || null)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    background: "#fff",
                  },
                }}
              />

              <TextField
                fullWidth
                size="small"
                type="date"
                value={toDate ?? ""}
                onChange={(e) => setToDate(e.target.value || null)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    background: "#fff",
                  },
                }}
              />
            </Stack>
          </Grid>

          {/* BUTTONS */}
          <Grid item xs={12} lg={8}>
            <Stack
              direction="row"
              spacing={1}
              flexWrap="wrap"
              useFlexGap
              justifyContent={{ xs: "flex-start", lg: "flex-end" }}
            >
              <Button
                variant="contained"
                onClick={handleDownload}
                startIcon={<FilterAlt />}
              >
                Download Report
              </Button>

              <Button variant="contained" startIcon={<FileDownload />}>
                Export Excel
              </Button>

              <Button variant="contained" startIcon={<Person />}>
                Export Agent Report
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </>
      <Box sx={{ height: 20 }} />

      {/* ================= KPI CARDS ================= */}

      <Grid container spacing={1.5}>
        {ticketData.map((item, index) => (
          <Grid item key={index} xs={12} sm={6} md={4} lg={2}>
            <Card
              elevation={0}
              sx={{
                height: "100%",
                borderRadius: "12px",
                border: `1px solid ${item.border}`,
                backgroundColor: "#FFFFFF",
                transition: "0.2s",

                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0px 4px 18px rgba(0,0,0,0.06)",
                },
              }}
            >
              <CardContent
                sx={{
                  p: "14px !important",
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  {/* ICON */}
                  <Avatar
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      backgroundColor: item.bg,
                      color: item.color,
                      flexShrink: 0,

                      "& svg": {
                        fontSize: 21,
                      },
                    }}
                  >
                    {item.icon}
                  </Avatar>

                  {/* TEXT */}
                  <Box flex={1} minWidth={0}>
                    <Typography
                      sx={{
                        fontSize: "12px",
                        fontWeight: 500,
                        color: "#4A5568",
                        lineHeight: 1.1,
                      }}
                    >
                      {item.title}
                    </Typography>

                    <Typography
                      sx={{
                        fontSize: "24px",
                        fontWeight: 700,
                        color: "#111827",
                        lineHeight: 1.2,
                        mt: 0.3,
                      }}
                    >
                      {item.count}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Box sx={{ display: "flex", justifyContent: "flex-end", flex: 1 }}>
        <Paper
          sx={{
            display: "flex",
            alignItems: "center",
            px: 1.5,
            py: 0.5,
            borderRadius: 2,
            width: 260,
            boxShadow: "0px 2px 6px rgba(0,0,0,0.06)",
            border: "1px solid rgba(0,0,0,0.1)",
          }}
        >
          <SearchIcon sx={{ fontSize: 18, color: "#64748B" }} />

          <InputBase
            placeholder="Search by Ticket ID / Agent / Assigned To"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            sx={{ ml: 1, fontSize: "13px", width: "100%" }}
          />
        </Paper>
      </Box>
    </Box>
  );
}
