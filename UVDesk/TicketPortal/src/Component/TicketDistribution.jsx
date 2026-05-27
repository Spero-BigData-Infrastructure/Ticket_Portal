// TicketDistribution.jsx

import React from "react";

import {
  Box,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const COLORS = [
  "#ff2d78",
  "#7c4dff",
  "#2962ff",
  "#ff9100",
  "#00c853",
  "#9e9e9e",
];

const TicketDistribution = ({ pieData }) => {
  const totalTickets = pieData.reduce(
    (sum, item) => sum + item.value,
    0
  );

  return (
    <Paper
      elevation={0}
      sx={{
        width: "100%",
        height: "100%",
        borderRadius: "24px",
        p: { xs: 2, md: 3 },
        background: "#ffffff",
        border: "1px solid #eef2f7",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
      }}
    >
      {/* HEADER */}
      <Stack
        alignItems="center"
        justifyContent="center"
        // mb={2.5}
      >
        <Typography
          fontWeight={800}
          sx={{
            fontSize: "17px",
            color: "#0A1128",
            textAlign: "center",
          }}
        >
          Ticket Distribution
        </Typography>

        <Typography
          sx={{
            fontSize: "12px",
            color: "#64748b",
            mt: 0.3,
          }}
        >
          Till Date
        </Typography>
      </Stack>

      {/* CHART */}
      <Box
        sx={{
          height: { xs: 250, sm: 280, md: 320 },
          position: "relative",
        }}
      >
        <ResponsiveContainer >
          <PieChart>
            <Pie
            //   data={pieData}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={78}
              outerRadius={118}
              paddingAngle={2}
              cornerRadius={6}
              labelLine={false}
              label={({ percent }) =>
                percent > 0.08
                  ? `${(percent * 100).toFixed(1)}%`
                  : ""
              }
            >
              {/* {pieData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index % COLORS.length]}
                />
              ))} */}
            </Pie>

            <Tooltip />
          </PieChart>
        </ResponsiveContainer>

        {/* CENTER CONTENT */}
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
              fontSize: "12px",
              color: "#64748b",
              mb: 0.3,
            }}
          >
            Total
          </Typography>

          <Typography
            sx={{
              fontSize: "28px",
              fontWeight: 800,
              color: "#0A1128",
              lineHeight: 1,
            }}
          >
            {totalTickets}
          </Typography>

          <Typography
            sx={{
              fontSize: "12px",
              color: "#64748b",
            //   mt: 0.5,
            }}
          >
            Tickets
          </Typography>
        </Box>
      </Box>

      {/* LEGEND */}
      <Stack >
        {pieData.map((item, index) => {
          const percentage = (
            (item.value / totalTickets) *
            100
          ).toFixed(1);

          return (
            <Box
              key={index}
              sx={{
                borderRadius:
                  item.name === "Others"
                    ? "10px"
                    : "0px",

                background:
                  item.name === "Others"
                    ? "#f5f7fb"
                    : "transparent",
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={1}
              >
                <Stack
                  direction="row"
                  spacing={1.2}
                  alignItems="center"
                  sx={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      bgcolor:
                        COLORS[index % COLORS.length],
                      flexShrink: 0,
                    }}
                  />

                  <Typography
                    sx={{
                      fontSize: "13px",
                      color: "#0f172a",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.name}
                  </Typography>
                </Stack>

                {/* RIGHT */}
                <Typography
                  sx={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#0f172a",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.value} ({percentage}%)
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