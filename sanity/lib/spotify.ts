const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const refresh_token = process.env.SPOTIFY_REFRESH_TOKEN;

const basic = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;
const CURRENTLY_PLAYING_ENDPOINT = `https://api.spotify.com/v1/me/player/currently-playing`;
const RECENTLY_PLAYED_ENDPOINT = `https://api.spotify.com/v1/me/player/recently-played`;

async function getAccessToken() {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded', // Tells Spotify to expect a query string format
    },
    // FIXED: Appended .toString() so the params are sent as a proper url-encoded string
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refresh_token || '',
    }).toString(),
  });
  
  return response.json();
}

export async function getCurrentlyPlaying() {
  const { access_token } = await getAccessToken();
  return fetch(CURRENTLY_PLAYING_ENDPOINT, {
    headers: { Authorization: `Bearer ${access_token}` },
    next: { revalidate: 15 }
  });
}

export async function getRecentlyPlayed() {
  const { access_token } = await getAccessToken();
  return fetch(RECENTLY_PLAYED_ENDPOINT, {
    headers: { Authorization: `Bearer ${access_token}` },
    next: { revalidate: 30 }
  });
}

export async function getPlaylistTracks(playlistId: string) {
  const { access_token } = await getAccessToken();
  return fetch(`https://api.spotify.com/v1/playlists/${playlistId}/items?limit=10`, {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });
}