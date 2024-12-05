import { Groq } from "groq-sdk";
import { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions.mjs";
import { Message } from "@/app/types";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function convertUrlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  const buffer = await blob.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const mimeType = blob.type;
  return `data:${mimeType};base64,${base64}`;
}

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();
    const lastMessage = messages[messages.length - 1] as Message;
    
    // Format messages for Groq API
    const contextMessages = await Promise.all(messages.map(async (msg: Message) => {
      if (Array.isArray(msg.content)) {
        // Convert image URLs to base64
        const formattedContent = await Promise.all(msg.content.map(async (content) => {
          if (content.type === 'image_url' && content.image_url?.url) {
            const base64Url = await convertUrlToBase64(content.image_url.url);
            return {
              type: 'image_url',
              image_url: {
                url: base64Url,
                detail: 'low'
              }
            };
          }
          return content;
        }));
        
        return {
          role: msg.role,
          content: formattedContent
        };
      }
      return {
        role: msg.role,
        content: msg.content
      };
    }));

    console.log('Sending to Groq:', JSON.stringify(contextMessages, null, 2));

    const completion = await groq.chat.completions.create({
      messages: contextMessages,
      model: "llama-3.2-11b-vision-preview",
      temperature: 0.7,
      stream: true,
      max_tokens: 1024
    });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || '';
            controller.enqueue(content);
          }
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain',
        'Transfer-Encoding': 'chunked'
      }
    });
  } catch (error: any) {
    console.error('Groq API error:', error?.response?.data || error);
    return new Response(JSON.stringify({
      error: error.message || 'An error occurred',
      details: error?.response?.data || error
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 