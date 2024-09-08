export default class YoutubeClient {
  constructor(clientId, redirectUri) {
    this.clientId = clientId;
    this.redirectUri = redirectUri;
  }

  authenticateWithOAuth() {
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${this.clientId}&redirect_uri=${this.redirectUri}&response_type=token&scope=https://www.googleapis.com/auth/youtube.readonly`;
    window.location = oauthUrl;
  }

  getAccessTokenFromURL() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');

    if (!accessToken) {
      console.error('No access token found in the URL.');
    }

    return accessToken;
  }

  async getSubscriptions(accessToken) {
    if (!accessToken) {
      throw new Error('Access token is required to fetch subscriptions.');
    }

    let subscriptions = [];
    let nextPageToken = '';
    const baseUrl = 'https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=50';

    try {
      do {
        const url = this.#buildSubscriptionUrl(baseUrl, nextPageToken);

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Error fetching subscriptions: ${errorData.error.message}`);
        }

        const data = await response.json();
        subscriptions = subscriptions.concat(data.items);
        nextPageToken = data.nextPageToken || '';
      } while (nextPageToken);

      console.log('👀 subscriptions', subscriptions);
      return subscriptions;
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      throw error; // Lanzamos el error para que pueda ser manejado en otro lugar si es necesario
    }
  }

  // --- 🔐 Private methods ---

  #buildSubscriptionUrl(baseUrl, nextPageToken) {
    return `${baseUrl}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
  }
}
