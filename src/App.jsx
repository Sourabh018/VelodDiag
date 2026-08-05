import { useState } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Diagnosis from "./pages/Diagnosis";
import Recommendations from "./pages/Recommendations";
import Telemetry from "./pages/Telemetry";
import SlowQueries from "./pages/SlowQueries";
import QueryAnalyzer from "./pages/QueryAnalyzer";
import IndexAdvisor from "./pages/IndexAdvisor";
import ChatPage from "./pages/ChatPage";
import Settings from "./pages/Settings";
import { AppProvider } from "./contexts/AppContext";

// Sidebar order: Dashboard, Diagnosis, Recommendations, Telemetry, Slow Queries,
// Query Analyzer, Index Advisor, Ask VeloxDiag, Settings — must match Sidebar.jsx's
// menu array order exactly, since activeIndex is a plain array index into both.
const pages = [Dashboard, Diagnosis, Recommendations, Telemetry, SlowQueries, QueryAnalyzer, IndexAdvisor, ChatPage, Settings];

function App() {
  const [activeIndex, setActiveIndex] = useState(0);
  const ActivePage = pages[activeIndex] ?? Dashboard;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppProvider>
        <Sidebar activeIndex={activeIndex} onSelect={setActiveIndex} />
        <ActivePage />
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;