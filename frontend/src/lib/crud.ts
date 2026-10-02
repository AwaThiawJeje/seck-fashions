import { ApiError } from "./api";

export function extraireMessageErreur(err: unknown): string {
    if (err instanceof ApiError) {
        if (err.errors) {
            const premiers = Object.values(err.errors).map((msgs) => msgs[0]);
            if (premiers.length > 0) return premiers.join(" ");
        }
        return err.message;
    }
    return "Une erreur est survenue, réessaie.";
}