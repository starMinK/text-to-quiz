import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    const { slug } = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

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
    res.status(200).json({ body: json.data?.post?.body || "" });
  } catch (err) {
    res.status(500).json({ error: "본문 로딩 실패" });
  }
}
