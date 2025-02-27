import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import App from "./App.tsx";
import "./index.css";
import { MediaProvider } from "./context/MediaContext.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <MediaProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/join/:classId" element={<App />} />
      </Routes>
    </BrowserRouter>
  </MediaProvider>
);
