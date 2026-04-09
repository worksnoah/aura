export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Use POST with a JSON body." })
    };
  }

  try {
    const { prompt } = JSON.parse(event.body);

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-5.4-mini",
        input: `Respond as a pirate using slang and many ARRR's: ${prompt}`
      })
    });

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify({
        text: data.output[0].content[0].text
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
