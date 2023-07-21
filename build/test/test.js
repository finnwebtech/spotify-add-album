import 'dotenv/config';
import { default as CONSTANTS } from "../src/constants.js";
import { getAlbumsFromWebsite } from "../src/website-helper.js";
import { addAlbumsToSpotify } from "../src/spotify-helper.js";
const albumNames = await getAlbumsFromWebsite([
    "metacritic",
    "sputnikmusic"
]);
const result = await addAlbumsToSpotify(albumNames, {
    user: CONSTANTS.SPOTIFY_USERNAME,
    pw: CONSTANTS.SPOTIFY_PW
});
console.log(result);
