export interface AuthorizationCodeResponse {
    code: string;
    state: string;
}

export interface ISearchAlbumResponseItem {
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

export interface ISearchAlbumResponse {
    href: string;
    items: Array<ISearchAlbumResponseItem>;
    limit: number;
    next: string;
    offset: number;
    previous: number | null;
    total: number;
}

export interface ISpotifyQuery {
    token: string;
}

export interface ISpotifyLogin {
    user: string;
    pw: string;
}