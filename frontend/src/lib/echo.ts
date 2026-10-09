import Echo from "laravel-echo";
import Pusher from "pusher-js";

// @ts-expect-error — Echo veut Pusher sur window, pas en import ES.
window.Pusher = Pusher;

// Connexion directe au serveur Reverb (pas besoin du proxy Vite : les WebSocket
// ne sont pas soumis à CORS comme fetch/XHR, et Reverb autorise déjà toutes
// les origines en dev — voir config/reverb.php, allowed_origins => ['*']).
export const echo = new Echo({
    broadcaster: "reverb",
    key: "4yxocf6w2wowkjfflkum",
    wsHost: "127.0.0.1",
    wsPort: 8080,
    forceTLS: false,
    enabledTransports: ["ws"],
});
