import { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Skeleton,
  useTheme,
  alpha,
} from "@mui/material";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  motion,
  useSpring,
  useTransform,
  AnimatePresence,
} from "framer-motion";

const MotionPaper = motion(Paper);
const MotionBox = motion(Box);

const legendContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.2 },
  },
};

const legendItemVariants = {
  hidden: { x: -10, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 150 } },
};

// Modern, vibrant color palette
const COLORS = [
  "#3b82f6", // Blue
  "#8b5cf6", // Purple
  "#f43f5e", // Rose
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#64748b", // Slate
  "#ec4899", // Pink
  "#84cc16", // Lime
];

const Counter = ({ value }) => {
  const count = useSpring(value, { stiffness: 60, damping: 15 });
  const display = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    count.set(value);
  }, [value, count]);
  return <motion.span>{display}</motion.span>;
};

// 🔥 CUSTOM TOOLTIP
const CustomTooltip = ({ active, payload }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <Box
        sx={{
          bgcolor: isDark ? alpha("#1e293b", 0.9) : alpha("#ffffff", 0.95),
          backdropFilter: "blur(10px)",
          p: 1.5,
          borderRadius: "12px",
          border: 1,
          borderColor: isDark ? alpha("#ffffff", 0.1) : "divider",
          boxShadow: isDark
            ? "0 8px 32px rgba(0,0,0,0.5)"
            : "0 8px 32px rgba(15, 23, 42, 0.1)",
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            bgcolor: data.payload.fill,
            boxShadow: `0 0 8px ${alpha(data.payload.fill, 0.5)}`,
          }}
        />
        <Box>
          <Typography
            sx={{ fontSize: "12px", color: "text.secondary", fontWeight: 600 }}
          >
            {data.name}
          </Typography>
          <Typography
            sx={{ fontSize: "16px", fontWeight: 800, color: "text.primary" }}
          >
            {data.value.toLocaleString()}{" "}
            <span style={{ fontSize: "12px", fontWeight: 600 }}>Tickets</span>
          </Typography>
        </Box>
      </Box>
    );
  }
  return null;
};

