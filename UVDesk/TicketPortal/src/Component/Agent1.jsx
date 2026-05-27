import React from "react";
import { Grid, Paper, Typography, Avatar, Stack } from "@mui/material";

const data = [
  { name: "Ashwini Patil", short: "AP" },
  { name: "Sanket Chavan", short: "SC" },
  { name: "Rohit Sharma", short: "RS" },
  { name: "Priya Desai", short: "PD" },
  { name: "Amit Joshi", short: "AJ" },
  { name: "Neha Kulkarni", short: "NK" },
];

export default function Agents1() {
  return (
    <Grid container spacing={2}>
      {data.map((item, index) => (
        <Grid item xs={4} key={index}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              textAlign: "center",
              borderRadius: 3,
            }}
          >
            <Stack spacing={1} alignItems="center">
              <Avatar>{item.short}</Avatar>
              <Typography fontWeight={600}>{item.name}</Typography>
            </Stack>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}