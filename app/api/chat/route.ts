import { NextResponse } from "next/server";
import { CohereClientV2 } from "cohere-ai";

const cohere = new CohereClientV2({
  token: process.env.COHERE_API_KEY || "",
});

export async function POST(req: Request) {
  try {
    const { message, imageBase64 } = await req.json();

    if (!message && !imageBase64) {
      return NextResponse.json(
        { reply: "No message or image provided" },
        { status: 400 }
      );
    }

    let prompt = message || "";
    if (imageBase64) {
      prompt += "\n\n[IMAGE ATTACHED: base64]";
    }

    const response = await cohere.chat({
      model: "command-a-03-2025",
      messages: [
        {
          role: "system",
          content:
            "You are an expert in structural engineering. Only answer Beam Analysis questions. Otherwise say: 'This isn't about Beam analysis. Please ask an appropriate question.'",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
    });

    // Safely extract the first 'text' from response.message.content
    const assistantMessage = response.message;
    let replyText = "No response";

    if (assistantMessage?.content) {
      for (const item of assistantMessage.content) {
        // Only pick items that actually have a text field
        if ("text" in item && typeof item.text === "string") {
          replyText = item.text;
          break;
        }
      }
    }

    return NextResponse.json({
      reply: replyText,
      imageUrl: imageBase64 || null,
    });
  } catch (err) {
    console.error("Cohere Error:", err);
    return NextResponse.json(
      { reply: "Error connecting to Cohere API" },
      { status: 500 }
    );
  }
}


