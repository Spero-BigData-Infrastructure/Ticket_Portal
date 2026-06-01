import { useState, useContext } from "react";
import {
  Box,
  Stack,
  Typography,
  IconButton,
  useTheme,
  Avatar,
  Badge,
  Tooltip,
  Divider,
  Popover,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Button,
} from "@mui/material";

// 🔥 Icons
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import DashboardCustomizeOutlinedIcon from "@mui/icons-material/DashboardCustomizeOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import ConfirmationNumberOutlinedIcon from "@mui/icons-material/ConfirmationNumberOutlined";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";

// 🔥 Context & Animation
import { ColorModeContext } from "../../Context/ColorModeContext";
import { motion, AnimatePresence } from "framer-motion";

const MotionBox = motion(Box);

// =========================================
// 🔥 DUMMY DATA (Backend walo ke liye reference)
// =========================================
const DUMMY_NOTIFICATIONS = [
  {
    id: 1,
    type: "sla",
    title: "SLA Breach Warning",
    message: "Ticket #1042 is about to breach SLA in 30 mins.",
    time: "2 mins ago",
    isRead: false,
  },
  {
    id: 2,
    type: "assign",
    title: "New Ticket Assigned",
    message: "You have been assigned Ticket #3001 (Server Down).",
    time: "1 hour ago",
    isRead: false,
  },
  {
    id: 3,
    type: "mention",
    title: "New Mention",
    message: "Rahul mentioned you in internal notes of #2091.",
    time: "3 hours ago",
    isRead: true,
  },
  {
    id: 4,
    type: "assign",
    title: "Ticket Escalated",
    message: "Ticket #112 has been escalated to Tier-2.",
    time: "Yesterday",
    isRead: true,
  },
];

