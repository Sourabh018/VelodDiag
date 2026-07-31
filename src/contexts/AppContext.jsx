import { createContext, useContext, useState } from "react";

const AppContext = createContext(null);

// No "all"/combined view anymore — always scoped to one real app.
// Starts null; AppSelector sets it to the first real app once the
// application list loads. Pages should treat null as "not ready yet",
// not as "show everything."
export function AppProvider({ children }) {
  const [selectedApp, setSelectedApp] = useState(null);
  return (
    <AppContext.Provider value={{ selectedApp, setSelectedApp }}>
      {children}
    </AppContext.Provider>
  );
}

export function useSelectedApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useSelectedApp must be used inside AppProvider");
  return ctx;
}