// TotalTickets.jsx

import React from "react";

import {
  Avatar,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
  Box,
} from "@mui/material";

import {
  ConfirmationNumberOutlined,
  FolderOpenOutlined,
  AccessTimeOutlined,
  ChatBubbleOutlineOutlined,
  CheckCircleOutlineOutlined,
  LockOutlined,
} from "@mui/icons-material";

const ticketData = [
  {
    title: "Total Tickets",
    count: 34,
    subtitle: "All tickets in selected range",
    color: "#2563EB",
    bg: "rgba(37, 99, 235, 0.10)",
    border: "rgba(37, 99, 235, 0.18)",
    icon: <ConfirmationNumberOutlined />,
  },

  {
    title: "Open",
    count: 8,
    subtitle: "23.5% of total tickets",
    color: "#16A34A",
    bg: "rgba(22, 163, 74, 0.10)",
    border: "rgba(22, 163, 74, 0.18)",
    icon: <FolderOpenOutlined />,
  },

  {
    title: "Pending",
    count: 15,
    subtitle: "44.1% of total tickets",
    color: "#F59E0B",
    bg: "rgba(245, 158, 11, 0.10)",
    border: "rgba(245, 158, 11, 0.18)",
    icon: <AccessTimeOutlined />,
  },

  {
    title: "Answered",
    count: 3,
    subtitle: "8.8% of total tickets",
    color: "#7C3AED",
    bg: "rgba(124, 58, 237, 0.10)",
    border: "rgba(124, 58, 237, 0.18)",
    icon: <ChatBubbleOutlineOutlined />,
  },

  {
    title: "Resolved",
    count: 4,
    subtitle: "11.8% of total tickets",
    color: "#0F766E",
    bg: "rgba(15, 118, 110, 0.10)",
    border: "rgba(15, 118, 110, 0.18)",
    icon: <CheckCircleOutlineOutlined />,
  },

  {
    title: "Closed",
    count: 11,
    subtitle: "32.4% of total tickets",
    color: "#E11D48",
    bg: "rgba(225, 29, 72, 0.10)",
    border: "rgba(225, 29, 72, 0.18)",
    icon: <LockOutlined />,
  },
];

export default function TotalTickets() {
  return (
    <Grid container spacing={1} wrap="nowrap">
      {ticketData.map((item, index) => (
        <Grid item xs key={index}>
          <Card
            elevation={0}
            sx={{
              height: 96,
              minWidth: 180,
              borderRadius: "12px",
              border: `1px solid ${item.border}`,
              backgroundColor: "#FFFFFF",
              transition: "all 0.25s ease",
              display: "flex",
              alignItems: "center",

              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0px 4px 18px rgba(0,0,0,0.06)",
              },
            }}
          >
            <CardContent
              sx={{
                width: "100%",
                p: "16px !important",
              }}
            >
              {/* MAIN ROW */}
              <Stack direction="row" alignItems="center" spacing={1.5}>
                {/* LEFT ICON */}
                <Avatar
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    backgroundColor: item.bg,
                    color: item.color,
                    flexShrink: 0,

                    "& svg": {
                      fontSize: 22,
                    },
                  }}
                >
                  {item.icon}
                </Avatar>

                {/* RIGHT TEXT */}
                <Box flex={1}>
                  {/* LABEL */}
                  <Typography
                    sx={{
                      fontSize: "12px",
                      fontWeight: 500,
                      color: "#4A5568",
                      lineHeight: 1.2,
                    }}
                  >
                    {item.title}
                  </Typography>

                  {/* COUNT */}
                  <Typography
                    sx={{
                      fontSize: "24px",
                      fontWeight: 700,
                      color: "#1A202C",
                      lineHeight: 1.1,
                      my: "2px",
                    }}
                  >
                    {item.count}
                  </Typography>

                  {/* SUBTITLE */}
                  <Typography
                    sx={{
                      fontSize: "11px",
                      fontWeight: 400,
                      color: "#718096",
                      lineHeight: 1.2,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.subtitle}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
