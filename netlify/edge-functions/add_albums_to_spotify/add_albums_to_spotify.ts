import type { Context } from "https://edge.netlify.com";

import 'dotenv/config';
import { default as CONSTANTS } from "../../../src/constants.js";
import { getAlbumsFromWebsite } from "../../../src/website-helper.js";
import { addAlbumsToSpotify, login } from "../../../src/spotify-helper.js";

export default async (request: Request, context: Context) => {
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

  return context.json({ hello: "world" });
};