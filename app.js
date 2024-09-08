import ChannelCategorization from './modules/channel-categorization.js';
import UI from './modules/ui.js';
import YoutubeClient from './modules/youtube-client.js';

window.onload = async () => {
  const CLIENT_ID = '114446647688-sb3vdkn957rg6h7b7tn4tc9if8k47fv4.apps.googleusercontent.com';
  const REDIRECT_URI = window.location.origin;

  const youtubeClient = new YoutubeClient(CLIENT_ID, REDIRECT_URI);
  const ui = new UI();

  try {
    const accessToken = youtubeClient.getAccessTokenFromURL();

    if (!accessToken) {
      ui.showAuthButton(() => youtubeClient.authenticateWithOAuth());
    } else {
      ui.showSubscriptionsButton(() => getSubscriptions(youtubeClient, ui, accessToken));
      await getSubscriptions(youtubeClient, ui, accessToken);
    }
  } catch (error) {
    console.error('Failed during the authentication or subscription process', error);
    ui.showError('An error occurred while trying to authenticate or retrieve subscriptions.');
  }
};

const getSubscriptions = async (youtubeClient, ui, accessToken) => {
  try {
    ui.showLoader();

    const subscriptions = await youtubeClient.getSubscriptions(accessToken);
    if (!subscriptions || subscriptions.length === 0) {
      throw new Error('No subscriptions found.');
    }

    ui.showTotalSubscriptions(subscriptions.length);

    const channelsByCategory = await ChannelCategorization.getCategoryChannels(subscriptions);
    ui.showCategorizedChannels(channelsByCategory);
    ui.showCategorizedChannelsChart(channelsByCategory);
  } catch (error) {
    console.error('Failed to fetch or categorize channels', error);
    ui.showError('Failed to process subscriptions. Please try again later.');
  } finally {
    ui.hideLoader();
  }
};
