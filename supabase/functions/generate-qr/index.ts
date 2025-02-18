
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import * as qrcode from "https://deno.land/x/qrcode@v2.0.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function base64ToUint8Array(base64String: string): Uint8Array {
  const raw = atob(base64String);
  const array = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    array[i] = raw.charCodeAt(i);
  }
  return array;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { userId } = await req.json()
    if (!userId) {
      throw new Error('User ID is required')
    }

    console.log('Generating QR code for user:', userId)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseKey) throw new Error('Missing environment variables')
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get the user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      throw new Error('User not found')
    }

    console.log('Found user profile:', profile.id)

    // Generate QR code URL (this would be the URL to the user's published page)
    const baseUrl = Deno.env.get('PUBLIC_SITE_URL') || 'https://qrlife.io'
    const userPublishedPageUrl = `${baseUrl}/u/${profile.id}`
    
    console.log('Generating QR code for URL:', userPublishedPageUrl)

    // Generate QR code as a PNG data URL
    const qrDataUrl = await qrcode.generate(userPublishedPageUrl);
    const qrBase64 = qrDataUrl.split(',')[1];

    // Convert base64 to binary data using TextEncoder
    const decoder = new TextDecoder('utf-8');
    const encoder = new TextEncoder();
    const binaryData = encoder.encode(decoder.decode(base64ToUint8Array(qrBase64)));

    const fileName = `qr-codes/user-${profile.id}.png`;

    console.log('QR code generated successfully')
    console.log('Uploading QR code to storage')

    // Upload to storage
    const { error: uploadError } = await supabase
      .storage
      .from('public')
      .upload(fileName, binaryData, {
        contentType: 'image/png',
        upsert: true,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw uploadError
    }

    console.log('QR code uploaded successfully')

    // Get public URL
    const { data: publicUrl } = supabase
      .storage
      .from('public')
      .getPublicUrl(fileName)

    console.log('Got public URL:', publicUrl.publicUrl)

    // Update user profile with QR code URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ qr_code_url: publicUrl.publicUrl })
      .eq('id', userId)

    if (updateError) {
      console.error('Profile update error:', updateError)
      throw updateError
    }

    console.log('Profile updated with QR code URL')

    return new Response(
      JSON.stringify({ url: publicUrl.publicUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in generate-qr function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
