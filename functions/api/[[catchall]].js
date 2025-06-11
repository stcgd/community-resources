export async function onRequest(context) {
  const {
    env,
    request
  } = context;
  const url = new URL(request.url);
  const {
    pathname,
    searchParams
  } = url;

  // 我们只处理 /api/resources 的 GET 请求
  if (pathname !== "/api/resources" || request.method !== "GET") {
    return new Response("Not found", {
      status: 404
    });
  }

  try {
    const db = env.DB;
    const category = searchParams.get("category");
    const searchTerm = searchParams.get("search");

    let query = "SELECT * FROM resources";
    const conditions = [];
    const params = [];

    // 根据分类筛选
    if (category && category !== "All") {
      conditions.push("category = ?");
      params.push(category);
    }

    // 根据搜索词模糊查询
    if (searchTerm) {
      conditions.push("(name LIKE ? OR city LIKE ? OR zip LIKE ? OR description LIKE ?)");
      const likeTerm = `%${searchTerm}%`;
      params.push(likeTerm, likeTerm, likeTerm, likeTerm);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }
    
    query += " LIMIT 50;" // 限制最多返回 50 条结果

    const stmt = db.prepare(query).bind(...params);
    const {
      results
    } = await stmt.all();

    return new Response(JSON.stringify(results), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "s-maxage=60" // 缓存60秒
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
