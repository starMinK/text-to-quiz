// api/generate.js
import OpenAI from "openai";

export default async function handler(req, res) {
  try {
    // ✅ CORS 허용
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.status(200).end();

    // ✅ CodePen 환경에서 body가 문자열일 수 있기 때문에 안전하게 파싱
    const { text, subject } = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const prompt = `
너는 한국 수능 문제 제작 AI이다. 2020년부터 2025년의 기출 문제들을 분석해
지금부터 입력된 본문을 기반으로, 선택된 과목(${subject})의 출제 방식과 사고 구조를 반영하여
수능형 객관식 문제 5개를 만들어라.

각 문항은 실제 수능 기출 문제의 서술 길이, 지문 표현 톤, 선택지 길이 균형을 따라라.
각 문항은 반드시 보기 5개를 포함해야 한다.

### 출력 형식 (절대 변경 금지)
반드시 아래 JSON 형식만 출력하라.
다른 말, 설명, 문장 넣으면 안 된다.

{
  "questions": [
    {
      "question": "문제를 한 문장으로",
      "choices": ["보기1", "보기2", "보기3", "보기4", "보기5"],
      "answer": 0~4,
      "explanation": "해설을 한 문장 이상"
    }
  ]
}

### 문제 제작 본문:
${text}
`;

    const response = await client.chat.completions.create({
      model: "gpt-5",
      messages: [{ role: "user", content: prompt }]
    });

    const raw = response.choices[0].message.content;
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ error: "JSON 구조 감지 실패", raw });

    const data = JSON.parse(jsonMatch[0]);

    res.status(200).json(data);

  } catch (err) {
    console.error("❌ 서버 오류:", err);
    res.status(500).json({ error: "문제 생성 실패 또는 JSON 파싱 오류" });
  }
}
