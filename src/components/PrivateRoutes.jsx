import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function PrivateRoutes({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="text-center">Loading workspace...</div>;
  if (!user) return <Navigate to="/login" />;

  return children;
}

export default PrivateRoutes;
