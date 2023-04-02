export default {
    MODE: process.env.PRODUCTION ? "production" : "development",
    CLIENT_ID: process.env.CLIENT_ID,
    CLIENT_SECRET: process.env.CLIENT_SECRET,
    SPOTIFY_AUTH_URL: "https://accounts.spotify.com/authorize",
    SPOTIFY_TOKEN_URL: "https://accounts.spotify.com/api/token",
    SPOTIFY_SAFE_ALBUM_URL: "https://api.spotify.com/v1/me/albums",
    SPOTIFY_SEARCH_URL: "https://api.spotify.com/v1/search",
    SPOTIFY_USERNAME: process.env.SPOTIFY_USERNAME,
    SPOTIFY_MAIL: process.env.SPOTIFY_MAIL,
    SPOTIFY_PW: process.env.SPOTIFY_PW,
    SPOTIFY_REDIRECT_URL: "http://localhost:8080/index.html",
    SPUTNIKMUSIC_URL: "https://www.sputnikmusic.com/bestnewmusic",
    METACRITIC_URL: "https://www.metacritic.com/browse/albums/score/metascore/90day/filtered?view=condensed"
};
