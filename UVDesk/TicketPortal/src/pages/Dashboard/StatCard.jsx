import { useEffect } from "react";
import { Paper, Stack, Typography, Avatar, Box, useTheme } from "@mui/material";
import { motion, useSpring, useTransform } from "framer-motion";

const MotionPaper = motion(Paper);

const Counter = ({ value }) => {
  const count = useSpring(0, { stiffness: 100, damping: 20 });

  useEffect(() => {
    count.set(value);
  }, [value, count]);

  const display = useTransform(count, (latest) => Math.round(latest));
  return <motion.span>{display}</motion.span>;
};

const StatCard = ({ title, value, color, icon, delay = 0 }) => {
  const theme = useTheme(); // 🔥 Theme access kiya
  const isDark = theme.palette.mode === "dark";

  return (
    <MotionPaper
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 15, delay }}
      whileHover={{ scale: 1.02, y: -5 }}
      elevation={0}
      sx={{
        position: "relative",
        overflow: "hidden",
        height: "auto",
        m: { xs: 0, sm: 1 },
        minHeight: { xs: 90, sm: 100 },
        px: { xs: 1.5, sm: 2 },
        py: { xs: 1.5, sm: 0 },
        borderRadius: "24px",
        // 🔥 Gradient ko dark mode ke hisaab se adjust kiya
        background: isDark
          ? `linear-gradient(135deg, ${color}25 0%, ${color}10 45%, ${theme.palette.background.paper} 100%)`
          : `linear-gradient(135deg, ${color}14 0%, ${color}08 45%, #ffffff 100%)`,
        border: `2px solid ${color}${isDark ? "30" : "18"}`,
        boxShadow: isDark
          ? "0 10px 30px rgba(0,0,0,0.2)"
          : "0 10px 30px rgba(0,0,0,0.04)",
        display: "flex",
        alignItems: "center",
        cursor: "pointer",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: "-45px",
          right: "-45px",
          width: "140px",
          height: "140px",
          borderRadius: "50%",
          background: `${color}${isDark ? "20" : "10"}`,
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: -15,
          right: -10,
          opacity: isDark ? 0.1 : 0.05,
          pointerEvents: "none",
          "& > svg": { fontSize: { xs: 80, sm: 110 }, color: color },
        }}
      >
        {icon}
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
          zIndex: 2,
          width: "100%",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: 1.5, sm: 2 },
            flex: 1,
            minWidth: 0,
          }}
        >
          <Avatar
            sx={{
              width: { xs: 50, sm: 62 },
              height: { xs: 50, sm: 62 },
              flexShrink: 0,
              background: `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)`,
              boxShadow: `0 12px 24px ${color}30`,
              "& > svg": { fontSize: { xs: 24, sm: 30 }, color: "#fff" },
            }}
          >
            {icon}
          </Avatar>

          <Stack spacing={0.5} sx={{ minWidth: 0 }}>
            <Typography
              fontWeight={"bold"}
              sx={{
                color: "text.secondary", // 🔥 Dynamic Color
                fontSize: { xs: 12, sm: 13 },
                textTransform: "uppercase",
              }}
            >
              {title}
            </Typography>

            <Typography
              fontWeight={800}
              sx={{
                color: "text.primary", // 🔥 Dynamic Color
                fontSize: { xs: 24, sm: 30, md: 34 },
                lineHeight: 1,
              }}
            >
              <Counter value={value} />
            </Typography>
          </Stack>
        </Box>

        <Box
          sx={{
            width: { xs: 34, sm: 42 },
            height: { xs: 34, sm: 42 },
            borderRadius: "50%",
            bgcolor: `${color}${isDark ? "25" : "15"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            "& > svg": { color: color, fontSize: { xs: 16, sm: 20 } },
          }}
        >
          {icon}
        </Box>
      </Box>
    </MotionPaper>
  );
};

export default StatCard;
