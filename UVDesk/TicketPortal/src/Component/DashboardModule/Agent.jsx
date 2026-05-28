import React, { useMemo, useState } from "react";
import {
  Paper,
  Stack,
  Avatar,
  Typography,
  Box,
  TextField,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import {
  FolderOpen,
  PendingActions,
  CheckCircle,
  Lock,
} from "@mui/icons-material";

const colors = [
  "#2962ff",
  "#00a152",
  "#7c4dff",
  "#ff9100",
  "#1976d2",
  "#ff2d78",
];

/* ---------------- CARD ---------------- */
const TicketTypeCard = ({ item, tabValue, index }) => {
  const currentKey =
    tabValue === 0 ? "today" : tabValue === 1 ? "this_month" : "till_date";

  const shortName =
    item.agent_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "NA";

  const color = colors[index % colors.length];

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "16px",
        border: "1px solid #E2E8F0",
        p: 1.5,
        minHeight: 220,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        transition: "0.2s",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: "0 10px 20px rgba(0,0,0,0.05)",
        },
      }}
    >
      {/* AVATAR CENTER */}
      <Stack
        alignItems="center"
        spacing={0.5}
        sx={{
          width: "100%",
          textAlign: "center",
        }}
      >
        {/* AVATAR WRAPPER (forces perfect center) */}
        <Box
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Avatar
            sx={{
              width: 48,
              height: 48,
              bgcolor: `${color}15`,
              color: color,
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            {shortName}
          </Avatar>
        </Box>

        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 700,
            color: "#111827",
            textAlign: "center",
          }}
        >
          {item.agent_name || "Unassigned"}
        </Typography>

        <Typography sx={{ fontSize: 10, color: "#6B7280" }}>
          Support Agent
        </Typography>
      </Stack>

      {/* STATUS */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 0.5,
          mt: 1.5,
          textAlign: "center",
        }}
      >
        {[
          {
            icon: <FolderOpen />,
            label: "Open",
            value: item.open?.[currentKey],
            color: "#1877F2",
          },
          {
            icon: <PendingActions />,
            label: "Pending",
            value: item.pending?.[currentKey],
            color: "#FF922B",
          },
          {
            icon: <CheckCircle />,
            label: "Resolved",
            value: item.resolved?.[currentKey],
            color: "#2EA44F",
          },
          {
            icon: <Lock />,
            label: "Closed",
            value: item.closed?.[currentKey],
            color: "#7952B3",
          },
        ].map((s, i) => (
          <Stack key={i} alignItems="center">
            <Box sx={{ color: s.color, fontSize: 16 }}>{s.icon}</Box>
            <Typography sx={{ fontSize: 13, fontWeight: 800 }}>
              {s.value || 0}
            </Typography>
            <Typography sx={{ fontSize: 10, color: "#6B7280" }}>
              {s.label}
            </Typography>
          </Stack>
        ))}
      </Box>

      {/* TOTAL */}
      <Box sx={{ mt: 1.5, textAlign: "center" }}>
        <Typography sx={{ fontSize: 12, fontWeight: 700 }}>
          Total: {item.total_tickets || 0}
        </Typography>
      </Box>
    </Paper>
  );
};

/* ---------------- MAIN ---------------- */
export default function AgentsWiseCards({ agentData = [], tabValue = 0 }) {
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);

  const filteredAgents = useMemo(() => {
    return agentData.filter((a) =>
      (a.agent_name || "").toLowerCase().includes(search.toLowerCase()),
    );
  }, [agentData, search]);

  // 👉 ONLY 2 ROWS INITIALLY
  const visibleAgents = showAll ? filteredAgents : filteredAgents.slice(0, 4); // 2 rows approx (grid)

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "20px",
        border: "1px solid #E2E8F0",
        p: 2,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* HEADER ROW (TITLE + SEARCH SAME LINE) */}
      <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
        {/* LEFT TITLE */}
        <Typography sx={{ fontSize: 15, fontWeight: 800 }}>
          Agent Wise Tickets
        </Typography>

        {/* RIGHT SEARCH */}
        <Box sx={{ ml: "auto" }}>
          <TextField
            size="small"
            placeholder="Search agent..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              width: 220,
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                background: "#F8FAFC",
                fontSize: 13,
              },
            }}
          />
        </Box>
      </Stack>

      {/* VIEW ALL RIGHT SIDE */}
      <Stack
        direction="row"
        justifyContent="flex-end"
        alignItems="center"
        sx={{ mt: 1 }}
      >
        <Box
          onClick={() => setShowAll(!showAll)}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5, // 👈 arrow + text spacing
            cursor: "pointer",
            fontSize: 12,
            color: "#64748B",
            fontWeight: 600,
            userSelect: "none",
            "&:hover": { color: "#334155" },
          }}
        >
          {showAll ? (
            <>
              <ExpandLessIcon sx={{ fontSize: 16 }} />
              Show Less
            </>
          ) : (
            <>
              <ExpandMoreIcon sx={{ fontSize: 16 }} />
              View All Agents
            </>
          )}
        </Box>
      </Stack>

      {/* GRID */}
      <Box
        sx={{
          mt: 1.5,
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2,1fr)",
            lg: "repeat(3,1fr)",
            xl: "repeat(4,1fr)",
          },
          gap: 2,
        }}
      >
        {visibleAgents.map((item, index) => (
          <TicketTypeCard
            key={index}
            item={item}
            index={index}
            tabValue={tabValue}
          />
        ))}
      </Box>
    </Paper>
  );
}
