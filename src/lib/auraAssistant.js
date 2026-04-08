export async function askAura(transcript) {
  const response = await fetch("/.netlify/functions/aura", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ transcript })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "Aura request failed");
  }

  return data.text;
}