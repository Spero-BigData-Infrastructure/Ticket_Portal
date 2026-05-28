import React from "react";

import { Box, Paper, Stack, Typography } from "@mui/material";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = [
  "#ff2d78",
  "#7c4dff",
  "#2962ff",
  "#ff9100",
  "#00c853",
  "#9e9e9e",
  "#00bcd4",
  "#8bc34a",
  "#673ab7",
  "#ff5722",
];

const TicketDistribution = ({ pieData = [] }) => {
  // ✅ TOTAL TICKETS
  const totalTickets = pieData.reduce(
    (sum, item) => sum + Number(item.value || 0),
    0,
  );

  return (
    <Paper
      elevation={0}
      sx={{
        width: "100%",
        height: "100%",
        px: 2,
        borderRadius: "22px",
        background: "#ffffff",
        border: "1px solid #eef2f7",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",

        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ================= HEADER ================= */}
      <Stack alignItems="flex-start" spacing={0}>
        <Typography
          sx={{
            fontSize: "15px",
            fontWeight: 800,
            color: "#0A1128",
            textAlign: "left",
            py: 1,
          }}
        >
          Ticket Distribution
        </Typography>
      </Stack>

      {/* ================= CHART ================= */}
      <Box
        sx={{
          height: {
            xs: 250,
            sm: 280,
            md: 240,
          },
          position: "relative",
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={95}
              paddingAngle={1}
              cornerRadius={4}
              labelLine={false}
              isAnimationActive={false} // 👈 prevents weird hover boxes
              activeIndex={-1} // ✅ IMPORTANT: disables selected slice highlight
              activeShape={null} // ✅ removes black box / outline
            >
              {pieData.map((entry, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]}
                      stroke="none"   // ✅ removes border box on click
 />
              ))}
            </Pie>

            <Tooltip />
          </PieChart>
        </ResponsiveContainer>

        {/* ================= CENTER ================= */}
        <Box
          sx={{
            position: "absolute",

            top: "50%",
            left: "50%",

            transform: "translate(-50%, -50%)",

            textAlign: "center",
          }}
        >
          <Typography
            sx={{
              fontSize: "11px",
              color: "#64748b",
              lineHeight: 1,
            }}
          >
            Total
          </Typography>

          <Typography
            sx={{
              fontSize: {
                xs: "24px",
                md: "28px",
              },

              fontWeight: 800,

              color: "#0A1128",

              lineHeight: 1,
            }}
          >
            {totalTickets}
          </Typography>

          <Typography
            sx={{
              fontSize: "11px",
              color: "#64748b",
              lineHeight: 1,
            }}
          >
            Tickets
          </Typography>
        </Box>
      </Box>

      {/* ================= LEGEND ================= */}
      <Stack
        // spacing={0.7} // ✅ reduced vertical spacing
        sx={{
          maxHeight: 260,
          overflowY: "auto",
          pr: 0.5,

          "&::-webkit-scrollbar": {
            width: "4px",
          },

          "&::-webkit-scrollbar-thumb": {
            background: "#CBD5E1",
            borderRadius: "10px",
          },
        }}
      >
        {pieData.map((item, index) => {
          const percentage =
            totalTickets > 0
              ? ((item.value / totalTickets) * 100).toFixed(1)
              : 0;

          return (
            <Box
              key={index}
              sx={{
                px: 1.2,
                py: 0.8,

                borderRadius: "10px",

                background: "rgba(248,250,252,0.7)",

                border: "1px solid #f1f5f9",
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={1}
              >
                {/* ================= LEFT ================= */}
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <Box
                    sx={{
                      width: 9,
                      height: 9,

                      borderRadius: "50%",

                      bgcolor: COLORS[index % COLORS.length],

                      flexShrink: 0,
                    }}
                  />

                  {/* ✅ NAME + TOTAL */}
                  <Typography
                    sx={{
                      fontSize: "12px",

                      color: "#0f172a",

                      fontWeight: 600,

                      overflow: "hidden",

                      textOverflow: "ellipsis",

                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.name}
                  </Typography>
                </Stack>

                {/* ================= RIGHT ================= */}
                <Typography
                  sx={{
                    fontSize: "11px",

                    fontWeight: 700,

                    color: "#2563EB",

                    minWidth: 45,

                    textAlign: "right",
                  }}
                >
                  {item.value}
                </Typography>
              </Stack>
            </Box>
          );
        })}
      </Stack>
    </Paper>
  );
};

export default TicketDistribution;
