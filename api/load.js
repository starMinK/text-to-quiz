// api/load.js

export const config = {
  runtime: "nodejs"
};

import fetch from "node-fetch";
global.fetch = fetch;

export default async function handler(req, res) {

  // ✅ CORS 허용 (CodePen, Velog 삽입 포함)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { slug } =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const query = `
      query {
        post(username: "dvlp", url_slug: "${slug}") {
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
    console.error(err);
    return res.status(500).json({ error: "본문 로딩 실패" });
  }
}
