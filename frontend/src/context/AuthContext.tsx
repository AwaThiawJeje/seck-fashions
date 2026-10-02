import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "../lib/api";
import type { User } from "../types/api";

type AuthContextValue = {
    user: User | null;
    loading: boolean;
    refetch: () => void;
    login: (email: string, password: string) => Promise<User>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const charger = useCallback(() => {
        setLoading(true);
        api<User>("/api/user")
            .then(setUser)
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        charger();
    }, [charger]);

    const login = useCallback(async (email: string, password: string) => {
        await api("/login", { method: "POST", body: { email, password } });
        const freshUser = await api<User>("/api/user");
        setUser(freshUser);
        return freshUser;
    }, []);

    const logout = useCallback(async () => {
        await api("/logout", { method: "POST" });
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, refetch: charger, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth doit être utilisé dans un AuthProvider");
    return ctx;
}