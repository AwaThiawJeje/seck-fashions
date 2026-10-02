import { useEffect, useState } from "react";
import { api } from "../lib/api";

type Parametres = {
    whatsapp_numero: string | null;
};

export function useParametres() {
    const [parametres, setParametres] = useState<Parametres | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api<Parametres>("/api/parametres")
            .then(setParametres)
            .catch(() => setParametres(null))
            .finally(() => setLoading(false));
    }, []);

    return { parametres, loading };
}