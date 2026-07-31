import { useEffect, useState } from "react";
import { Select, MenuItem, FormControl } from "@mui/material";
import apiClient from "../api/client";
import { useSelectedApp } from "../contexts/AppContext";

function AppSelector() {
  const { selectedApp, setSelectedApp } = useSelectedApp();
  const [apps, setApps] = useState([]);

  useEffect(() => {
    apiClient
      .get("/api/dashboard/applications")
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        setApps(list);
        // No more "All Apps" — default to the first real app once loaded,
        // unless selectedApp already points at a valid one (e.g. page refresh).
        if (list.length > 0 && (!selectedApp || selectedApp === "all" || !list.includes(selectedApp))) {
          setSelectedApp(list[0]);
        }
      })
      .catch((err) => console.error("Fetch applications failed:", err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <FormControl size="small" sx={{ minWidth: 160 }}>
      <Select
        value={apps.includes(selectedApp) ? selectedApp : ""}
        onChange={(e) => setSelectedApp(e.target.value)}
        displayEmpty
        sx={{
          backgroundColor: "#111113",
          color: "#EDEDEF",
          fontSize: 14,
          borderRadius: "8px",
          "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.2)" },
        }}
      >
        {apps.length === 0 && (
          <MenuItem value="" disabled>
            Loading…
          </MenuItem>
        )}
        {apps.map((name) => (
          <MenuItem key={name} value={name}>
            {name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default AppSelector;