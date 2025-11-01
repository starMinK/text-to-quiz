// api/generate.js
import OpenAI from "openai";

export default async function handler(req, res) {
  try {
    const { text, subject } = req.body;

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const prompt = `
너는 한국 수능 문제 제작 AI이다. 2020년부터 2025년의 기출 문제들을 분석해
지금부터 입력된 본문을 기반으로, 선택된 과목(${subject})의 출제 방식과 사고 구조를 반영하여
수능형 객관식 문제 5개를 만들어라.
+ 각 문항은 실제 수능 기출 문제의 서술 길이, 지문 표현 톤, 선택지 길이 균형을 따라라.

### 출력 형식 (절대 변경 금지)
반드시 아래 JSON 형식만 출력하라.
다른 말, 설명, 문장 넣으면 안 된다.

{
  "questions": [
    {
      "question": "문제를 한 문장으로",
      "choices": ["보기1", "보기2", "보기3", "보기4","보기5"],
      "answer": 0~4 (정수),
      "explanation": "해설을 한 문장 이상"
    },
    {
      "question": "문제를 한 문장으로",
      "choices": ["보기1", "보기2", "보기3", "보기4","보기5"],
      "answer": 0~4 (정수),
      "explanation": "해설을 한 문장 이상"
    },
    {
      "question": "문제를 한 문장으로",
      "choices": ["보기1", "보기2", "보기3", "보기4","보기5"],
      "answer": 0~4 (정수),
      "explanation": "해설을 한 문장 이상"
    },
    {
      "question": "문제를 한 문장으로",
      "choices": ["보기1", "보기2", "보기3", "보기4","보기5"],
      "answer": 0~4 (정수),
      "explanation": "해설을 한 문장 이상"
    },
    {
      "question": "문제를 한 문장으로",
      "choices": ["보기1", "보기2", "보기3", "보기4","보기5"],
      "answer": 0~4 (정수),
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

    const raw = response.choices[0].message.content.trim();
    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    const jsonString = raw.substring(jsonStart, jsonEnd + 1);
    const data = JSON.parse(jsonString);

    res.status(200).json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "문제 생성 실패 또는 JSON 파싱 오류" });
  }
}
