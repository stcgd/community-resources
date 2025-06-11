export async function onRequest(context) {
  const {
    env,
    request
  } = context;
  const url = new URL(request.url);
  const {
    pathname
  } = url;

  // Simple router to handle different API paths
  switch (pathname) {
    case "/api/news":
      return handleNewsRequest(context);
    case "/api/resources":
      return handleResourcesRequest(context);
    default:
      return new Response("Not found", {
        status: 404
      });
  }
}

async function handleNewsRequest(context) {
  try {
    const RSS_URL = "http://feeds.feedburner.com/nonprofittimes/TCSn";
    const rssResponse = await fetch(RSS_URL, {
      headers: {
        "User-Agent": "Cloudflare-Worker/1.0"
      }
    });

    if (!rssResponse.ok) {
      console.error(`RSS fetch failed with status: ${rssResponse.status}`);
      return new Response(JSON.stringify([]), {
        headers: {
          "Content-Type": "application/json"
        }
      });
    }

    const xmlText = await rssResponse.text();
    const items = [];
    const itemRegex = /<item>[\s\S]*?<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>[\s\S]*?<link>([\s\S]*?)<\/link>[\s\S]*?<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xmlText)) !== null && items.length < 10) {
      items.push({
        title: match[1].trim(),
        link: match[2].trim().split('?')[0] // Clean up tracking parameters from link
      });
    }

    return new Response(JSON.stringify(items), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=3600" // Cache on edge for 1 hour
      },
    });
  } catch (e) {
    console.error("News fetch error:", e);
    return new Response(JSON.stringify({
      error: e.message
    }), {
      status: 500
    });
  }
}

async function handleResourcesRequest(context) {
  const {
    env,
    request
  } = context;
  const {
    searchParams
  } = new URL(request.url);

  try {
    const db = env.DB;
    const category = searchParams.get("category");
    const searchTerm = searchParams.get("search");

    let query = "SELECT * FROM resources";
    const conditions = [];
    const params = [];

    if (category && category !== "All") {
      conditions.push("category = ?");
      params.push(category);
    }

    if (searchTerm) {
      conditions.push("(name LIKE ? OR city LIKE ? OR zip LIKE ? OR description LIKE ?)");
      const likeTerm = `%${searchTerm}%`;
      params.push(likeTerm, likeTerm, likeTerm, likeTerm);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " LIMIT 50;";

    const stmt = db.prepare(query).bind(...params);
    const {
      results
    } = await stmt.all();

    return new Response(JSON.stringify(results), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "s-maxage=60"
      },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({
      error: e.message
    }), {
      status: 500
    });
  }
}