const TicketDistribution = ({ pieData = [], isLoading = false }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // 🔥 Hover state track karne ke liye
  const [activeIndex, setActiveIndex] = useState(-1);

  const totalTickets = pieData.reduce(
    (sum, item) => sum + Number(item.value || 0),
    0,
  );

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(-1);
  };

  // Dynamic center data logic
  const activeItem = activeIndex >= 0 ? pieData[activeIndex] : null;
  const displayValue = activeItem ? activeItem.value : totalTickets;
  const displayLabel = activeItem ? activeItem.name : "Total Tickets";
  const displayColor = activeItem
    ? COLORS[activeIndex % COLORS.length]
    : "text.primary";

  if (isLoading) {
    return (
      <MotionPaper
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        elevation={0}
        sx={{
          width: "100%",
          height: "100%",
          p: 3,
          borderRadius: "24px",
          bgcolor: "background.paper",
          border: 1,
          borderColor: "divider",
          boxShadow: isDark
            ? "0 4px 24px rgba(0,0,0,0.4)"
            : "0 4px 24px rgba(15, 23, 42, 0.04)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Stack direction="row" alignItems="center" mb={2}>
          <Skeleton
            variant="rectangular"
            width={4}
            height={20}
            sx={{ borderRadius: 4, mr: 1.5 }}
            animation="wave"
          />
          <Skeleton variant="text" width={160} height={24} animation="wave" />
        </Stack>

        <Box
          sx={{
            height: 220,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <Skeleton
            variant="circular"
            width={180}
            height={180}
            animation="wave"
          />
          <Box
            sx={{
              position: "absolute",
              width: 130,
              height: 130,
              borderRadius: "50%",
              bgcolor: "background.paper",
            }}
          />
        </Box>

        <Box sx={{ mt: 2, flexGrow: 1 }}>
          {[1, 2, 3, 4, 5].map((item) => (
            <Box
              key={item}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                py: 1.5,
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Skeleton
                  variant="circular"
                  width={10}
                  height={10}
                  animation="wave"
                />
                <Skeleton
                  variant="text"
                  width={120}
                  height={20}
                  animation="wave"
                />
              </Stack>
              <Skeleton
                variant="rounded"
                width={50}
                height={24}
                sx={{ borderRadius: "8px" }}
                animation="wave"
              />
            </Box>
          ))}
        </Box>
      </MotionPaper>
    );
  }

  return (
    <MotionPaper
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      elevation={0}
      sx={{
        width: "100%",
        height: "100%",
        p: 3,
        borderRadius: "24px",
        bgcolor: "background.paper",
        border: 1,
        borderColor: "divider",
        boxShadow: isDark
          ? "0 4px 24px rgba(0,0,0,0.4)"
          : "0 4px 24px rgba(15, 23, 42, 0.04)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: -50,
          right: -50,
          width: 150,
          height: 150,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${alpha(COLORS[0], 0.1)} 0%, transparent 70%)`,
          zIndex: 0,
        }}
      />

      <Stack
        direction="row"
        alignItems="center"
        mb={3}
        sx={{ position: "relative", zIndex: 1 }}
      >
        <Box
          sx={{
            width: 5,
            height: 22,
            borderRadius: 4,
            bgcolor: COLORS[0],
            mr: 1.5,
          }}
        />
        <Typography
          sx={{
            fontSize: "18px",
            fontWeight: 800,
            color: "text.primary",
            letterSpacing: "-0.5px",
          }}
        >
          Ticket Distribution
        </Typography>
      </Stack>

      <MotionBox sx={{ height: 220, position: "relative", zIndex: 1 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              <filter id="pie3D" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow
                  dx="0"
                  dy="8"
                  stdDeviation="6"
                  floodColor={isDark ? "#000000" : "#0f172a"}
                  floodOpacity={isDark ? "0.6" : "0.15"}
                />
              </filter>
            </defs>

            <Pie
              data={pieData}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={90}
              paddingAngle={3}
              cornerRadius={6}
              stroke="none"
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
              style={{ filter: "url(#pie3D)" }}
            >
              {pieData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index % COLORS.length]}
                  style={{
                    stroke: theme.palette.background.paper,
                    strokeWidth: 2,
                    outline: "none",
                    transition: "all 0.3s ease",
                    opacity:
                      activeIndex === -1 || activeIndex === index ? 1 : 0.6,
                  }}
                />
              ))}
            </Pie>
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "transparent" }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* 🔥 FIXED Interactive Dynamic Center Text with Smooth Animation */}
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            width: "110px", // Strict width taaki donut ke border se na takraye
            height: "110px", // Strict height to prevent layout shifts
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={displayLabel}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              style={{ width: "100%" }}
            >
              <Typography
                noWrap // Ye ensure karega ki text wrap na ho
                sx={{
                  width: "100%",
                  fontSize: "11px",
                  color: activeItem ? displayColor : "text.secondary",
                  fontWeight: 700,
                  textTransform: activeItem ? "none" : "uppercase",
                  letterSpacing: activeItem ? "0px" : "1px",
                }}
              >
                {displayLabel}
              </Typography>
              <Typography
                noWrap
                sx={{
                  width: "100%",
                  fontSize: "24px", // Font size thoda chhota kiya taaki bade numbers fit ho jaye
                  fontWeight: 800,
                  color: displayColor,
                  lineHeight: 1.2,
                  mt: 0.5,
                }}
              >
                <Counter value={displayValue} />
              </Typography>
            </motion.div>
          </AnimatePresence>
        </Box>
      </MotionBox>

      {/* Premium Legend List */}
      <MotionBox
        variants={legendContainerVariants}
        initial="hidden"
        animate="visible"
        sx={{
          flexGrow: 1,
          height: "180px",
          overflowY: "auto",
          pr: 1,
          mt: 3,
          position: "relative",
          zIndex: 1,
          "&::-webkit-scrollbar": { width: "4px" },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": {
            background: isDark ? "#475569" : "#cbd5e1",
            borderRadius: "10px",
          },
        }}
      >
        {pieData.map((item, index) => {
          const color = COLORS[index % COLORS.length];
          const isActive = activeIndex === index;

          return (
            <motion.div key={index} variants={legendItemVariants}>
              <Box
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(-1)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  py: 1.2,
                  px: 1.5,
                  mb: 0.5,
                  borderRadius: "12px",
                  transition: "all 0.2s ease",
                  border: "1px solid transparent",
                  cursor: "pointer",
                  bgcolor: isActive
                    ? isDark
                      ? alpha(color, 0.15)
                      : alpha(color, 0.08)
                    : "transparent",
                  borderColor: isActive ? alpha(color, 0.3) : "transparent",
                  transform: isActive ? "translateX(4px)" : "none",
                  "&:hover": {
                    bgcolor: isDark ? alpha(color, 0.1) : alpha(color, 0.05),
                    borderColor: alpha(color, 0.2),
                    transform: "translateX(4px)",
                  },
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1.5}
                  sx={{ minWidth: 0, flex: 1 }}
                >
                  <Box
                    sx={{
                      width: isActive ? 12 : 10,
                      height: isActive ? 12 : 10,
                      borderRadius: "50%",
                      bgcolor: color,
                      boxShadow: `0 0 8px ${alpha(color, 0.4)}`,
                      transition: "all 0.2s ease",
                    }}
                  />
                  <Typography
                    noWrap
                    sx={{
                      fontSize: "13px",
                      fontWeight: isActive ? 700 : 600,
                      color: isActive ? "text.primary" : "text.secondary",
                      fontFamily: "'Poppins'",
                      transition: "color 0.2s ease",
                    }}
                  >
                    {item.name}
                  </Typography>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Typography
                    sx={{
                      fontSize: "14px",
                      fontWeight: 800,
                      color: "text.primary",
                      fontFamily: "'Poppins'",
                    }}
                  >
                    {item.value.toLocaleString()}
                  </Typography>
                </Stack>
              </Box>
            </motion.div>
          );
        })}
      </MotionBox>
    </MotionPaper>
  );
};

export default TicketDistribution;
