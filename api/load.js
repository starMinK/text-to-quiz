import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    const { slug } =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    // ✅ slug 정규화 (공백/제어문자 제거)
    const cleanSlug = slug.trim().replace(/\s+/g, "-");

    // ✅ Velog 에서 slug 목록 받아와 실제 matching
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

    // ✅ 가장 유사한 slug 찾기
    const match = posts.find(p => p.url_slug.includes(cleanSlug)) || posts.find(p => cleanSlug.includes(p.url_slug));

    if (!match) {
      return res.status(200).json({ body: "" });
    }

    // ✅ 실제 slug로 본문 재조회
    const realSlug = match.url_slug;

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
    res.status(500).json({ error: "본문 로딩 실패" });
  }
}
