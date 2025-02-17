
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import QRCode from 'https://esm.sh/qrcode@1.5.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Generate QR code for the user's published page URL
    // This URL will always point to their currently published page
    const userPublishedPageUrl = `${Deno.env.get('PUBLIC_SITE_URL')}/u/${profile.id}`
    const qrCodeDataUrl = await QRCode.toDataURL(userPublishedPageUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })

    // Upload QR code to Supabase Storage
    const qrCodeBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64')
    const fileName = `qr-codes/user-${profile.id}.png`

    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('public')
      .upload(fileName, qrCodeBuffer, {
        contentType: 'image/png',
        upsert: true,
      })

    if (uploadError) throw uploadError

    // Get public URL
    const { data: publicUrl } = supabase
      .storage
      .from('public')
      .getPublicUrl(fileName)

    // Update user profile with QR code URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ qr_code_url: publicUrl.publicUrl })
      .eq('id', userId)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({ url: publicUrl.publicUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
