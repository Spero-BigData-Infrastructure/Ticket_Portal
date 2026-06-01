import React, { useEffect, useState } from "react";

import { Box, Typography, Stack, Tabs, Tab, Button } from "@mui/material";

import {
  InsertChart,
  PendingActions,
  TaskAlt,
  Lock,
} from "@mui/icons-material";

import StatCard from "./StatCard";
import TicketDistribution from "./TicketDistribution";
import AgentsWiseCards from "./Agent";
import { AssessmentOutlined } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";



export default function TicketDashboard() {
  const [tabValue, setTabValue] = useState(0);

  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  console.log("dashboard", dashboardData);

  const [agentData, setAgentData] = useState([]);
  console.log("agents", agentData);

  /* ---------------- WEBSOCKET ---------------- */

  useEffect(() => {
    const dashboardSocket = new WebSocket(
      "ws://192.168.1.204:8558/ws/uvdesk_dashboard",
    );

    dashboardSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      setDashboardData(data);
    };

    dashboardSocket.onerror = (err) => {
      console.log("Dashboard WS Error", err);
    };

    dashboardSocket.onclose = () => {
      console.log("Dashboard socket closed");
    };

    return () => {
      dashboardSocket.close();
    };
  }, []);

  /* ---------------- AGENT SOCKET ---------------- */

  useEffect(() => {
    const agentSocket = new WebSocket(
      "ws://192.168.1.204:8558/ws/agent-summary",
    );

    agentSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      console.log("agents", data.agent_wise_ticket_summary);

      setAgentData(data.agent_wise_ticket_summary || []);
    };

    agentSocket.onerror = (err) => {
      console.log("Agent WS Error", err);
    };

    agentSocket.onclose = () => {
      console.log("Agent socket closed");
    };

    return () => {
      agentSocket.close();
    };
  }, []);

  /* ---------------- TAB KEY ---------------- */

  const tabKey =
    tabValue === 0 ? "today" : tabValue === 1 ? "this_month" : "till_date";

  /* ---------------- KPI DATA ---------------- */

  const currentStats = {
    open: dashboardData?.open_tickets?.[tabKey] || 0,

    pending: dashboardData?.pending_tickets?.[tabKey] || 0,

    resolved: dashboardData?.resolved_tickets?.[tabKey] || 0,

    closed: dashboardData?.closed_tickets?.[tabKey] || 0,
  };

  /* ---------------- PIE DATA ---------------- */

  const pieData =
    dashboardData?.ticket_type_summary?.map((item) => ({
      name: item.ticket_type,
      value: Number(item?.[tabKey] || 0),
    })) || [];

  /* ---------------- AGENT DATA ---------------- */

  const formattedAgents = agentData.map((agent, index) => ({
    name: agent.agent_name || "Unassigned",

    short: (agent.agent_name || "UA")
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2),

    open: agent.open?.[tabKey] || 0,

    pending: agent.pending?.[tabKey] || 0,

    resolved: agent.resolved?.[tabKey] || 0,

    closed: agent.closed?.[tabKey] || 0,

    total: agent.total_tickets || 0,

    color: ["#2962ff", "#7c4dff", "#00a152", "#ff9100", "#1976d2", "#ff2d78"][
      index % 6
    ],
  }));

  return (
    <Box
      sx={{
        background: "#f4f7fb",
        minHeight: "100vh",
        p: { xs: 2, md: 2 },
        overflowX: "hidden",
        overflowY: "hidden",
        boxSizing: "border-box",
        width: "100%",
      }}
    >
      {/* HEADER */}
      <Stack spacing={1} mb={2}>
        <Stack direction="row" justifyContent="space-between" flexWrap="wrap">
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{
              minHeight: 40,
            }}
          >
           

            
          </Stack>
        </Stack>
        {/* TABS */}
        <Stack
          direction="row"
          alignItems="center"
          sx={{
            width: "100%",
            mb: 2,
          }}
        >
          {/* LEFT TABS */}
          <Tabs
            value={tabValue}
            onChange={(e, v) => setTabValue(v)}
            sx={{
              width: "fit-content",
              background: "#fff",
              borderRadius: "999px",
              minHeight: 50,

              "& .MuiTabs-flexContainer": {
                gap: 1,
                alignItems: "center",
              },

              "& .MuiTabs-indicator": {
                display: "none",
              },

              "& .MuiTab-root": {
                textTransform: "none",
                fontSize: 13,
                fontWeight: 700,
                borderRadius: "999px",
                minHeight: 40,
                px: 2,
                color: "#64748B",
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

          {/* RIGHT END BUTTON */}
          <Button
            variant="contained"
            startIcon={<AssessmentOutlined />}
            onClick={() => navigate("/report-module")}
            sx={{
              ml: "auto", // PUSH TO RIGHT END
              height: 42,
              borderRadius: "12px",
              textTransform: "none",
              fontSize: "13px",
              fontWeight: 700,
              px: 2.5,
              background: "linear-gradient(135deg,#2962ff,#7c4dff)",
              boxShadow: "none",

              "&:hover": {
                boxShadow: "none",
                background: "linear-gradient(135deg,#1e4fff,#6d3dff)",
              },
            }}
          >
            Check Report
          </Button>
        </Stack>
      </Stack>

      {/* KPI */}
      <Box
        sx={{
          display: "grid",

          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2,1fr)",
            md: "repeat(2,1fr)",
            lg: "repeat(4,1fr)",
          },

          gap: {
            xs: 1.5,
            sm: 2,
          },

          mb: 2,
        }}
      >
        <StatCard
          title="Open Tickets"
          value={currentStats.open}
          color="#1877F2"
          fontSize={14}
          icon={<InsertChart />}
        />

        <StatCard
          title="Pending Tickets"
          value={currentStats.pending}
          color="#FF922B"
          icon={<PendingActions />}
        />

        <StatCard
          title="Resolved Tickets"
          value={currentStats.resolved}
          color="#2EA44F"
          icon={<TaskAlt />}
        />

        <StatCard
          title="Closed Tickets"
          value={currentStats.closed}
          color="#7952B3"
          icon={<Lock />}
        />
      </Box>

      {/* MAIN */}
      <Box
        sx={{
          display: "grid",

          gridTemplateColumns: {
            xs: "1fr",
            lg: "380px 1fr",
          },
          gap: 4.5,
          alignItems: "start",
        }}
      >
        {/* LEFT */}
        <Box>
          <TicketDistribution pieData={pieData} />
        </Box>

        {/* RIGHT */}
        <Box sx={{ minWidth: 0 }}>
          <AgentsWiseCards agentData={agentData} tabValue={tabValue} />
        </Box>
      </Box>
    </Box>
  );
}
