import fetch from "node-fetch";

export const config = {
  runtime: "nodejs"
};

export default async function handler(req, res) {
  // ✅ CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { slug } =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    if (!slug) return res.status(400).json({ error: "slug 누락됨" });

    console.log("🔍 요청 slug:", slug);

    // ✅ 1) 우선 slug 그대로 시도 (인코딩 X)
    const query1 = `
      query($slug: String!) {
        post(username: "dvlp", url_slug: $slug) {
          body
        }
      }
    `;

    let result = await fetch("https://v2.velog.io/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: query1, variables: { slug } })
    });

    let json = await result.json();
    console.log("📦 1차 응답:", json);

    if (json?.data?.post?.body) {
      return res.status(200).json({ body: json.data.post.body });
    }

    // ✅ 2) fallback: 전체 글 목록에서 **부분 일치 slug 탐색**
    const listQuery = `
      query {
        posts(username: "dvlp") {
          title
          url_slug
        }
      }
    `;

    let listRes = await fetch("https://v2.velog.io/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: listQuery })
    });

    let listJson = await listRes.json();
    console.log("📦 게시글 목록:", listJson);

    const posts = listJson.data?.posts || [];
    const match = posts.find(p =>
      slug.replace(/\s+/g, "").includes(p.url_slug.replace(/\s+/g, "")) ||
      p.url_slug.replace(/\s+/g, "").includes(slug.replace(/\s+/g, ""))
    );

    if (!match) return res.status(200).json({ body: "" });

    console.log("✅ fallback slug:", match.url_slug);

    // ✅ 3) fallback slug 다시 본문 요청
    const query2 = `
      query($slug: String!) {
        post(username: "dvlp", url_slug: $slug) {
          body
        }
      }
    `;

    let retryRes = await fetch("https://v2.velog.io/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: query2, variables: { slug: match.url_slug } })
    });

    let retryJson = await retryRes.json();

    return res.status(200).json({ body: retryJson?.data?.post?.body || "" });

  } catch (err) {
    console.log("❌ load.js ERROR:", err);
    return res.status(500).json({ error: "본문 로딩 실패" });
  }
}
