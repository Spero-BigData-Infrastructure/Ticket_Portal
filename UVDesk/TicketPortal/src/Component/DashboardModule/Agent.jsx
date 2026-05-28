import React, { useMemo, useState } from "react";

import {
  Paper,
  Stack,
  Avatar,
  Typography,
  Box,
  TextField,
  InputAdornment,
} from "@mui/material";

import {
  FolderOpen,
  PendingActions,
  CheckCircle,
  Lock,
  Search,
} from "@mui/icons-material";

const colors = [
  "#2962ff",
  "#00a152",
  "#7c4dff",
  "#ff9100",
  "#1976d2",
  "#ff2d78",
];

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
        overflow: "hidden",
        background: "#fff",
        border: "1px solid #EFEFEF",
        borderRadius: "18px",
        p: 1.2,
        height: "100%",
        minHeight: 230,
        transition: "all 0.3s ease",
        boxShadow: "0 4px 20px rgba(15, 23, 42, 0.04)",

        "&:hover": {
          transform: "translateY(-5px)",
          boxShadow: "0 14px 35px rgba(15, 23, 42, 0.08)",
        },
      }}
    >
      <Stack
        spacing={1.2}
        alignItems="center"
        justifyContent="center"
        sx={{
          width: "100%",
          textAlign: "center",
          height: "100%",
        }}
      >
        {/* AVATAR CENTER */}
        <Box
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Avatar
            sx={{
              width: 50,
              height: 50,
              bgcolor: `${color}20`,
              color: color,
              fontSize: "16px",
              fontWeight: 800,
              boxShadow: `0 8px 20px ${color}25`,
            }}
          >
            {shortName}
          </Avatar>
        </Box>

        {/* NAME */}
        <Box
          sx={{
            width: "100%",
            textAlign: "center",
          }}
        >
          <Typography
            sx={{
              fontSize: "14px",
              fontWeight: 700,
              color: "#1A1D20",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {item.agent_name || "Unassigned"}
          </Typography>

          <Typography
            sx={{
              mt: 0.2,
              fontSize: "11px",
              color: "#6C757D",
            }}
          >
            Support Agent
          </Typography>
        </Box>

        {/* STATUS */}
        <Box
          sx={{
            width: "100%",
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0,1fr))",
            gap: 0.8,
            mt: 0.5,
          }}
        >
          {/* OPEN */}
          <Stack spacing={0.4} alignItems="center">
            <FolderOpen
              sx={{
                fontSize: 16,
                color: "#1877F2",
              }}
            />

            <Typography
              sx={{
                fontSize: "15px",
                fontWeight: 800,
                lineHeight: 1,
              }}
            >
              {item.open?.[currentKey] || 0}
            </Typography>

            <Typography
              sx={{
                fontSize: "10px",
                color: "#6C757D",
              }}
            >
              Open
            </Typography>
          </Stack>

          {/* PENDING */}
          <Stack spacing={0.4} alignItems="center">
            <PendingActions
              sx={{
                fontSize: 16,
                color: "#FF922B",
              }}
            />

            <Typography
              sx={{
                fontSize: "15px",
                fontWeight: 800,
                lineHeight: 1,
              }}
            >
              {item.pending?.[currentKey] || 0}
            </Typography>

            <Typography
              sx={{
                fontSize: "10px",
                color: "#6C757D",
              }}
            >
              Pending
            </Typography>
          </Stack>

          {/* RESOLVED */}
          <Stack spacing={0.4} alignItems="center">
            <CheckCircle
              sx={{
                fontSize: 16,
                color: "#2EA44F",
              }}
            />

            <Typography
              sx={{
                fontSize: "15px",
                fontWeight: 800,
                lineHeight: 1,
              }}
            >
              {item.resolved?.[currentKey] || 0}
            </Typography>

            <Typography
              sx={{
                fontSize: "10px",
                color: "#6C757D",
              }}
            >
              Resolved
            </Typography>
          </Stack>

          {/* CLOSED */}
          <Stack spacing={0.4} alignItems="center">
            <Lock
              sx={{
                fontSize: 16,
                color: "#7952B3",
              }}
            />

            <Typography
              sx={{
                fontSize: "15px",
                fontWeight: 800,
                lineHeight: 1,
              }}
            >
              {item.closed?.[currentKey] || 0}
            </Typography>

            <Typography
              sx={{
                fontSize: "10px",
                color: "#6C757D",
              }}
            >
              Closed
            </Typography>
          </Stack>
        </Box>

        {/* TOTAL CENTER */}
        <Box
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            mt: 0.5,
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            justifyContent="center"
          >
            <Typography
              sx={{
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              Total
            </Typography>

            <Box
              sx={{
                px: 1.5,
                borderRadius: "20px",
                background: `linear-gradient(
            135deg,
            ${color} 0%,
            ${color}DD 100%
          )`,

                color: "#fff",
                fontSize: "12px",
                fontWeight: 800,
                boxShadow: `0 8px 18px ${color}35`,
              }}
            >
              {item.total_tickets || 0}
            </Box>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
};

export default function AgentsWiseCards({ agentData = [], tabValue = 0 }) {
  const [search, setSearch] = useState("");

  const filteredAgents = useMemo(() => {
    return agentData.filter((agent) =>
      (agent.agent_name || "Unassigned")
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  }, [agentData, search]);

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "24px",
        border: "1px solid #eef2f7",
        background: "#fff",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
        p: 1.2,
        minHeight: 200,
        height: {
          xs: "auto",
          md: 800,
        },

        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* HEADER */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
        gap={2}
       
      >
        <Box>
          <Typography
            sx={{
              fontSize: "18px",
              fontWeight: 800,
              color: "#0A1128",
            }}
          >
            Agent Wise Tickets
          </Typography>
        </Box>

        {/* SEARCH */}
        <TextField
          placeholder="Search agent..."
          size="small"
          variant="outlined"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            padding:1,
            ml: "auto",
            width: {
              xs: "100%",
              sm: 220,
            },

            "& .MuiOutlinedInput-root": {
              height: 36,
              borderRadius: "10px",
              background: "#F5F7FB",

              pr: 1,

              "& fieldset": {
                borderColor: "#E2E8F0",
              },

              "&:hover fieldset": {
                borderColor: "#CBD5E1",
              },

              "&.Mui-focused fieldset": {
                borderColor: "#94A3B8",
              },
            },

            "& .MuiInputBase-input": {
              fontSize: "13px",
              color: "#475569",
              py: 0.8,
            },

            "& .MuiInputBase-input::placeholder": {
              color: "#94A3B8",
              opacity: 1,
            },
          }}
        />
      </Stack>

      {/* SCROLLABLE GRID */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          pr: 1,

          "&::-webkit-scrollbar": {
            width: "6px",
          },

          "&::-webkit-scrollbar-thumb": {
            background: "#CBD5E1",
            borderRadius: "10px",
          },

          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
        }}
      >
        <Box
          sx={{
            display: "grid",

            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)",
              xl: "repeat(4, 1fr)",
            },

            gap: 3,
          }}
        >
          {filteredAgents.map((item, index) => (
            <TicketTypeCard
              key={index}
              item={item}
              index={index}
              tabValue={tabValue}
            />
          ))}
        </Box>
      </Box>
    </Paper>
  );
}
