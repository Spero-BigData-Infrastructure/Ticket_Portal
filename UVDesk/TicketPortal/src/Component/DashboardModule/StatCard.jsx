import React from "react";

import { Paper, Stack, Typography, Avatar, Box } from "@mui/material";

import { TrendingUp } from "@mui/icons-material";

const StatCard = ({ title, value, color, icon, trend }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        position: "relative",
        overflow: "hidden",
        height: "auto",
        m:1,
        minHeight: 100,
        px: 2,
        borderRadius: "24px",
        background: `linear-gradient(
      135deg,
      ${color}14 0%,
      ${color}08 45%,
      #ffffff 100%
    )`,
        border: `2px solid ${color}18`,
        transition: "all 0.3s ease",
        boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
        display: "flex",
        alignItems: "center",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 18px 40px rgba(0,0,0,0.08)",
        },
      }}
    >
      {/* Top Right Glow */}
      <Box
        sx={{
          position: "absolute",
          top: "-45px",
          right: "-45px",
          width: "140px",
          height: "140px",
          borderRadius: "50%",
          background: `${color}10`,
        }}
      />

      {/* Decorative Trend Shape */}
      {trend && (
        <Box
          sx={{
            position: "absolute",
            bottom: 10,
            right: 10,
            opacity: 0.07,
          }}
        >
          <TrendingUp
            sx={{
              fontSize: 95,
              color: color,
            }}
          />
        </Box>
      )}

      {/* Main Horizontal Layout */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
          zIndex: 2,
        }}
      >
        {/* LEFT SECTION */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            flex: 1,
            minWidth: 0,
          }}
        >
          {/* Icon */}
          <Avatar
            sx={{
              width: 62,
              height: 62,

              flexShrink: 0,

              background: `linear-gradient(
                135deg,
                ${color} 0%,
                ${color}CC 100%
              )`,

              boxShadow: `0 12px 24px ${color}30`,
            }}
          >
            {icon}
          </Avatar>

          {/* Text Content */}
          <Stack
            spacing={0.8}
            sx={{
              minWidth: 0,
            }}
          >
            <Typography
              fontWeight={"bold"}
              fontSize={11}
              sx={{
                color: "#0f172a",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {title}
            </Typography>

            <Typography
              fontWeight={800}
              sx={{
                color: color,

                fontSize: {
                  xs: "30px",
                  sm: "34px",
                  md: "38px",
                },

                lineHeight: 1,
              }}
            >
              {value}
            </Typography>
          </Stack>
        </Box>

        {/* RIGHT SECTION */}
        <Box
          sx={{
            width: 42,
            height: 42,

            borderRadius: "50%",

            bgcolor: `${color}15`,

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            flexShrink: 0,
          }}
        >
          <TrendingUp
            sx={{
              color: color,
              fontSize: 20,
            }}
          />
        </Box>
      </Box>
    </Paper>
  );
};

export default StatCard;
