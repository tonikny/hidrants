// Context d'autenticació: gestor de sessió via cookie httpOnly, exposa user/login/logout.
// Permet a un admin "veure com" un altre rol (coordinador/voluntari) sense canviar la sessió.
import React, { createContext, useContext, useState, useEffect } from "react";

export interface User {
  id: string;
  username: string;
  adf_id: number | null;
  role: string;
  mqtt_enabled: boolean;
  permissions: string[];
}

type ViewRole = "admin" | "coordinador" | "voluntari";

const VIEW_ROLE_KEY = "hidrants_view_role";

// Mirall de la matriu de permisos del backend (back/src/permissions.ts).
const VIEW_PERMS: Record<ViewRole, string[]> = {
  admin: [
    "create_hydrant",
    "edit_hydrant",
    "delete_hydrant",
    "sync_osm",
    "view_sync_status",
    "view_osm_link",
    "view_own_adf_positions",
    "view_shared_positions",
    "view_all_positions",
    "manage_own_adf_sharing",
    "create_incidencia",
  ],
  coordinador: [
    "create_hydrant",
    "edit_hydrant",
    "delete_hydrant",
    "view_own_adf_positions",
    "view_shared_positions",
    "manage_own_adf_sharing",
    "create_incidencia",
  ],
  voluntari: ["create_hydrant", "edit_hydrant", "view_own_adf_positions", "create_incidencia"],
};

interface AuthContextType {
  user: User | null;
  token: string | null;
  actualRole: string | null;
  viewRole: ViewRole | null;
  setViewRole: (role: ViewRole | null) => void;
  login: (token: string, user: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rawUser, setRawUser] = useState<User | null>(null);
  const [viewRole, setViewRole] = useState<ViewRole | null>(() => {
    const saved = localStorage.getItem(VIEW_ROLE_KEY);
    return saved === "admin" || saved === "coordinador" || saved === "voluntari" ? saved : null;
  });
  const [activeAdfId, setActiveAdfId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Segueix l'ADF activa (emesa per AdfContext) per assignar-la quan un admin "veu com" un rol d'ADF.
  useEffect(() => {
    const handler = (e: Event) =>
      setActiveAdfId((e as CustomEvent<{ id: number | null }>).detail?.id ?? null);
    window.addEventListener("hidrant-adf-active", handler as EventListener);
    return () => window.removeEventListener("hidrant-adf-active", handler as EventListener);
  }, []);

  // Verifica la sessió al mount (la cookie auth_token la gestiona el servidor).
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await fetch("/api/auth/me", { credentials: "same-origin" });
        if (response.ok) {
          const data = await response.json();
          setRawUser(data.user);
        } else {
          setRawUser(null);
        }
      } catch {
        setRawUser(null);
      } finally {
        setLoading(false);
      }
    };
    void verifyToken();
  }, []);

  // Els usuaris no-admin no poden tenir vista "com" i es neteja en desloguejar.
  // La restauració del rol persistit la fa el lazy-init del useState.
  useEffect(() => {
    if (rawUser && rawUser.role !== "admin") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- neteja la vista "com" de l'usuari no admin
      setViewRole(null);
      localStorage.removeItem(VIEW_ROLE_KEY);
    }
  }, [rawUser]);

  // Persisteix cada canvi de vista "com".
  useEffect(() => {
    if (viewRole) {
      localStorage.setItem(VIEW_ROLE_KEY, viewRole);
    } else {
      localStorage.removeItem(VIEW_ROLE_KEY);
    }
  }, [viewRole]);

  const login = (_newToken: string, newUser: User) => {
    setRawUser(newUser);
    setViewRole(null);
  };
  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    } catch {
      /* ignore */
    }
    setRawUser(null);
    setViewRole(null);
  };

  // Usuari efectiu: si l'admin "veu com" un altre rol, s'apliquen el rol i permisos d'aquell rol
  // i l'ADF activa passa a ser la seva (com a membre d'aquesta ADF).
  const user =
    rawUser && viewRole && viewRole !== "admin"
      ? {
          ...rawUser,
          role: viewRole,
          permissions: VIEW_PERMS[viewRole],
          adf_id: rawUser.adf_id ?? activeAdfId ?? null,
        }
      : rawUser;

  return (
    <AuthContext.Provider
      value={{
        user,
        token: null,
        actualRole: rawUser?.role ?? null,
        viewRole,
        setViewRole,
        login,
        logout: () => {
          void logout();
        },
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components -- el hook ha de viure amb el context (patró canònic React)
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
