import SpotifyWebApi from 'spotify-web-api-js';

// Wrapper for a wrapper :D
export default class Spotify {
    static spotifyApi = new SpotifyWebApi();

    static setToken(token) {
        this.spotifyApi.setAccessToken(token);
    }
    static getCurrentTrack() {
        return Spotify.spotifyApi.getMyCurrentPlayingTrack()
            .then(response => {
                return response.item.name;
            })
            .catch(err => {
                console.error(err);
                return null;
            });
    }
}