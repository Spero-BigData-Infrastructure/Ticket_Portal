import React from "react";

import {
  Paper,
  Stack,
  Avatar,
  Typography,
  Box,
  Grid,
  Badge,
} from "@mui/material";

import {
  FolderOpen,
  PendingActions,
  CheckCircle,
  Lock,
} from "@mui/icons-material";

const ticketTypesData = [
  {
    name: "Ashwini Patil",
    short: "AP",

    open: 2,
    pending: 1,
    resolved: 8,
    closed: 3,

    total: 139,

    color: "#2962ff",
  },

  {
    name: "Sanket Chavan",
    short: "SC",

    open: 5,
    pending: 3,
    resolved: 10,
    closed: 2,

    total: 256,

    color: "#7c4dff",
  },
  {
    name: "Ashwini Patil",
    short: "AP",

    open: 2,
    pending: 1,
    resolved: 8,
    closed: 3,

    total: 139,

    color: "#2962ff",
  },

  {
    name: "Sanket Chavan",
    short: "SC",

    open: 5,
    pending: 3,
    resolved: 10,
    closed: 2,

    total: 256,

    color: "#7c4dff",
  },
  {
    name: "Ashwini Patil",
    short: "AP",

    open: 2,
    pending: 1,
    resolved: 8,
    closed: 3,

    total: 139,

    color: "#2962ff",
  },

  {
    name: "Sanket Chavan",
    short: "SC",

    open: 5,
    pending: 3,
    resolved: 10,
    closed: 2,

    total: 256,

    color: "#7c4dff",
  },
  {
    name: "Ashwini Patil",
    short: "AP",

    open: 2,
    pending: 1,
    resolved: 8,
    closed: 3,

    total: 139,

    color: "#2962ff",
  },

  {
    name: "Sanket Chavan",
    short: "SC",

    open: 5,
    pending: 3,
    resolved: 10,
    closed: 2,

    total: 256,

    color: "#7c4dff",
  },

  {
    name: "Chetan Patil",
    short: "CP",

    open: 1,
    pending: 2,
    resolved: 12,
    closed: 4,

    total: 430,

    color: "#00a152",
  },

  {
    name: "Rahul More",
    short: "RM",

    open: 4,
    pending: 5,
    resolved: 15,
    closed: 3,

    total: 251,

    color: "#ff9100",
  },

  {
    name: "Sneha Patil",
    short: "SP",

    open: 1,
    pending: 1,
    resolved: 5,
    closed: 1,

    total: 13,

    color: "#1976d2",
  },

  {
    name: "Amit Borase",
    short: "AB",

    open: 8,
    pending: 6,
    resolved: 20,
    closed: 7,

    total: 881,

    color: "#ff2d78",
  },
];

