import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, Box } from "@mui/material";
import SpeedIcon from "@mui/icons-material/Speed";
import SensorsIcon from "@mui/icons-material/Sensors";
import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import BoltIcon from "@mui/icons-material/Bolt";
import SettingsIcon from "@mui/icons-material/Settings";
import TroubleshootIcon from "@mui/icons-material/Troubleshoot";
import LightbulbIcon from "@mui/icons-material/Lightbulb";

const menu = [
  { label: "Dashboard", icon: <SpeedIcon fontSize="small" /> },
  { label: "Diagnosis", icon: <TroubleshootIcon fontSize="small" /> },
  { label: "Recommendations", icon: <LightbulbIcon fontSize="small" /> },
  { label: "Telemetry", icon: <SensorsIcon fontSize="small" /> },
  { label: "Slow Queries", icon: <HourglassBottomIcon fontSize="small" /> },
  { label: "Query Analyzer", icon: <QueryStatsIcon fontSize="small" /> },
  { label: "Index Advisor", icon: <BoltIcon fontSize="small" /> },
  { label: "Settings", icon: <SettingsIcon fontSize="small" /> },
];

const DRAWER_WIDTH = 220;

function Sidebar({ activeIndex, onSelect }) {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: DRAWER_WIDTH,
          boxSizing: "border-box",
          bgcolor: "#0C0C0E",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        },
      }}
    >
      <Box sx={{ height: 64 }} />
      <List sx={{ px: 1.5, pt: 2 }}>
        {menu.map((item, i) => (
          <ListItemButton
            key={item.label}
            selected={activeIndex === i}
            onClick={() => onSelect(i)}
            sx={{
              borderRadius: 1.5,
              mb: 0.25,
              py: 0.75,
              color: activeIndex === i ? "#EDEDEF" : "#6B6B73",
              "&.Mui-selected": {
                bgcolor: "rgba(255,255,255,0.05)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.07)" },
              },
              "&:hover": { bgcolor: "rgba(255,255,255,0.03)" },
            }}
          >
            <ListItemIcon sx={{ minWidth: 32, color: "inherit" }}>{item.icon}</ListItemIcon>
            <ListItemText
              primary={item.label}
              slotProps={{
                primary: { fontSize: 14.5, fontWeight: activeIndex === i ? 500 : 400 },
              }}
            />
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  );
}

export default Sidebar;