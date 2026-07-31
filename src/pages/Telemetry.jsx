import { Box, Typography, CircularProgress, Table, TableHead, TableBody, TableRow, TableCell, Paper } from "@mui/material";
import Header from "../components/Header";
import useDashboardMetrics from "../hooks/useDashboardMetrics";
import { useSelectedApp } from "../contexts/AppContext";

function statusStyle(status) {
  if (status >= 500) return { text: "#F5A3A3", bg: "rgba(229,72,77,0.12)" };
  if (status >= 400) return { text: "#F0C989", bg: "rgba(217,162,75,0.12)" };
  if (status >= 200) return { text: "#8FD9A8", bg: "rgba(143,217,168,0.12)" };
  return { text: "#8C8C93", bg: "rgba(255,255,255,0.06)" };
}

function StatusTag({ status }) {
  const s = statusStyle(status);
  return (
    <Typography
      sx={{
        display: "inline-block",
        fontFamily: "ui-monospace, monospace",
        fontSize: 12,
        color: s.text,
        backgroundColor: s.bg,
        padding: "2px 8px",
        borderRadius: 10,
      }}
    >
      {status}
    </Typography>
  );
}

function TelemetryTable({ title, rows, emptyMessage }) {
  return (
    <Box sx={{ marginBottom: 4 }}>
      <Typography sx={{ fontSize: 15.5, fontWeight: 500, color: "#EDEDEF", marginBottom: 1.5 }}>
        {title}
      </Typography>
      {rows.length === 0 ? (
        <Typography sx={{ fontSize: 14.5, color: "text.secondary" }}>{emptyMessage}</Typography>
      ) : (
        <Paper
          variant="outlined"
          sx={{ backgroundColor: "#111113", borderColor: "rgba(255,255,255,0.07)", borderRadius: "10px" }}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                {["Endpoint", "Method", "Status", "Duration", "Timestamp"].map((h) => (
                  <TableCell
                    key={h}
                    sx={{ fontSize: 12, color: "text.disabled", textTransform: "uppercase", letterSpacing: "0.05em", borderColor: "rgba(255,255,255,0.06)" }}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={i}>
                  <TableCell sx={{ fontFamily: "ui-monospace, monospace", fontSize: 13.5, color: "#EDEDEF", borderColor: "rgba(255,255,255,0.05)" }}>
                    {row.endpoint}
                  </TableCell>
                  <TableCell sx={{ fontSize: 13.5, color: "text.secondary", borderColor: "rgba(255,255,255,0.05)" }}>
                    {row.method}
                  </TableCell>
                  <TableCell sx={{ borderColor: "rgba(255,255,255,0.05)" }}>
                    <StatusTag status={row.status} />
                  </TableCell>
                  <TableCell sx={{ fontFamily: "ui-monospace, monospace", fontSize: 13.5, color: "#D4D4D8", fontVariantNumeric: "tabular-nums", borderColor: "rgba(255,255,255,0.05)" }}>
                    {row.durationMs != null ? `${row.durationMs}ms` : "—"}
                  </TableCell>
                  <TableCell sx={{ fontFamily: "ui-monospace, monospace", fontSize: 12.5, color: "text.disabled", borderColor: "rgba(255,255,255,0.05)" }}>
                    {row.timestamp ? new Date(row.timestamp).toLocaleString() : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
}

function Telemetry() {
  const { selectedApp } = useSelectedApp();
  const { recent, errors, loading, error } = useDashboardMetrics({ applicationName: selectedApp });

  const safeRecent = Array.isArray(recent) ? recent : [];
  const safeErrors = Array.isArray(errors) ? errors : [];

  return (
    <>
      <Header />
      <Box sx={{ marginLeft: "220px", marginTop: "64px", padding: 4 }}>

        {error && (
          <Typography
            sx={{
              display: "inline-block",
              fontSize: 13.5,
              color: "#F5A3A3",
              border: "1px solid rgba(229,72,77,0.25)",
              backgroundColor: "rgba(229,72,77,0.08)",
              borderRadius: 10,
              padding: "4px 12px",
              marginBottom: 2,
            }}
          >
            Could not reach VeloxDiag server — showing last known data
          </Typography>
        )}

        <Typography sx={{ fontSize: 16.5, fontWeight: 500, color: "#EDEDEF", marginBottom: 3 }}>
          Telemetry
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", padding: 8 }}>
            <CircularProgress size={24} sx={{ color: "text.disabled" }} />
          </Box>
        ) : (
          <>
            <TelemetryTable title="Recent Requests" rows={safeRecent} emptyMessage="No recent requests recorded." />
            <TelemetryTable title="Recent Errors" rows={safeErrors} emptyMessage="No errors recorded." />
          </>
        )}
      </Box>
    </>
  );
}

export default Telemetry;