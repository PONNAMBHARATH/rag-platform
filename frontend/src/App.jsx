import { useAuth } from "./context/AuthContext";
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

  return <Chat />;
}

export default App;