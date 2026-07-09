import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicRoute>
      <Login />
    </PublicRoute>} />
        <Route path="/register" element={<PublicRoute>
      <Register />
    </PublicRoute>} />
        <Route path="/chat" element={<ProtectedRoute>
              <Chat />
            </ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute>
              <Profile />
            </ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;