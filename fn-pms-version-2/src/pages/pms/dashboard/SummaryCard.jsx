import { Card, Box, Typography, useTheme } from "@mui/material";

const SummaryCard = ({ title, count, icon, color, onClick }) => {
  const theme = useTheme(); // detects light/dark mode

  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: "pointer",
        backgroundColor: theme.palette.mode === "dark" ? "#1e1e2f" : "#fff",
        borderRadius: 2,
        p: 2,
        display: "flex",
        alignItems: "center",
        gap: 2, // better spacing
        transition: "transform 0.3s, box-shadow 0.3s",
        boxShadow:
          theme.palette.mode === "dark"
            ? "0 4px 8px rgba(0,0,0,0.6)"
            : "0 2px 6px rgba(0,0,0,0.15)",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 8px 16px rgba(0,0,0,0.8)"
              : "0 4px 12px rgba(0,0,0,0.2)",
        },
      }}
    >
      {/* Left side: count + title */}
      <Box sx={{ flex: 1 }}>
        <Typography
          variant="h5"
          fontWeight={700}
          sx={{
            color: theme.palette.mode === "dark" ? "#fff" : "#111",
            mb: 0.5,
          }}
        >
          {count}
        </Typography>
        <Typography
          variant="subtitle2"
          width={"200px"}
          sx={{
            color: theme.palette.mode === "dark" ? "#aaa" : "#555",
            textTransform: "uppercase",
          }}
          title={title}
        >
          {title}
        </Typography>
      </Box>

      {/* Right side: icon */}
      <Box
        sx={{
          width: 40,
          height: 40,
          minWidth: 40,
          borderRadius: "50%",
          backgroundColor: `${color}22`, // subtle tint
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: color,
          fontSize: 24, // smaller, fits better
        }}
      >
        {icon}
      </Box>
    </Card>
  );
};

export default SummaryCard;
