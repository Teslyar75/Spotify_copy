export interface Song {
	id: string;
	title: string;
	artist: string;
	album_id: string | null;
	album_name?: string | null;
	image_url: string;
	file_url: string;
	duration: number;
	created_at: string;
	updated_at: string;
	genre?: string | null;
}

export interface Album {
	id: string;
	title: string;
	artist: string;
	image_url: string;
	release_year: number;
	songs: Song[];
}

export interface Stats {
	total_songs: number;
	total_albums: number;
	total_users: number;
	total_artists: number;
}

export interface Message {
	id: string;
	sender_id: string;
	receiver_id: string;
	content: string;
	created_at: string;
	updated_at: string;
}

export interface User {
	id: string;
	email: string;
	username: string;
	avatar_url: string | null;
	is_online?: boolean;
	activity?: string;
}

export interface AuthTokens {
	access_token: string;
	refresh_token: string;
}

export interface LoginRequest {
	email: string;
	password: string;
}

export interface RegisterRequest {
	email: string;
	password: string;
	username: string;
}

export interface Playlist {
	id: string;
	title: string;
	owner_id: string;
	is_public: boolean;
	created_at: string;
	tracks: Song[];
}

export interface SearchResult {
	tracks: Song[];
	albums: Album[];
	artists: { name: string }[];
}
