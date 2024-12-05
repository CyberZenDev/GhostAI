import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response('No file provided', { status: 400 });
    }

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${uuidv4()}-${file.name}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase
      .storage
      .from('chat-images')
      .upload(`uploads/${fileName}`, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return new Response(JSON.stringify({
        error: error.message,
        message: 'Failed to upload file',
        details: {
          message: error.message,
          bucketId: 'chat-images',
          path: `uploads/${fileName}`
        }
      }), { status: 500 });
    }

    // Get public URL using your specific bucket URL
    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/chat-images/uploads/${fileName}`;

    return new Response(JSON.stringify({ path: data.path, url: publicUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response('Failed to process upload', { status: 500 });
  }
} 