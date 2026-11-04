import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

// Import the generated route tree
import { queryClient } from "@/lib/tanstack/query-client";
import { routeTree } from "./routeTree.gen";

// react-scan (đo re-render) chỉ nạp khi dev và khi bật VITE_REACT_SCAN=true => không vào bundle production
if (import.meta.env.DEV && import.meta.env.VITE_REACT_SCAN === "true") {
  void import("react-scan").then(({ scan }) => scan({ enabled: true }));
}

// Create a new router instance
const router = createRouter({
  routeTree,
  scrollRestoration: true, // enables built-in scroll restoration
  scrollToTopSelectors: ["main"], // your main scrollable container
  getScrollRestorationKey: (location) => location.pathname, // optional
  scrollRestorationBehavior: "instant" // optional, can be 'smooth', 'instant', 'auto'
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Render the app
const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </StrictMode>
  );
}
