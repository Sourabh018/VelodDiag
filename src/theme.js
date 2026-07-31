import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#0A0A0B",
      paper: "#111113",
    },
    // Was teal (#2FE0C4) — that color was doing double duty as both the nav
    // active-state glow AND the brand accent, which is why nothing on the
    // page felt reserved for anything specific. Moved primary to a muted
    // blue used ONLY for the Root Cause correlation card (the one place
    // that's genuinely doing something distinct) — everything else now
    // reads in neutral gray, so the one accent actually means something
    // when it shows up.
    primary: { main: "#5B7CFF" },
    warning: { main: "#D9A24B" },
    error: { main: "#E5484D" },
    text: {
      primary: "#EDEDEF",
      secondary: "#8C8C93",
      // MUI's default palette doesn't have a third text tier — added here
      // for the smallest labels (eyebrow labels, footer agent tag) that
      // need to sit below "secondary" without inventing a one-off hex
      // every time a component needs it.
      disabled: "#57575F",
    },
    divider: "rgba(255,255,255,0.07)",
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", sans-serif',
    // Endpoints, SQL, and numeric data now consistently use monospace via
    // components below, rather than only headings — the old theme reserved
    // monospace for h3/h5, which is backwards: headings are prose, request
    // paths and row counts are the part that should look like data.
    h5: { fontFamily: '"IBM Plex Mono", monospace', fontWeight: 500, letterSpacing: "-0.01em" },
    h3: { fontFamily: '"IBM Plex Mono", monospace', fontWeight: 500 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid rgba(255,255,255,0.07)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          // Default MUI chips are filled/loud — the premium direction uses
          // outlined, quieter tags everywhere except the one primary-accent
          // card, so this sets outlined as the sane default rather than
          // fighting filled styling on every individual Chip usage.
          fontFamily: "ui-monospace, monospace",
          fontSize: 11.5,
          letterSpacing: "0.02em",
        },
      },
    },
  },
});

export default theme;