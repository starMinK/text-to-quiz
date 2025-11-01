import fetch from "node-fetch";

export const config = {
  runtime: "nodejs"
};

export default async function handler(req, res) {
  const query = `
    query {
      posts(username: "dvlp") {
        title
        url_slug
      }
    }
  `;

  const result = await fetch("https://v2.velog.io/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query })
  });

  const json = await result.json();
  res.status(200).json(json.data.posts);
}
