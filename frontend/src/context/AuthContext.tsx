import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "../lib/api";
import type { User } from "../types/api";

export type DonneesInscription = {
    name: string;
    email: string;
    telephone: string;
    password: string;
    password_confirmation: string;
};

type AuthContextValue = {
    user: User | null;
    loading: boolean;
    refetch: () => void;
    setUser: (user: User | null) => void;
    login: (email: string, password: string) => Promise<User>;
    register: (donnees: DonneesInscription) => Promise<User>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const charger = useCallback((silencieux: boolean) => {
        if (!silencieux) setLoading(true);
        api<User>("/api/user")
            .then(setUser)
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        charger(false);
    }, [charger]);

    const refetch = useCallback(() => charger(true), [charger]);

    const login = useCallback(async (email: string, password: string) => {
        await api("/login", { method: "POST", body: { email, password } });
        const freshUser = await api<User>("/api/user");
        setUser(freshUser);
        return freshUser;
    }, []);

    const register = useCallback(async (donnees: DonneesInscription) => {
        await api("/register", {
            method: "POST",
            body: { ...donnees, telephone: donnees.telephone.trim() || null },
        });
        const freshUser = await api<User>("/api/user");
        setUser(freshUser);
        return freshUser;
    }, []);

    const logout = useCallback(async () => {
        await api("/logout", { method: "POST" });
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, refetch, setUser, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth doit être utilisé dans un AuthProvider");
    return ctx;
}