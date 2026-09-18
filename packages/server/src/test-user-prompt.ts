import OpenAI from "openai";
import { config } from "./config";
import { jsonrepair } from "jsonrepair";
import { PresentationSchema } from "@presentation/schema";

const openai = new OpenAI({
  apiKey: config.nvidiaApiKey,
  baseURL: config.nvidiaBaseUrl,
});

const SYSTEM_PROMPT = `You are an AI presentation compiler.
When given a user topic, you generate an interactive slide presentation.
Output ONLY valid JSON matching this format:
{
  "version": 1,
  "title": "Presentation Title",
  "scenes": [
    {
      "id": "scene-1",
      "title": "Scene Title",
      "elements": [
        { "id": "el-title", "type": "text", "content": "Title", "x": 200, "y": 60, "fontSize": 32, "color": "#ffffff" },
        { "id": "card-1", "type": "text", "content": "Card Title\\nCard description text", "x": 100, "y": 180, "fontSize": 16, "color": "#38bdf8" }
      ],
      "steps": [
        { "id": "step-1", "title": "Overview", "description": "Explanation", "actions": [] },
        { "id": "step-2", "title": "Highlight", "description": "Highlight point", "actions": [{ "action": "highlight", "target": "card-1", "color": "#38bdf8", "duration": 0.6 }] }
      ]
    }
  ]
}
Be concise. Output ONLY the JSON.`;

async function testUserPrompt() {
  console.log("Streaming from DeepSeek for: 'create slides about diffrence between and or not'...");
  const stream: any = await openai.chat.completions.create({
    model: config.nvidiaModel,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: "create slides about diffrence between and or not" },
    ],
    temperature: 0.3,
    max_tokens: 4096,
    chat_template_kwargs: { thinking: true, reasoning_effort: "low" },
    stream: true,
  } as any);

  let fullContent = "";
  let fullReasoning = "";

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta;
    if (delta?.reasoning || delta?.reasoning_content) {
      fullReasoning += delta.reasoning || delta.reasoning_content;
      process.stdout.write(".");
    }
    if (delta?.content) {
      fullContent += delta.content;
      process.stdout.write(delta.content);
    }
  }

  console.log("\n\n--- Full Content Received ---");
  console.log(fullContent.slice(0, 300) + "...\n");

  try {
    let jsonStr = fullContent.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      jsonStr = jsonMatch[1].trim();
    }

    const repaired = jsonrepair(jsonStr);
    const parsed = JSON.parse(repaired);
    const validated = PresentationSchema.parse(parsed);

    console.log("SUCCESS! Presentation Title:", validated.title);
    console.log("Scenes count:", validated.scenes.length);
    validated.scenes.forEach((sc, i) => {
      console.log(`Scene ${i+1}: ${sc.title} (${sc.elements.length} elements, ${sc.steps.length} steps)`);
      sc.elements.forEach(el => {
        if (el.type === "text") console.log(`  - Text: ${el.content.replace(/\n/g, " | ")}`);
      });
    });
  } catch (err: any) {
    console.error("Parse/Validate Error:", err?.message || err);
  }
}

testUserPrompt();
