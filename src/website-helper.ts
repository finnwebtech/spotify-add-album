import { HTMLElement, parse } from "node-html-parser";
import fetch from 'node-fetch';

/**
 * Get album names from a website
 * @param url url
 * @returns 
 */
export async function getAlbumsFromWebsite(url: string): Promise<string[]> {
    const website = await getWebsite(url);
    const links = getLinks(website, "/album/");
    const albumNames = getAlbumNames(links);
    return albumNames;
}

/**
 * Gets a website as an HTMLElement
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
export async function getWebsiteAsString(url: string): Promise<string> {
    const response = await fetch(url);
    return response.text();
}

/**
 * Get all links from a website
 * @param website website from where to get all the links
 * @param startsWith links contain
 * @returns 
 */
export function getLinks(website: HTMLElement, startsWith: string): Array<string> {
    const links = website.getElementsByTagName("a")
        .map(link => link.getAttribute("href"))
        .filter(link => !!link && link.startsWith(startsWith)) as Array<string>;
    return [...new Set(links)];
}

/**
 * Get all the album names from the links
 * @param links website from where to get all the links
 * @param startsWith links contain
 * @returns 
 */
export function getAlbumNames(links: Array<string>): Array<string> {
    const result = links
        .map(link => link
            .replace(/\/album\/\d*\//, "")
            .replaceAll("-", " ")
            .replaceAll("%", "")
        );
    console.log("> Albums:");
    console.log(result);
    return result;
}