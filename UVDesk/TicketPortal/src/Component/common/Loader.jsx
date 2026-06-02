
import { Box, Typography, CircularProgress } from "@mui/material";
import { motion } from "framer-motion";

function Loader() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh", // 🔥 Poori screen cover karega
        width: "100%",
        backgroundColor: "#f4f7fb", // Dashboard ke theme se match karta background
        overflow: "hidden",
      }}
    >
      {/* 1. Main Wrapper: Page load hote hi halka sa scale aur fade in hoga */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* 2. Spinner: Continuous Floating Effect (Upar-Niche) */}
        <motion.div
          animate={{ y: [0, -10, 0] }} // 🔥 Hawa me tairne jaisa effect
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        >
          <Box sx={{ position: "relative", display: "inline-flex", mb: 4 }}>
            {/* Background Ring (Faded) */}
            <CircularProgress
              variant="determinate"
              value={100}
              size={68} // Thoda sa bada kiya for better presence
              thickness={4.5}
              sx={{ color: "#e2e8f0" }}
            />
            {/* Foreground Spinning Ring (Brand Color) */}
            <CircularProgress
              variant="indeterminate"
              disableShrink
              size={68}
              thickness={4.5}
              sx={{
                color: "#2962ff",
                animationDuration: "1.2s",
                position: "absolute",
                left: 0,
                "& .MuiCircularProgress-circle": {
                  strokeLinecap: "round",
                },
                boxShadow: "0px 4px 15px rgba(41, 98, 255, 0.2)", // 🔥 Halka sa glow
                borderRadius: "50%",
              }}
            />
          </Box>
        </motion.div>

        {/* 3. Loading Text: Spinner aane ke thodi der baad smoothly slide-up hoga */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
        >
          <Typography
            variant="h6"
            sx={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 700,
              color: "#1e293b",
              letterSpacing: 0.5,
              textAlign: "center",
            }}
          >
            Loading Dashboard...
          </Typography>
        </motion.div>

        {/* 4. Subtext: Title ke bhi thodi der baad aayega (Staggered Effect) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
        >
          <Typography
            variant="body2"
            sx={{
              fontFamily: "'Poppins', sans-serif",
              color: "#64748b",
              fontWeight: 500,
              mt: 1,
              textAlign: "center",
            }}
          >
            Fetching the latest tickets for you
          </Typography>
        </motion.div>
      </motion.div>
    </Box>
  );
}

export default Loader;
