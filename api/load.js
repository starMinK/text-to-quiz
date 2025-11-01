import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    const { slug } =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    if (!slug) {
      return res.status(400).json({ error: "slug 누락됨" });
    }

    // ✅ slug 정규화
    const cleanSlug = decodeURIComponent(slug).trim();

    // ✅ Velog 전체 목록에서 url_slug 가져오기
    const listQuery = `
      query {
        posts(username: "dvlp") {
          title
          url_slug
        }
      }
    `;

    const listRes = await fetch("https://v2.velog.io/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: listQuery })
    });

    const listJson = await listRes.json();
    const posts = listJson.data?.posts || [];

    // ✅ 가장 유사한 slug 찾기 (완벽 매칭 + 부분 매칭 둘 다 시도)
    const match =
      posts.find(p => p.url_slug === cleanSlug) ||
      posts.find(p => p.url_slug.includes(cleanSlug)) ||
      posts.find(p => cleanSlug.includes(p.url_slug));

    if (!match) {
      return res.status(200).json({ body: "" });
    }

    const realSlug = match.url_slug;

    // ✅ 본문 다시 조회
    const query = `
      query {
        post(username: "dvlp", url_slug: "${realSlug}") {
          body
        }
      }
    `;

    const result = await fetch("https://v2.velog.io/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    });

    const json = await result.json();
    return res.status(200).json({ body: json.data?.post?.body || "" });
  } catch (err) {
    console.error("❌ /api/load Error:", err);
    res.status(500).json({ error: "본문 로딩 실패" });
  }
}
