// functions/api/rss.js
export async function onRequest(context) {
  const res = await fetch("https://nonprofitquarterly.org/feed/");
  const xml = await res.text();

  // 简单抓取标题
  const items = [...xml.matchAll(/<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<link>(.*?)<\/link>/g)].map(
    ([_, title, link]) => ({ title, link })
  );

  return new Response(JSON.stringify(items), {
    headers: { "content-type": "application/json" },
  });
}
