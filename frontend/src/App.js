import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginSeite from "./LoginSeite";
import PatientenSeite from "./PatientenSeite";
// eslint-disable-next-line no-unused-vars
import KalenderSeite from "./KalenderSeite";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginSeite />} />
        <Route path="/patienten" element={<PatientenSeite />} />
        <Route path="/kalender/:id" element={<KalenderSeite />} />
        <Route path="*" element={<LoginSeite />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;