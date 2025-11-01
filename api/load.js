import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    const { slug } =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    if (!slug) {
      return res.status(400).json({ error: "slug 누락됨" });
    }

    // ✅ 슬러그를 완전 URL 인코딩
    const encodedSlug = encodeURIComponent(slug);

    // ✅ Velog GraphQL 요청 (인코딩된 slug 사용)
    const query = `
      query {
        post(username: "dvlp", url_slug: "${encodedSlug}") {
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
    const body = json.data?.post?.body;

    // ✅ 만약 인코딩된 slug가 실패하면 → fallback: 전체 글 목록에서 제목으로 찾기
    if (!body) {
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

      const found = posts.find(p => slug.includes(p.title) || p.title.includes(slug));
      if (found) {
        // ✅ slug 재시도
        const retryQuery = `
          query {
            post(username: "dvlp", url_slug: "${found.url_slug}") {
              body
            }
          }
        `;
        const retryRes = await fetch("https://v2.velog.io/graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: retryQuery })
        });
        const retryJson = await retryRes.json();
        return res.status(200).json({ body: retryJson.data?.post?.body || "" });
      }
    }

    return res.status(200).json({ body: body || "" });

  } catch (err) {
    console.error("❌ /api/load Error:", err);
    res.status(500).json({ error: "본문 로딩 실패" });
  }
}
