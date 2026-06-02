import { Box, Typography, Link, useTheme } from "@mui/material";
// 🔥 Apna logo yahan import kar lena (path apne folder structure ke hisaab se adjust karein)
// import speroLogo from "../../assets/logo.png";

const Footer = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      component="footer"
      sx={{
        width: "100%",
        py: 0.8, // Slim height
        px: 2,
        display: "flex",
        justifyContent: "center", // Content ko center mein rakhne ke liye
        alignItems: "center",
        borderTop: 1,
        borderColor: "divider",
        bgcolor: isDark ? "background.paper" : "#f8fafc",
      }}
    >
      <Typography
        variant="body2"
        component="div" // Typography ke andar flex use karne ke liye div banaya
        sx={{
          color: "text.secondary",
          fontFamily: "'Poppins', sans-serif",
          fontWeight: 500,
          fontSize: "12px",
          lineHeight: 1.2,
          display: "flex",
          alignItems: "center",
          gap: 0.8, // Text aur Image ke beech ka gap
        }}
      >
        Powered by
        <Link
          href="#"
          underline="none"
          sx={{
            display: "flex",
            alignItems: "center",
            transition: "all 0.3s ease",
            "&:hover": {
              opacity: 0.8, // Hover par thoda fade effect
            },
          }}
        >
          {/* 🔥 Spero Image Yahan Hai */}
          <img
            src="../../../public/Spero w-01 3 (1).png" // Agar public folder mein hai toh aise direct de sakte hain, warna upar wala import use karein
            alt="Spero"
            style={{
              height: "30px", // Footer ki height ke hisaab se image ko scale kiya
              width: "auto",
              objectFit: "contain",
              
              filter: isDark ? "brightness(0) invert(1)" : "none"
            }}
          />
        </Link>
      </Typography>
    </Box>
  );
};

export default Footer;
