import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";

const App = lazy(() => import("./App"));

const root = ReactDOM.createRoot(
  document.getElementById("root")
);

root.render(
  <React.StrictMode>
    <Suspense fallback={<div>Loading the dashboard dear admin...</div>}>
      <App />
    </Suspense>
  </React.StrictMode>
);