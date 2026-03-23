import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

async function streamGroqResponse(messages, res) {
  const stream = await groq.chat.completions.create({
    model: process.env.LLM_MODEL || "llama-3.3-70b-versatile",
    messages,
    stream: true,
    temperature: 0.3,
    max_tokens: 1024
  })

  let fullContent = ""

  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content || ""
    if (token) {
      fullContent += token
      res.write(`data: ${JSON.stringify({ type: "token", content: token })}\n\n`)
    }
  }

  return fullContent
}

export { streamGroqResponse };
