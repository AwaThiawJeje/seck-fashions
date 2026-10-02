import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "../lib/api";
import type { User } from "../types/api";

type AuthContextValue = {
    user: User | null;
    loading: boolean;
    refetch: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const charger = () => {
        setLoading(true);
        api<User>("/api/user")
            .then(setUser)
            .catch(() => setUser(null)) // 401 = pas connecté, c'est un état normal, pas une erreur
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        charger();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, refetch: charger }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth doit être utilisé dans un AuthProvider");
    return ctx;
}