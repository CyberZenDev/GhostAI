import { Groq } from "groq-sdk";

type GroqMessageParam = {
  role: "system" | "user" | "assistant";
  content: string;
};

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

type ChatMode = 'software' | 'notetaking' | 'research' | 'general' | 'image';

const SYSTEM_PROMPTS: Record<ChatMode, string> = {
  software: "You are an AI technical interviewer assistant...",
  notetaking: "You are an AI note-taking assistant...",
  research: "You are an AI research assistant...",
  general: "You are a helpful AI assistant called GhostAI. If anyone asks you for your name, you say 'GhostAI'. You are a general purpose AI assistant that can help with a wide range of tasks. You need to reply in a style similar to the user's style.",
  image: `You are an AI image generation assistant. Your role is to help create images using pollinations.ai.

To generate an image, create a markdown image link in this format:

![Image](https://image.pollinations.ai/prompt/{description}?width=1024&height=1024&nologo=poll&nofeed=yes&model=Flux&seed={random})

Where:
- {description} is the image description (URL encoded)
- {random} is a random 5-digit number

Always generate 2 variations of each image with different random seeds.
Keep descriptions clear and detailed but not too long.
URL encode all descriptions.
After generating images, add: "If you'd like different variations, just ask!"`,
};

export async function POST(request: Request) {
  try {
    const { messages, mode = 'general' } = await request.json() as { 
      messages: GroqMessageParam[]; 
      mode: ChatMode;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Valid message history is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get the last 4 messages from the chat history
    const recentMessages = messages.slice(-4);

    // Create messages array with system prompt
    const contextMessages = [
      { role: 'system', content: SYSTEM_PROMPTS[mode] },
      ...recentMessages
    ];

    const completion = await groq.chat.completions.create({
      messages: contextMessages,
      model: "mixtral-8x7b-32768",
      temperature: 0.7,
      max_tokens: 1024,
      stream: true,
    });

    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of completion) {
              const content = chunk.choices[0]?.delta?.content || '';
              if (content) {
                controller.enqueue(content);
              }
            }
          } catch (error) {
            console.error('Streaming error:', error);
          } finally {
            controller.close();
          }
        },
      }),
      {
        headers: {
          'Content-Type': 'text/plain',
          'Transfer-Encoding': 'chunked',
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response('Failed to process the request. Please try again later.', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
} 