import queryString from 'query-string';

let token = {
    get() {
        return window.localStorage.getItem("spotifyToken");
    },
    set(token) {
        window.localStorage.setItem("spotifyToken", token);
    },
    clear() {
        window.localStorage.removeItem("spotifyToken");
    },
    grab(){
        let hash = window.location.hash;
        hash = hash.substring(1).split("&").find(elem => elem.startsWith("access_token")).split("=")[1];
        hash = decodeURIComponent(hash);
        window.localStorage.setItem("spotifyToken", hash);
        window.location.hash = ""
    }
};

let authLink = 'https://accounts.spotify.com/authorize?' + queryString.stringify({
    response_type: 'token',
    scope: 'user-read-private user-read-email user-read-playback-state',
    client_id: process.env.REACT_APP_CLIENT_ID,
    redirect_uri: process.env.REACT_APP_REDIRECT_URI
});

export {token, authLink};