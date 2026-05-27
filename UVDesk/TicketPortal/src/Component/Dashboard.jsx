import React, { useState } from "react";
import { Box, Grid, Typography, Stack, Tabs, Tab } from "@mui/material";

import {
  InsertChart,
  PendingActions,
  TaskAlt,
  Lock,
} from "@mui/icons-material";

import StatCard from "./StatCard";
import TicketDistribution from "./TicketDistribution";
import AgentsWiseCards from "./Agent";

const pieData = [
  { name: "Error / Bugs / Mistake", value: 881 },
  { name: "Database", value: 430 },
  { name: "Change Request", value: 256 },
  { name: "Development Task", value: 251 },
  { name: "Reports", value: 230 },
  { name: "Others", value: 397 },
];

export default function TicketDashboard() {
  const [tabValue, setTabValue] = useState(0);

  const statsData = {
    today: { open: 12, pending: 5, resolved: 18, closed: 7 },
    month: { open: 95, pending: 42, resolved: 220, closed: 66 },
    total: { open: 1245, pending: 532, resolved: 1880, closed: 950 },
  };

  const currentStats =
    tabValue === 0
      ? statsData.today
      : tabValue === 1
        ? statsData.month
        : statsData.total;

  return (
    <Box
      sx={{
        background: "#f4f7fb",
        minHeight: "100vh",
        overflowY: "hidden",
        p: { xs: 2, md: 3 },
      }}
    >
      {/* HEADER */}
      <Stack spacing={2} mb={3}>
        <Stack direction="row" justifyContent="space-between" flexWrap="wrap">
          <Stack direction="row" spacing={1.2} alignItems="center">
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: 2,
                background: "linear-gradient(135deg,#2962ff,#7c4dff)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
              }}
            >
              <InsertChart />
            </Box>

            <Typography fontWeight={800} fontSize={{ xs: 20, md: 24 }}>
              Ticket Dashboard
            </Typography>
          </Stack>

          <Stack alignItems={{ xs: "flex-start", md: "center" }}>
            <Typography fontSize={11} color="#94A3B8">
              Last Updated
            </Typography>
            <Typography fontSize={12.5}>May 13, 2025 10:45 AM</Typography>
          </Stack>
        </Stack>

        {/* TABS */}
        <Tabs
          value={tabValue}
          onChange={(e, v) => setTabValue(v)}
          sx={{
            width: "fit-content",
            background: "#fff",
            borderRadius: 999,
            p: 0.5,
            "& .MuiTabs-indicator": { display: "none" },
            "& .MuiTab-root": {
              textTransform: "none",
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 999,
              minHeight: 40,
              px: 3,
            },
            "& .Mui-selected": {
              color: "#fff !important",
              background: "linear-gradient(135deg,#2962ff,#7c4dff)",
            },
          }}
        >
          <Tab label="Today" />
          <Tab label="This Month" />
          <Tab label="Till Date" />
        </Tabs>
      </Stack>

      {/* KPI CARDS */}
      <Grid container spacing={0.9} mb={3}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Open Tickets"
            value={currentStats.open}
            color="#1877F2"
            icon={<InsertChart />}
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Pending Tickets"
            value={currentStats.pending}
            color="#FF922B"
            icon={<PendingActions />}
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Resolved Tickets"
            value={currentStats.resolved}
            color="#2EA44F"
            icon={<TaskAlt />}
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Closed Tickets"
            value={currentStats.closed}
            color="#7952B3"
            icon={<Lock />}
          />
        </Grid>
      </Grid>

      <Box sx={{ mb: 3 }}></Box>
      {/* MAIN BODY */}
      <Grid container spacing={1} alignItems="stretch">
        {/* LEFT */}
        <Grid item xs={12} md={4} >
            <TicketDistribution pieData={pieData} />
        </Grid>

        {/* RIGHT */}
        <Grid item xs={12} md={8} sx={{ml:5 ,px:1}}>
          {/* <Box sx={{ width: "100%" }}> */}
            <AgentsWiseCards />
          {/* </Box> */}
        </Grid>
      </Grid>
    </Box>
  );
}
