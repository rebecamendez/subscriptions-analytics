export default class ChannelCategorization {
  static async getCategoryChannels(subscriptions) {
    try {
      const categorizedChannels = await ChannelCategorization.#getCategorizedChannels(subscriptions);

      const groupedAndSortedChannels = ChannelCategorization.#groupAndSortChannels(categorizedChannels);

      console.log('📌 sortedGroupedChannels', groupedAndSortedChannels);
      return groupedAndSortedChannels;
    } catch (error) {
      console.error('Failed to categorize channels:', error);
      throw error;
    }
  }

  // --- 🔐 Private methods ---

  static async #getStaticCategories() {
    try {
      const response = await fetch('./assets/categories.json');
      if (!response.ok) {
        throw new Error('Error fetching categories.json');
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to load static categories:', error);
      throw error;
    }
  }

  static async #getCategorizedChannels(subscriptions) {
    try {
      const channels = subscriptions.map((subscription) => ({
        title: subscription.snippet.title,
        description: subscription.snippet.description
      }));

      const staticCategories = await ChannelCategorization.#getStaticCategories();

      console.log('👀 channels', channels);
      console.log('👀 static categories', staticCategories);

      const prompt = ChannelCategorization.#buildPrompt(channels, staticCategories);
      const jsonSchema = ChannelCategorization.#buildJsonSchema(staticCategories);

      const body = {
        body: {
          contents: [{ parts: [{ text: JSON.stringify(prompt) }] }],
          generationConfig: {
            response_mime_type: 'application/json',
            response_schema: jsonSchema
          }
        }
      };

      const response = await fetch('https://hook.eu2.make.com/2voos1fln9s1n3e5sxwwkvuwkiqkw2tm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`Webhook error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;

      console.log('👀 raw response', text);

      const categorizedChannels = JSON.parse(text);
      console.log('✅ categorizedChannels', categorizedChannels);

      return categorizedChannels;
    } catch (error) {
      console.error('Failed to fetch categorized channels:', error);
      throw error;
    }
  }

  static #groupAndSortChannels(categorizedChannels) {
    const groupedChannels = categorizedChannels.reduce((acc, channel) => {
      if (!acc[channel.category]) {
        acc[channel.category] = [];
      }
      acc[channel.category].push(`${channel.title} (${channel.category_tags})`);
      return acc;
    }, {});

    const sortedGroupedChannels = Object.keys(groupedChannels)
      .sort((a, b) => groupedChannels[b].length - groupedChannels[a].length)
      .reduce((acc, category) => {
        acc[category] = groupedChannels[category];
        return acc;
      }, {});

    return sortedGroupedChannels;
  }

  static #buildPrompt(channels, categories) {
    return `
      👉 Please categorize the following list of YouTube channels based on their descriptions. 
      Ensure that each channel is assigned one category from the provided list.

      ### Categories:
      ${categories.map((c) => `${c.kind}`).join(', ')}

      ### Channels:
      ${channels.map((c) => `- title: ${c.title}: description: ${c.description}`).join('\n')}
      
      Ensure that:
      - Every channel is assigned a relevant category based on its description.
      - The JSON conforms to the provided schema.
      - Double-check the outcomes for accuracy before displaying them. If you're unsure about a channel, use Entertainment as the default category.
    `;
  }

  static #buildJsonSchema(categories) {
    return {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'The title of the YouTube channel' },
          category: { type: 'string', description: 'The category of the YouTube channel', enum: categories.map((c) => c.name) },
          category_tags: {
            type: 'string',
            description: 'Tags that represent the reasoning behind assigning the channel to this category. Comma-separated, with a maximum of 3 tags.'
          }
        },
        required: ['title', 'category', 'category_tags']
      }
    };
  }
}
