export async function callGemini(prompt: string) {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("Gemini error:", err);

      if ((res.status === 429 || res.status === 503) && attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 3000));
        continue;
      }

      throw new Error("Gemini API failed");
    }

    const data = await res.json();

    return (
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      null
    );
  }

  return null;
}
