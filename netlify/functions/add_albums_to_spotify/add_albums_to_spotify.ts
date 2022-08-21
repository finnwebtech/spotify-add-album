import 'dotenv/config';
import { schedule } from '@netlify/functions';
import { default as CONSTANTS } from "../../../src/constants.js";
import { getAlbumsFromWebsite } from "../../../src/website-helper.js";
import { addAlbumsToSpotify, login } from "../../../src/spotify-helper.js"

// To learn about scheduled functions and supported cron extensions, 
// see: https://ntl.fyi/sched-func
export const handler = schedule("@hourly", async (event) => {
    const eventBody = JSON.parse(event.body);
    console.log(`Next function run at ${eventBody.next_run}.`);

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

    return {
        statusCode: 200
    };
});
