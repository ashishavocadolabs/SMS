import { Navigate } from "react-router-dom";
import type { Role } from "../types";
import { useAuth } from "../contexts/AuthContext";

interface Props {
  requiredRole: Role;
  children: React.ReactNode;
}

export function ProtectedRoute({ requiredRole, children }: Props) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to={`/${requiredRole}/login`} replace />;
  }

  if (user.role !== requiredRole) {
    // If user is logged in with the wrong role, send them back to their own dashboard.
    return <Navigate to={`/${user.role}`} replace />;
  }

  return <>{children}</>;
}

