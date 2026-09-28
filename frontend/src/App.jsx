import { useAuth } from "./context/AuthContext";
import { Navigate, Route, Routes } from "react-router-dom";
import Auth from "./components/Auth";
import Chat from "./pages/Chat";

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
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