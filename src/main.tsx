import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "./styles.css";
import { App } from "./App";
import { applyTheme, savedThemeId } from "./themes";

// Re-apply the saved theme through the full registry (index.html already
// applied the cached vars pre-paint; this keeps them in sync with the app).
applyTheme(savedThemeId());

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
