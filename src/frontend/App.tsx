import React from "react";
import { BrowserRouter } from "react-router-dom";
import Routes from "./Routes.jsx";

import { QueryProvider, PolarisProvider } from "./components/index.js";

export default function App() {
  const pages = (import.meta as any).globEager(
    "./pages/**/!(*.test.[jt]sx)*.([jt]sx)"
  ) as any;

  return (
    <PolarisProvider>
      <BrowserRouter>
        <QueryProvider>
          <Routes pages={pages} />
        </QueryProvider>
      </BrowserRouter>
    </PolarisProvider>
  );
}
