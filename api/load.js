// /api/load.js (진단용 임시버전)
import fetch from "node-fetch";

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { slug } =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const diag = {
      receivedSlug: slug ?? null,
      listCount: 0,
      matchedSlug: null,
      postQueryOk: false,
      postQueryErrors: null,
      notes: []
    };

    if (!slug) {
      return res.status(400).json({ body: "", diag: { ...diag, notes: ["slug missing in request body"] } });
    }

    // 1) Velog 목록
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
    const posts = listJson?.data?.posts || [];
    diag.listCount = posts.length;
    if (!posts.length) diag.notes.push("No posts returned from Velog");

    // 2) 매칭
    const match =
      posts.find(p => p.url_slug === slug) ||
      posts.find(p => slug.includes(p.url_slug)) ||
      posts.find(p => p.url_slug.includes(slug));
    if (!match) {
      diag.notes.push("No matching slug in posts list");
      return res.status(200).json({ body: "", diag });
    }
    diag.matchedSlug = match.url_slug;

    // 3) 본문 조회
    const postQuery = `
      query($slug: String!) {
        post(username: "dvlp", url_slug: $slug) {
          body
        }
      }
    `;
    const postRes = await fetch("https://v2.velog.io/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: postQuery, variables: { slug: match.url_slug } })
    });
    const postJson = await postRes.json();

    if (postJson?.errors) {
      diag.postQueryErrors = postJson.errors;
    }

    const body = postJson?.data?.post?.body || "";
    diag.postQueryOk = !!body;

    return res.status(200).json({ body, diag });
  } catch (err) {
    return res.status(500).json({ body: "", diag: { caughtError: String(err) } });
  }
}
