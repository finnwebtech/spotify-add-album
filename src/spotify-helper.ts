import { default as CONSTANTS } from "./constants.js";
import fetch from "node-fetch";
import playwright from "playwright-aws-lambda";
import { URLSearchParams } from "url";
interface AccessTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
}

interface AuthorizationCodeResponse {
    code: string;
    state: string;
}

interface ISearchAlbumResponseItem {
    album_type: string;
    artists: Array<any>;
    available_markets: Array<any>;
    external_urls: object;
    href: string;
    id: string;
    images: Array<any>;
    name: string;
    release_date: string;
    release_date_precision: string;
    total_tracks: number;
    type: string;
    uri: string;
}

interface ISearchAlbumResponse {
    href: string;
    items: Array<ISearchAlbumResponseItem>;
    limit: number;
    next: string;
    offset: number;
    previous: number | null;
    total: number;
}

interface ISpotifyQuery {
    token: string;
}

/**
 * Login and get the access token for the API calls
 * @param user username
 * @param pw password
 */
export async function login(user: string, pw: string) {
    const authCode = await getAuthorizationCode(user, pw);
    const token = await getAccessToken(CONSTANTS.CLIENT_ID, CONSTANTS.CLIENT_SECRET, authCode.code);
    return token;
}

/**
 * Get autorization from user to change profile
 * @param user username
 * @param pw password
 */
export async function getAuthorizationCode(user: string, pw: string): Promise<AuthorizationCodeResponse> {
    const browser = await playwright.launchChromium({
        headless: CONSTANTS.MODE === "production" ? true : false
    });
    const context = await browser.newContext({
        locale: "de"
    });

    const page = await context.newPage();
    await page.goto(CONSTANTS.SPOTIFY_AUTH_URL + "?" + new URLSearchParams({
        response_type: 'code',
        client_id: CONSTANTS.CLIENT_ID,
        scope: "user-library-read user-library-modify",
        redirect_uri: CONSTANTS.SPOTIFY_REDIRECT_URL,
        state: generateRandomString(20)
    }));
    await page.locator('input#login-username').fill(user);
    await page.locator('input#login-password').fill(pw);
    // await page.locator('text=Anmelden').click();
    // await page.locator('text=ICH STIMME ZU').click();

    const [request] = await Promise.all([
        page.waitForRequest(url => url.url().includes(CONSTANTS.SPOTIFY_REDIRECT_URL)),
        page.locator('text=Anmelden').click(),
        //page.locator('text=ICH STIMME ZU').click({ timeout: 10000 })
    ]);

    const requestParams = new URLSearchParams(
        request.url().replace(CONSTANTS.SPOTIFY_REDIRECT_URL, "")
    );
    if (!requestParams.has("code")) {
        throw Error("Did not get an authorization code from spotify in the redirect");
    }

    await context.close();
    await browser.close();

    const result = {
        code: requestParams.get("code") || "",
        state: requestParams.get("state") || ""
    };
    return result;
}

/**
 * Generate random string
 * @private
 * @param length length of the result
 */
function generateRandomString(length: number): string {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

/**
 * Get the access token from the auth endpoint
 * @param client_id spotify client id
 * @param client_secret spotify client secret
 * @param authorization_code spotifys authorization code for the user
 * @returns Access Token
 */
export async function getAccessToken(client_id: string, client_secret: string, authorization_code: string): Promise<string> {
    const response = await postData(CONSTANTS.SPOTIFY_TOKEN_URL, {
        headers: {
            'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64')),
            'Content-type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            grant_type: "authorization_code",
            redirect_uri: CONSTANTS.SPOTIFY_REDIRECT_URL,
            code: authorization_code
        }).toString()
    });
    return response.access_token;
}

/**
 * Search album at spotify
 * @param name artist name and album
 * @param config configuraiton
 * @returns 
 */
export async function searchAlbum(name: string, config: ISpotifyQuery): Promise<ISearchAlbumResponse> {
    const response = await getData(CONSTANTS.SPOTIFY_SEARCH_URL + "?", {
        headers: {
            'Authorization': `Bearer ${config.token}`,
        },
        searchParams: {
            query: name,
            type: "album",
            limit: 1
        }
    });
    return response.albums;
}

/**
 * Add Albums to spotify
 * @param token name of the album
 * @param name name of the album
 * @returns 
 */
export async function addAlbums(token: string, ids: Array<string>): Promise<string> {
    const response = await fetch(CONSTANTS.SPOTIFY_SAFE_ALBUM_URL, {
        method: "PUT",
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(ids)
    });
    if (!response.ok) {
        throw Error(response.status + ": " + response.statusText);
    }
    return response.statusText;
}

/**
 * Add Albums to spotify libary
 * @param albumNames collection of artist wit album name
 * @param config configuration for the spotify api
 */
export async function addAlbumsToSpotify(albumNames: string[], config: ISpotifyQuery) {
    for (var albumName of albumNames) {
        const album = await searchAlbum(albumName, { token: config.token });
        if (album.items.length > 0) {
            const result = await addAlbums(config.token, [album.items[0].id]);
            console.log(albumName + " > " + result);
        }
    }
}

/**
 * 
 * @param url 
 * @param data 
 * @returns 
 */
export async function postData(url = '', data: any): Promise<any> {
    const response = await fetch(url, {
        method: "POST",
        headers: data.headers,
        body: typeof data.body === "string" ? data.body : JSON.stringify(data.body)
    });
    if (!response.ok) {
        throw Error(response.status + ": " + response.statusText);
    }
    return response.json();
}

/**
 * 
 * @param url 
 * @param data 
 * @returns 
 */
export async function getData(url = '', data: any): Promise<any> {
    const response = await fetch(url + new URLSearchParams(data.searchParams), {
        method: "GET",
        headers: data.headers
    });
    if (!response.ok) {
        throw Error(response.status + ": " + response.statusText);
    }
    return response.json();
}