const TicketTypeCard = ({ item }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        // position: "relative",
        overflowY: "hidden",
        background: "#fff",
        border: "1px solid #EFEFEF",
        borderRadius: "16px",
        px: 2,
        py: 1,
        height: "100%",

        // display: "flex",

        // flexDirection: "column",
        alignItems: "center",

        transition: "all 0.3s ease",

        boxShadow: "0 4px 20px rgba(15, 23, 42, 0.04)",

        "&:hover": {
          transform: "translateY(-5px)",
          boxShadow: "0 14px 35px rgba(15, 23, 42, 0.08)",
        },
      }}
    >
      {/* AVATAR */}
      <Badge
        overlap="circular"
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        badgeContent={
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              bgcolor: "#27AE60",
              border: "2px solid #fff",
            }}
          />
        }
      >
        <Avatar
          sx={{
            width: 50,
            height: 50,

            bgcolor: `${item.color}20`,
            color: item.color,

            fontSize: "16px",
            fontWeight: 800,

            boxShadow: `0 8px 20px ${item.color}25`,
          }}
        >
          {item.short}
        </Avatar>
      </Badge>

      {/* NAME */}
      <Box textAlign="center">
        <Typography
          sx={{
            fontSize: "15px",
            fontWeight: 700,
            color: "#1A1D20",
            lineHeight: 1.2,
          }}
        >
          {item.name}
        </Typography>

        <Typography
          sx={{
            mt: 0.7,
            fontSize: "11px",
            color: "#6C757D",
            fontWeight: 500,
          }}
        >
          Support Agent
        </Typography>
      </Box>

      {/* STATUS GRID */}
      <Grid container spacing={1} sx={{ mt: 1 }}>
        <Grid item xs={3}>
          <Stack spacing={0.7} alignItems="center">
            <FolderOpen
              sx={{
                fontSize: 16,
                color: "#1877F2",
              }}
            />

            <Typography
              sx={{
                fontSize: "16px",
                fontWeight: 800,
                color: "#1A1D20",
                lineHeight: 1,
              }}
            >
              {item.open}
            </Typography>

            <Typography
              sx={{
                fontSize: "11px",
                color: "#6C757D",
                fontWeight: 500,
              }}
            >
              Open
            </Typography>
          </Stack>
        </Grid>

        <Grid item xs={3}>
          <Stack spacing={0.7} alignItems="center">
            <PendingActions
              sx={{
                fontSize: 16,
                color: "#FF922B",
              }}
            />

            <Typography
              sx={{
                fontSize: "16px",
                fontWeight: 800,
                color: "#1A1D20",
                lineHeight: 1,
              }}
            >
              {item.pending}
            </Typography>

            <Typography
              sx={{
                fontSize: "11px",
                color: "#6C757D",
                fontWeight: 500,
              }}
            >
              Pending
            </Typography>
          </Stack>
        </Grid>
        <Grid item xs={3}>
          <Stack spacing={0.7} alignItems="center">
            <CheckCircle
              sx={{
                fontSize: 16,
                color: "#2EA44F",
              }}
            />

            <Typography
              sx={{
                fontSize: "16px",
                fontWeight: 800,
                color: "#1A1D20",
                lineHeight: 1,
              }}
            >
              {item.resolved}
            </Typography>

            <Typography
              sx={{
                fontSize: "11px",
                color: "#6C757D",
                fontWeight: 500,
              }}
            >
              Resolved
            </Typography>
          </Stack>
        </Grid>

        <Grid item xs={3}>
          <Stack spacing={0.7} alignItems="center">
            <Lock
              sx={{
                fontSize: 16,
                color: "#7952B3",
              }}
            />

            <Typography
              sx={{
                fontSize: "16px",
                fontWeight: 800,
                color: "#1A1D20",
                lineHeight: 1,
              }}
            >
              {item.closed}
            </Typography>

            <Typography
              sx={{
                fontSize: "11px",
                color: "#6C757D",
                fontWeight: 500,
              }}
            >
              Closed
            </Typography>
          </Stack>
        </Grid>
      </Grid>

      {/* TOTAL */}
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        justifyContent="center"
        sx={{
          mt: "10px !important",
        }}
      >
        <Typography
          sx={{
            fontSize: "13px",
            fontWeight: 600,
            color: "#1A1D20",
          }}
        >
          Total
        </Typography>

        <Box
          sx={{
            px: 1.8,
            borderRadius: "20px",
            background: `linear-gradient(
                135deg,
                ${item.color} 0%,
                ${item.color}DD 100%
              )`,
            color: "#fff",
            fontSize: "13px",
            fontWeight: 800,
            textAlign: "center",
            boxShadow: `0 8px 18px ${item.color}35`,
          }}
        >
          {item.total}
        </Box>
      </Stack>
    </Paper>
  );
};

// export default function AgentsWiseCards() {
//   return (
//     <Grid
//       container
//       spacing={2}
//       sx={{
//         display: "grid",
//         gridTemplateColumns: "repeat(3, 1fr)",
//       }}
//     >
//       {ticketTypesData.map((item, index) => (
//         <Grid item xs={12} sm={6} md={6} xl={4} key={index}>
//           <TicketTypeCard item={item} />
//         </Grid>
//       ))}
//     </Grid>
//   );
// }
export default function AgentsWiseCards() {
  return (
    // <Grid container spacing={1}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 3,
        }}
      >
        {ticketTypesData.map((item, index) => (
          <Grid
            item
            xs={12}
            sm={6}
            md={1}
            key={index}
            sx={{ display: "flex", gridTemplateColumns: "repeat(3, 1fr)" }}
          >
            <TicketTypeCard item={item} />
          </Grid>
        ))}
      </Box>
    // </Grid>
  );
}
