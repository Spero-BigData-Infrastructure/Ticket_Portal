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

const TicketTypeCard = ({ item }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        position: "relative",
        overflow: "hidden",

        background: "#fff",

        border: "1px solid #EFEFEF",

        borderRadius: "16px",

        px: 2.5,
        py: 2.8,

        height: "100%",

        display: "flex",
        flexDirection: "column",
        alignItems: "center",

        transition: "all 0.3s ease",

        boxShadow: "0 4px 20px rgba(15, 23, 42, 0.04)",

        "&:hover": {
          transform: "translateY(-5px)",
          boxShadow: "0 14px 35px rgba(15, 23, 42, 0.08)",
        },
      }}
    >
      {/* TOP COLOR BAR */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "4px",
          // background: item.color,
        }}
      />

      <Stack spacing={1} alignItems="center" width="100%">
        {/* ========================= */}
        {/* AVATAR + ONLINE DOT */}
        {/* ========================= */}
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
              alignItems: "center",
              justifyContent: "center",
              alignSelf: "center",
              boxShadow: `0 8px 20px ${item.color}25`,
            }}
          >
            {item.short}
          </Avatar>
        </Badge>

        {/* ========================= */}
        {/* NAME */}
        {/* ========================= */}
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

        {/* ========================= */}
        {/* STATUS GRID */}
        {/* ========================= */}
        <Grid
          container
          spacing={1}
          sx={{
            width: "100%",
            mt: "2px !important",
          }}
        >
          {/* OPEN */}
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

          {/* PENDING */}
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

          {/* RESOLVED */}
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

          {/* CLOSED */}
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

        {/* ========================= */}
        {/* TOTAL PILL */}
        {/* ========================= */}
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent="center"
          sx={{
            mt: "8px !important",
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
              py: 0.55,

              borderRadius: "20px",

              background: `linear-gradient(
                135deg,
                ${item.color} 0%,
                ${item.color}DD 100%
              )`,

              color: "#fff",

              fontSize: "13px",
              fontWeight: 800,

              minWidth: 54,

              textAlign: "center",

              boxShadow: `0 8px 18px ${item.color}35`,
            }}
          >
            {item.total}
          </Box>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default TicketTypeCard;
