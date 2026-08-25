import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminApp from "./admin/AdminApp.jsx";
import StudentApp from "./student/StudentApp.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/store" replace />} />
        <Route path="ManarAlMoslhienSomo/admin/*" element={<AdminApp />} />
        <Route path="/store/*" element={<StudentApp />} />
      </Routes>
    </BrowserRouter>
  );
}
