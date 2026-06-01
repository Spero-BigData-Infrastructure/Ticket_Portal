import { Box, Typography, Link, useTheme } from "@mui/material";

const Footer = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      component="footer"
      sx={{
        width: "100%",
        py: 0.8, // 🔥 Height kam karne ke liye padding kam ki (1.5 se 0.8 kar di)
        px: 2,
        textAlign: "center",
        borderTop: 1,
        borderColor: "divider",
        bgcolor: isDark ? "background.paper" : "#f8fafc",
      }}
    >
      <Typography
        variant="body2"
        sx={{
          color: "text.secondary",
          fontFamily: "'Poppins', sans-serif",
          fontWeight: 500,
          fontSize: "12px",
          lineHeight: 1.2, // 🔥 Line height ko bhi tight kiya taaki aur slim lage
        }}
      >
        Powered by{" "}
        <Link
          href="#"
          underline="none"
          sx={{
            color: isDark ? "#82b1ff" : "#2962ff",
            fontWeight: 700,
            transition: "all 0.3s ease",
            "&:hover": {
              color: isDark ? "#b388ff" : "#7c4dff",
              textDecoration: "underline",
            },
          }}
        >
          Spero
        </Link>
      </Typography>
    </Box>
  );
};

export default Footer;
