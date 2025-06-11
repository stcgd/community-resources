import Parser from 'rss-parser';

const parser = new Parser();
const FEED_URL = 'https://nonprofitquarterly.org/feed/';

export async function onRequest(context) {
  try {
    const feed = await parser.parseURL(FEED_URL);
    const items = feed.items.map(item => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      description: item.contentSnippet || item.content || item.summary || '',
    }));
    return new Response(JSON.stringify(items), {
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to fetch feed' }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
