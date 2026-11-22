import { useAuth } from "./context/AuthContext";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Auth from "./components/Auth";
import { ForgotPassword, ResetPassword } from "./components/PasswordRecovery";
import Chat from "./pages/Chat";

function App() {
  const { user, loading, isRecoverySession } = useAuth();
  const { pathname } = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (pathname === "/reset-password") {
    return <ResetPassword isRecoverySession={isRecoverySession} />;
  }

  if (isRecoverySession) {
    return <Navigate to="/reset-password" replace />;
  }

  if (pathname === "/forgot-password") {
    return <ForgotPassword />;
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/chat" replace />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/chat/:conversationId" element={<Chat />} />
      <Route path="/documents" element={<Chat />} />
      <Route path="/login" element={<Auth />} />
      <Route path="*" element={<Navigate to="/chat" replace />} />
    </Routes>
  );
}

export default App;