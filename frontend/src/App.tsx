import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RegisterForm from "./components/RegisterForm";
import LoginForm from "./components/LoginForm";
import AdminDemo from "./components/AdminDemo";
import HashCasesDemo from "./components/HashCasesDemo";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default → login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        {/* Dev-only pages */}
        <Route path="/admin/users-demo" element={<AdminDemo />} />
        <Route path="/demo/hash-cases" element={<HashCasesDemo />} />
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
