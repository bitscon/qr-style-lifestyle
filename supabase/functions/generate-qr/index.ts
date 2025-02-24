
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import qrcode from "npm:qrcode@1.5.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  console.log("Function called with method:", req.method);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS preflight request");
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  if (req.method !== 'POST') {
    console.log("Invalid method:", req.method);
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const { userId } = await req.json();
    console.log("Processing request for userId:", userId);

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error('User not found');
    }

    console.log('Found user profile:', profile.id);

    // Generate QR code URL
    const baseUrl = Deno.env.get('PUBLIC_SITE_URL') || 'https://qrlife.io';
    const userPublishedPageUrl = `${baseUrl}/u/${profile.id}`;
    
    console.log('Generating QR code for URL:', userPublishedPageUrl);

    // Generate QR code as PNG data URL
    const qrDataUrl = await qrcode.toDataURL(userPublishedPageUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });

    // Convert data URL to binary data
    const base64Data = qrDataUrl.split(',')[1];
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    const fileName = `qr-codes/user-${profile.id}.png`;

    // First, create the qr-codes bucket if it doesn't exist
    const { error: bucketError } = await supabase
      .storage
      .createBucket('qr-codes', {
        public: true,
        fileSizeLimit: 1024 * 1024, // 1MB
      });

    if (bucketError && !bucketError.message.includes('already exists')) {
      console.error('Bucket creation error:', bucketError);
      throw bucketError;
    }

    // Upload to storage
    const { error: uploadError } = await supabase
      .storage
      .from('qr-codes')
      .upload(fileName, binaryData, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: publicUrl } = supabase
      .storage
      .from('qr-codes')
      .getPublicUrl(fileName);

    // Update user profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ qr_code_url: publicUrl.publicUrl })
      .eq('id', userId);

    if (updateError) {
      console.error('Profile update error:', updateError);
      throw updateError;
    }

    console.log('Successfully generated and stored QR code at:', publicUrl.publicUrl);

    return new Response(
      JSON.stringify({ url: publicUrl.publicUrl }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error in generate-qr function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
