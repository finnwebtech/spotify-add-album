import 'dotenv/config';
import { default as CONSTANTS } from "./constants.js";
import { getAlbumsFromWebsite } from "./website-helper.js";
import { addAlbumsToSpotify, login } from "./spotify-helper.js";

if (CONSTANTS.MODE === "development") {
    console.log("> Configuration");
    console.log(CONSTANTS);
}

const albumNames = await getAlbumsFromWebsite("https://www.sputnikmusic.com/bestnewmusic");
const token = await login(
    CONSTANTS.SPOTIFY_USERNAME,
    CONSTANTS.SPOTIFY_PW
);
addAlbumsToSpotify(albumNames, {
    token: token
});