export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed" })
      };
    }

    const { transcript } = JSON.parse(event.body || "{}");

    if (!transcript) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing transcript" })
      };
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-5.4-mini",
        input: [
          {
            role: "system",
            content:
              "You are Aura, a concise dorm-room ambient assistant. Reply in 1 to 2 short sentences max. Be useful, calm, and direct."
          },
          {
            role: "user",
            content: transcript
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: data?.error?.message || "OpenAI request failed"
        })
      };
    }

    const text =
      data.output_text ||
      data.output?.map((item) =>
        item.content?.map((c) => c.text || "").join("")
      ).join("\n") ||
      "Sorry, I couldn't answer that.";

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || "Server error" })
    };
  }
}