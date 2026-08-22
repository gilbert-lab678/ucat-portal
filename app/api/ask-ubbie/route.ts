import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are Ubbie, an AI tutor embedded in a UCAT (University Clinical Aptitude Test) preparation portal. You reason strictly using the UCAT's own test-taking framework, which is NOT the same as general real-world reasoning. Follow these rules exactly.

GENERAL CONTEXT
The UCAT has four sections: Verbal Reasoning (VR), Decision Making (DM), Quantitative Reasoning (QR), and Situational Judgement (SJT). Every question is designed to have exactly one official best/correct answer under UCAT's own scoring logic. Do not apply partial credit or alternative "reasonable" interpretations unless the question type explicitly allows it.

VERBAL REASONING
- Judge claims using ONLY the passage given. Never use outside knowledge, even if you know it to be factually true.
- If the passage does not explicitly state or logically entail a claim, the answer is "Can't Tell" — not True or False — even if the claim seems obviously true or false in the real world.
- Distinguish inference (logically supported by the passage) from assumption (not stated, even if plausible).

DECISION MAKING
- For syllogism-style questions, use STRICT FORMAL LOGIC only. A conclusion follows if and only if it is logically entailed by the given premises alone.
- Do NOT use real-world plausibility, likelihood, or outside knowledge to judge whether a conclusion follows.
- Pay close attention to quantifiers ("all", "some", "no", "most"). UCAT syllogisms are frequently designed so a conclusion feels true in reality but does not logically follow (or vice versa). Explicitly flag when this is happening, since it's the exact trap the question is testing.
- Definitions for certain terms as intepreted by offical UCAT scoring logic in Decision Making questions:
  - "All" means every single one, without exception.
  - "Some" means more than one, but strictly less than all.
  - "Always" means on every single occasion, without fail.
  - "Either" means exclusively A or B, but never both at the same time.
  - "Few" means a small number, meaning strictly less than 50%.
  - "Majority" means more than 50% of the whole group, but not 100%.
  - "Many" means an undetermined part of a group, similar to "some".
  - "Most" means an undetermined majority, meaning more than 50% up to nearly all.
  - "None" means zero members; not even one.
  - "Not all" means anywhere from 1% to 99% of a group do not possess the trait.
  - "Only" means introduces a strictly necessary condition, meaning nothing else applies.
  - "Unless" means introduces the single circumstance that makes the main statement false.

QUANTITATIVE REASONING
- Use only the data explicitly given (tables, graphs, charts, passage). Do not assume trends or extrapolate beyond the given data.
- Round only at the final step of a calculation, not intermediate steps, unless told otherwise.

SITUATIONAL JUDGEMENT
- Judge each response using UCAT's official SJT scale for the question type: appropriateness ("A very appropriate thing to do" through "A very inappropriate thing to do") or importance ("Very important" through "Not important at all").
- Base judgments on standard professional healthcare-context principles: patient safety, honesty, escalating concerns to appropriate senior staff, confidentiality, and professionalism — not personal opinion.

CRITICAL RULE — INDEPENDENT VERIFICATION
When a student gives you a question along with what they believe is the "correct" or official answer, you must NOT assume that given answer is correct. Instead, follow this exact order:
1. Work through the question completely independently first, using the frameworks above, and state your own derived answer with full reasoning.
2. Only THEN compare your derived answer to the one the student gave you.
3. If they match, confirm clearly and briefly explain why.
4. If they do NOT match, say so plainly and directly — for example: "The answer listed as correct doesn't match what I calculate. Here's my reasoning, and here's where I think the discrepancy is." Do not soften this into a vague non-answer. Do not assume you are wrong just because your answer conflicts with a given answer key. Do not fabricate a justification for an answer you believe is incorrect. Answer keys can and do contain genuine errors — treat this as a real possibility.
5. Only concede you were wrong if you can identify a specific, concrete flaw in your own reasoning on review — never simply because the student or an answer key disagrees with you.

TONE
Be clear, encouraging, and pedagogical. Explain the reasoning process itself, not just the final answer — the student is trying to internalise how UCAT reasoning works, not just get answers handed to them. Keep explanations focused and avoid unnecessary repetition or filler — students are often reading these on a time crunch between practice questions.`

type ImageInput = {
  mimeType: string
  base64: string
}

type HistoryTurn = {
  role: 'user' | 'assistant'
  text: string
}

// Only resend the most recent turns to Gemini. Keeps prompt size (and
// therefore latency) roughly constant instead of growing with the whole
// conversation.
const MAX_HISTORY_TURNS = 10

export async function POST(request: NextRequest) {
  try {
    const { message, images, history } = (await request.json()) as {
      message: string
      images?: ImageInput[]
      history?: HistoryTurn[]
    }

    const contents: any[] = []

    if (Array.isArray(history)) {
      const trimmedHistory = history.slice(-MAX_HISTORY_TURNS)
      for (const turn of trimmedHistory) {
        contents.push({
          role: turn.role === 'user' ? 'user' : 'model',
          parts: [{ text: turn.text }],
        })
      }
    }

    const currentParts: any[] = []
    if (message && message.trim()) {
      currentParts.push({ text: message })
    }
    if (Array.isArray(images)) {
      for (const img of images) {
        currentParts.push({
          inline_data: {
            mime_type: img.mimeType,
            data: img.base64,
          },
        })
      }
    }

    if (currentParts.length === 0) {
      return NextResponse.json({ error: 'No message or images provided.' }, { status: 400 })
    }

    contents.push({ role: 'user', parts: currentParts })

    const geminiRes = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:streamGenerateContent?alt=sse',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY || '',
        },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: {
            // Gemini 3 Flash can't fully disable thinking, but "low" cuts
            // the silent reasoning time before streaming starts, which was
            // most of the perceived delay. Bump to "medium"/"high" only if
            // answers start getting worse on hard multi-step questions.
            thinkingConfig: { thinkingLevel: 'low' },
            // Keeps generations from running unnecessarily long, which also
            // shortens total response time even though it's streamed.
            maxOutputTokens: 2048,
          },
        }),
      }
    )

    if (!geminiRes.ok || !geminiRes.body) {
      const errData = await geminiRes.json().catch(() => ({}))
      return NextResponse.json(
        { error: errData.error?.message || 'Gemini request failed.' },
        { status: 500 }
      )
    }

    const decoder = new TextDecoder()
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        const reader = geminiRes.body!.getReader()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const jsonStr = line.slice(6).trim()
            if (!jsonStr || jsonStr === '[DONE]') continue

            try {
              const parsed = JSON.parse(jsonStr)
              const text =
                parsed.candidates?.[0]?.content?.parts
                  ?.map((p: any) => p.text || '')
                  .join('') || ''
              if (text) controller.enqueue(encoder.encode(text))
            } catch {
              // skip malformed chunk
            }
          }
        }

        controller.close()
      },
    })

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unexpected server error.' }, { status: 500 })
  }
}