const DashboardHeader = () => {
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const isDark = theme.palette.mode === "dark";

  // 🔥 Notification Dropdown State
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState(DUMMY_NOTIFICATIONS);

  const handleOpenNotifications = (event) => setAnchorEl(event.currentTarget);
  const handleCloseNotifications = () => setAnchorEl(null);

  // Mark all as read function
  const handleMarkAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const open = Boolean(anchorEl);

  return (
    <Box
      component={motion.header}
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      sx={{
        py: 0.8, // 🔥 Padding kam ki taaki height kam ho (Pehle 1.2 thi)
        px: { xs: 2, sm: 3, md: 4 },
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        bgcolor: isDark ? "rgba(15, 23, 42, 0.75)" : "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid",
        borderColor: "divider",
        position: "sticky",
        top: 0,
        zIndex: 1100,
        boxShadow: isDark
          ? "0 4px 20px rgba(0,0,0,0.2)"
          : "0 4px 20px rgba(0,0,0,0.03)",
      }}
    >
      {/* LEFT: BRANDING */}
      <Stack direction="row" spacing={1.5} alignItems="center">
        <MotionBox
          whileHover={{ rotate: 90, scale: 1.1 }}
          transition={{ type: "spring", stiffness: 300 }}
          sx={{
            width: 34, // 🔥 Size thoda chhota kiya (Pehle 38 tha)
            height: 34,
            borderRadius: "10px",
            background: "linear-gradient(135deg, #2962ff 0%, #7c4dff 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            boxShadow: "0 4px 12px rgba(41, 98, 255, 0.3)",
            cursor: "pointer",
          }}
        >
          <DashboardCustomizeOutlinedIcon sx={{ fontSize: 20 }} />
        </MotionBox>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Typography
            sx={{
              fontWeight: 900,
              fontFamily: "'Poppins', sans-serif",
              fontSize: "1.1rem", // 🔥 Font size thoda kam kiya
              color: "text.primary",
              display: { xs: "none", sm: "block" },
            }}
          >
            SPERO
          </Typography>
          <Divider
            orientation="vertical"
            flexItem
            sx={{
              height: 18,
              my: "auto",
              display: { xs: "none", sm: "block" },
            }}
          />
          <Typography
            sx={{
              fontWeight: 600,
              fontFamily: "'Poppins', sans-serif",
              fontSize: "0.95rem", // 🔥 Subtext bhi thoda compact
              color: "text.secondary",
            }}
          >
            Ticket Dashboard
          </Typography>
        </Stack>
      </Stack>

      {/* RIGHT: ACTIONS */}
      <Stack direction="row" spacing={{ xs: 1.5, sm: 2 }} alignItems="center">
        {/* 🔥 1. NOTIFICATION BELL & DROPDOWN */}
        <Tooltip title="Notifications">
          <IconButton
            onClick={handleOpenNotifications}
            sx={{
              width: 36, // 🔥 Icon height kam ki
              height: 36,
              color: open ? "#2962ff" : "text.secondary",
              bgcolor: open
                ? isDark
                  ? "rgba(41,98,255,0.15)"
                  : "rgba(41,98,255,0.1)"
                : "transparent",
              "&:hover": {
                bgcolor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.04)",
                color: "#2962ff",
              },
            }}
          >
            <Badge
              badgeContent={unreadCount}
              color="error"
              sx={{
                "& .MuiBadge-badge": {
                  animation: unreadCount > 0 ? "pulse 2s infinite" : "none",
                },
                "@keyframes pulse": {
                  "0%": {
                    transform: "scale(1)",
                    boxShadow: "0 0 0 0 rgba(255, 86, 86, 0.7)",
                  },
                  "70%": {
                    transform: "scale(1)",
                    boxShadow: "0 0 0 6px rgba(255, 86, 86, 0)",
                  },
                  "100%": {
                    transform: "scale(1)",
                    boxShadow: "0 0 0 0 rgba(255, 86, 86, 0)",
                  },
                },
              }}
            >
              <NotificationsNoneOutlinedIcon sx={{ fontSize: 22 }} />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* 🔥 NOTIFICATION POPOVER */}
        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleCloseNotifications}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          PaperProps={{
            sx: {
              mt: 1.5,
              width: 360,
              borderRadius: "16px",
              bgcolor: "background.paper",
              border: 1,
              borderColor: "divider",
              boxShadow: isDark
                ? "0 10px 40px rgba(0,0,0,0.5)"
                : "0 10px 40px rgba(0,0,0,0.1)",
              overflow: "hidden",
            },
          }}
        >
          {/* Header */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}
          >
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: "15px",
                color: "text.primary",
                fontFamily: "'Poppins'",
              }}
            >
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Button
                size="small"
                onClick={handleMarkAllRead}
                sx={{
                  textTransform: "none",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                Mark all as read
              </Button>
            )}
          </Stack>

          {/* Notification List */}
          <List
            sx={{
              p: 0,
              maxHeight: 350,
              overflowY: "auto",
              "&::-webkit-scrollbar": { width: "5px" },
              "&::-webkit-scrollbar-thumb": {
                bgcolor: isDark ? "#475569" : "#cbd5e1",
                borderRadius: "10px",
              },
            }}
          >
            {notifications.map((notif) => (
              <ListItemButton
                key={notif.id}
                sx={{
                  py: 1.5,
                  px: 2,
                  borderBottom: 1,
                  borderColor: "divider",
                  bgcolor: notif.isRead
                    ? "transparent"
                    : isDark
                      ? "rgba(41,98,255,0.08)"
                      : "rgba(41,98,255,0.04)",
                  "&:hover": {
                    bgcolor: isDark
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(0,0,0,0.02)",
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      bgcolor:
                        notif.type === "sla"
                          ? "#ffebee"
                          : notif.type === "mention"
                            ? "#e8f5e9"
                            : "#e3f2fd",
                      color:
                        notif.type === "sla"
                          ? "#d32f2f"
                          : notif.type === "mention"
                            ? "#2e7d32"
                            : "#1976d2",
                      width: 40,
                      height: 40,
                    }}
                  >
                    {notif.type === "sla" ? (
                      <WarningAmberRoundedIcon />
                    ) : notif.type === "mention" ? (
                      <ChatBubbleOutlineOutlinedIcon />
                    ) : (
                      <ConfirmationNumberOutlinedIcon />
                    )}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography
                      sx={{
                        fontWeight: notif.isRead ? 600 : 800,
                        fontSize: "13px",
                        color: "text.primary",
                      }}
                    >
                      {notif.title}
                    </Typography>
                  }
                  secondary={
                    <Stack spacing={0.5} mt={0.5}>
                      <Typography
                        sx={{
                          fontSize: "12px",
                          color: "text.secondary",
                          lineHeight: 1.3,
                        }}
                      >
                        {notif.message}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "10px",
                          fontWeight: 600,
                          color: "#2962ff",
                        }}
                      >
                        {notif.time}
                      </Typography>
                    </Stack>
                  }
                />
                {!notif.isRead && (
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: "#2962ff",
                      ml: 1,
                    }}
                  />
                )}
              </ListItemButton>
            ))}
          </List>

          {/* Footer */}
          <Box
            sx={{
              p: 1,
              textAlign: "center",
              borderTop: 1,
              borderColor: "divider",
              bgcolor: isDark ? "rgba(0,0,0,0.2)" : "#f8fafc",
            }}
          >
            <Button
              fullWidth
              sx={{
                textTransform: "none",
                fontWeight: 700,
                color: "text.secondary",
                "&:hover": { color: "#2962ff", bgcolor: "transparent" },
              }}
            >
              View All Activity
            </Button>
          </Box>
        </Popover>

        {/* 2. THEME SWITCH */}
        <Tooltip title={isDark ? "Enable Light Mode" : "Enable Dark Mode"}>
          <MotionBox
            onClick={colorMode.toggleColorMode}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            sx={{
              display: "flex",
              alignItems: "center",
              position: "relative",
              p: "3px",
              borderRadius: "30px",
              bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
              border: "1px solid",
              borderColor: isDark
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.05)",
              cursor: "pointer",
              width: 64, // 🔥 Switch Width kam ki
              height: 32, // 🔥 Switch Height kam ki
            }}
          >
            <MotionBox
              animate={{ x: isDark ? 32 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              sx={{
                position: "absolute",
                width: 24, // 🔥 Inner thumb size kam ki
                height: 24,
                borderRadius: "50%",
                bgcolor: isDark ? "#1e293b" : "#ffffff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                zIndex: 1,
              }}
            />
            <Box
              sx={{
                flex: 1,
                display: "flex",
                justifyContent: "center",
                zIndex: 2,
              }}
            >
              <Brightness7Icon
                sx={{
                  fontSize: 16,
                  color: !isDark ? "#fbbf24" : "#64748b",
                  transition: "color 0.3s ease",
                }}
              />
            </Box>
            <Box
              sx={{
                flex: 1,
                display: "flex",
                justifyContent: "center",
                zIndex: 2,
              }}
            >
              <Brightness4Icon
                sx={{
                  fontSize: 16,
                  color: isDark ? "#818cf8" : "#94a3b8",
                  transition: "color 0.3s ease",
                }}
              />
            </Box>
          </MotionBox>
        </Tooltip>

        {/* 3. AVATAR */}
        {/* <Tooltip title="Account Settings">
          <IconButton sx={{ p: 0.5 }}>
            <MotionBox whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Avatar
                src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=e2e8f0"
                sx={{
                  width: 34, // 🔥 Avatar Height/Width kam ki
                  height: 34,
                  border: "2px solid",
                  borderColor: isDark ? "#2962ff" : "#cbd5e1",
                }}
              />
            </MotionBox>
          </IconButton>
        </Tooltip> */}
      </Stack>
    </Box>
  );
};

export default DashboardHeader;
