import type {
    AuthorizationCodeResponse,
    ISearchAlbumResponse,
    ISearchAlbumResponseItem,
    ISpotifyQuery,
    ISpotifyLogin
} from "./typings/spotify-helper.js";
import { default as CONSTANTS } from "./constants.js";
import fetch from "node-fetch";
import playwright from "playwright";
import { URLSearchParams } from "url";
import { readFileSync, writeFileSync, existsSync, readFile } from "fs";

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
async function getAuthorizationCode(user: string, pw: string): Promise<AuthorizationCodeResponse> {
    const browser = await playwright.chromium.launch({
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
        page.locator('button#login-button').click(),
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
async function getAccessToken(client_id: string, client_secret: string, authorization_code: string): Promise<string> {
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
async function addAlbums(token: string, ids: Array<string>): Promise<string> {
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
 * @param albumNames collection of artist with album name
 * @param config spotify login
 */
export async function addAlbumsToSpotify(albumNames: string[], config: ISpotifyLogin): Promise<string[]> {
    const token = await login(config.user, config.pw);
    const information = [];
    for (let albumName of albumNames) {
        const album = await searchAlbum(albumName, { token: token });
        const albumId = album.items[0]?.id;
        if (albumId && !hasAdded(albumId)) {
            const result = await addAlbums(token, [albumId]);
            console.log(albumName + " > " + result);
            if (result === "OK") {
                addId(albumId);
                information.push(albumName + " > " + result);
            } else {
                throw Error(
                    albumName + " > " + result
                );
            }
        }
    }
    return information;
}

/**
 * 
 * @param url 
 * @param data 
 * @returns 
 */
async function postData(url = '', data: any): Promise<any> {
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
 * @param url 
 * @param data 
 * @returns 
 */
async function getData(url = '', data: any): Promise<any> {
    const response = await fetch(url + new URLSearchParams(data.searchParams), {
        method: "GET",
        headers: data.headers
    });
    if (!response.ok) {
        throw Error(response.status + ": " + response.statusText);
    }
    return response.json();
}

/**
 * @param id
 */
function hasAdded(id: string): boolean {
    return getAddedIds("./database.txt").includes(id);
}

/**
 * @param id
 */
function addId(id: string): void {
    console.log("Add id '" + id + "' to the database");
    const addedIds = getAddedIds("./database.txt");
    addedIds.push(
        id
    );
    writeFileSync(
        "./database.txt",
        [...new Set(addedIds)].join("\r\n")
    );
}

/**
 * @param filePath
 */
function getAddedIds(filePath: string): Array<string> {
    let data: Array<string> = [];
    if (existsSync(filePath)) {
        var file = readFileSync(
            filePath
        );
        data = file
            .toString()
            .split(/\r?\n/)
            .filter(e => !!e);
    }
    return data;
}