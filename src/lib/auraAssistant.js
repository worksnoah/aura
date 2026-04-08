export async function askAura(transcript) {
  const response = await fetch("/.netlify/functions/ask", {
    method: "POST",
    body: JSON.stringify({ prompt: transcript })
    });

    const data = await response.json();
    setAuraResponse(data.text);

  if (!response.ok) {
    throw new Error(data?.error || "Aura request failed");
  }

  return data.text;
}