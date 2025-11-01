// api/generate.js
export const config = {
  runtime: "nodejs" // ✅ CORS 가능한 Node 런타임 강제
};

import OpenAI from "openai";

export default async function handler(req, res) {

  // ✅ Preflight (OPTIONS) 요청 즉시 허용
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  // ✅ 일반 요청에도 CORS 허용
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  try {
    // CodePen에서는 req.body가 string일 수 있음
    const { text, subject } =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const prompt = `
너는 한국 수능 문제 제작 AI이다.
입력된 본문을 기반으로 선택된 과목(${subject}) 스타일의
5지선다 객관식 문제 5문항을 만들어라.

각 문항은 반드시 보기 5개를 포함해야 한다.
다른 말 없이 아래 JSON만 출력하라.

{
  "questions": [
    {
      "question": "문제",
      "choices": ["보기1","보기2","보기3","보기4","보기5"],
      "answer": 0~4,
      "explanation": "해설"
    }
  ]
}

본문:
${text}
`;

    const completion = await client.chat.completions.create({
      model: "gpt-5",
      messages: [{ role: "user", content: prompt }]
    });

    const raw = completion.choices[0].message.content;
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return res.status(500).json({ error: "JSON 형식 감지 실패", raw });

    const data = JSON.parse(match[0]);
    return res.status(200).json(data);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "서버 처리 오류" });
  }
}
