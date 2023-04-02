# spotify-add-album
Adds the newest best albums from a website to spotify

* https://www.sputnikmusic.com/
* https://www.metacritic.com/
* TODO: https://www.allmusic.com/

## Usage

1. Create a .env file at the top level

```env
CLIENT_ID=<spotify API>
CLIENT_SECRET=<spotify API>
SPOTIFY_USERNAME=<username from spotify account>
SPOTIFY_MAIL=<mail from spotify account>
SPOTIFY_PW=<pw from spotify account>
```

2. Use it:
```typescript

import 'dotenv/config';
import { Websites } from "./typings/website-helper.js";
import { default as CONSTANTS } from "./constants.js";
import { getAlbumsFromWebsite } from "./website-helper.js";
import { addAlbumsToSpotify } from "./spotify-helper.js";

const albumNames = await getAlbumsFromWebsite([
    Websites.metacritic,
    Websites.sputnikmusic
]);
const result = await addAlbumsToSpotify(
    albumNames,
    {
        user: CONSTANTS.SPOTIFY_USERNAME,
        pw: CONSTANTS.SPOTIFY_PW
    }
);

```