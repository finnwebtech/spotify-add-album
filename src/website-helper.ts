import type { Websites } from "./typings/website-helper.js";
import { HTMLElement, parse } from "node-html-parser";
import fetch from 'node-fetch';
import CONSTANTS from "./constants.js";

/**
 * Get all the album names from a website
 * @param urls collection of websites
 * @returns collection of albums with artist and name
 */
export async function getAlbumsFromWebiste(types: Websites[]): Promise<string[]> {
    var result: string[] = [];
    for (let type of types) {
        switch (type) {
            case "sputnikmusic":
                result = [...result, ...await getAlbumsFromSputnikmusic()];
                break;
            case "metacritic":
                result = [...result, ...await getAlbumsFromMetacritic()];
                break;
            default:
                break;
        }
    }
    return result;
}

/**
 * Get album names with artist from sputnikmusic
 */
async function getAlbumsFromSputnikmusic(): Promise<string[]> {
    const website = await getWebsite(CONSTANTS.SPUTNIKMUSIC_URL);
    const links = getLinks(website, /^\/album\/.*/);
    const albumNames = extractAlbumName(links, /^\/album\/[0-9]+\/(.*)/);
    console.log(">> Sputnikmusic");
    console.log(albumNames);
    return albumNames;
}

/**
 * Get album names with artist from metacritic
 */
async function getAlbumsFromMetacritic(): Promise<string[]> {
    const website = await getWebsite(CONSTANTS.METACRITIC_URL);
    const links = getLinks(website, /^\/music\/.*\/critic-reviews/);
    const albumNames = extractAlbumName(links, /^\/music\/(.*)\/critic-reviews/);
    console.log(">> Metacritic");
    console.log(albumNames);
    return albumNames;
}

/**
 * Gets a website
 * @param url url of the website
 */
export async function getWebsite(url: string): Promise<HTMLElement> {
    const websiteContent = await getWebsiteAsString(url);
    return await parse(websiteContent);
}

/**
 * Fetch the website as string
 * @param url url of the webiste
 */
async function getWebsiteAsString(url: string): Promise<string> {
    const response = await fetch(url);
    return response.text();
}

/**
 * Get all links from a website
 * @param website website from where to get all the links
 * @param includes link includes some words
 * @returns 
 */
export function getLinks(website: HTMLElement, regex: RegExp): Array<string> {
    const links = website.getElementsByTagName("a")
        .map(link => link.getAttribute("href"))
        .filter(link => link && regex.test(link)) as string[];
    return [...new Set(links)];
}

/**
 * Extracts the name of the artist and album from a link
 * @param links collection of links
 * @param regex regex matches the part of the string
 * @returns 
 */
export function extractAlbumName(links: Array<string>, regex: RegExp): Array<string> {
    const result = links
        .map(link => decodeURIComponent(link))
        .map(link => link.match(regex))
        .map(link => link ? link[1].replaceAll("-", " ").replaceAll("/", " ") : "")
        .filter(link => !!link);
    return result;
}