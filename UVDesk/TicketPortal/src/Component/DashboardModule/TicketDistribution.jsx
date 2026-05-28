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
  "#00bcd4",
  "#8bc34a",
  "#673ab7",
  "#ff5722",
];

const TicketDistribution = ({
  pieData = [],
}) => {
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

        p: {
          xs: 2,
          md: 2,
        },

        background: "#ffffff",

        border: "1px solid #eef2f7",

        boxShadow:
          "0 10px 30px rgba(15, 23, 42, 0.05)",

        display: "flex",

        flexDirection: "column",

        gap: 2,
      }}
    >
      {/* HEADER */}
      <Stack
        alignItems="center"
        justifyContent="center"
        spacing={0.3}
      >
        <Typography
          sx={{
            fontSize: "18px",
            fontWeight: 800,
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
          }}
        >
          Till Date
        </Typography>
      </Stack>

      {/* CHART */}
      <Box
        sx={{
          height: {
            xs: 300,
            sm: 340,
            md: 380,
          },

          position: "relative",

          flexShrink: 0,
        }}
      >
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={75}
              outerRadius={115}
              paddingAngle={2}
              cornerRadius={5}
              labelLine={false}
              label={({ percent }) =>
                percent > 0.08
                  ? `${(
                      percent * 100
                    ).toFixed(1)}%`
                  : ""
              }
            >
              {pieData.map(
                (entry, index) => (
                  <Cell
                    key={index}
                    fill={
                      COLORS[
                        index %
                          COLORS.length
                      ]
                    }
                  />
                )
              )}
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

            transform:
              "translate(-50%, -50%)",

            textAlign: "center",
          }}
        >
          <Typography
            sx={{
              fontSize: "12px",
              color: "#64748b",
            }}
          >
            Total
          </Typography>

          <Typography
            sx={{
              fontSize: {
                xs: "24px",
                md: "30px",
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
              fontSize: "12px",
              color: "#64748b",
            }}
          >
            Tickets
          </Typography>
        </Box>
      </Box>

      {/* LEGEND */}
      <Stack
        spacing={1}
        sx={{
          maxHeight: 320,
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
              ? (
                  (item.value /
                    totalTickets) *
                  100
                ).toFixed(1)
              : 0;

          return (
            <Box
              key={index}
              sx={{
                p: 1,
                borderRadius: "12px",
                background:
                  "rgba(248,250,252,0.7)",

                border:
                  "1px solid #f1f5f9",
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={1}
              >
                {/* LEFT */}
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
                      width: 10,
                      height: 10,

                      borderRadius: "50%",

                      bgcolor:
                        COLORS[
                          index %
                            COLORS.length
                        ],

                      flexShrink: 0,
                    }}
                  />

                  <Typography
                    sx={{
                      fontSize: "12px",

                      color: "#0f172a",

                      overflow: "hidden",

                      textOverflow:
                        "ellipsis",

                      whiteSpace:
                        "nowrap",
                    }}
                  >
                    {item.name}
                  </Typography>
                </Stack>

                {/* RIGHT */}
                <Typography
                  sx={{
                    fontSize: "12px",

                    fontWeight: 700,

                    color: "#0f172a",

                    whiteSpace: "nowrap",
                  }}
                >
                  {item.value} (
                  {percentage}%)
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