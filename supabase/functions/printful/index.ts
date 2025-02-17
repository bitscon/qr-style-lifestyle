
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { action, orderId, productId, shippingDetails } = await req.json()
    
    const PRINTFUL_API_KEY = Deno.env.get('PRINTFUL_API_KEY')
    if (!PRINTFUL_API_KEY) throw new Error('Printful API key not configured')

    const printfulApi = async (endpoint: string, method = 'GET', body?: any) => {
      const response = await fetch(`https://api.printful.com/${endpoint}`, {
        method,
        headers: {
          'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Printful API error')
      }
      
      return response.json()
    }

    let result
    switch (action) {
      case 'createOrder':
        result = await printfulApi('orders', 'POST', {
          recipient: shippingDetails,
          items: [{ sync_variant_id: productId }],
        })
        break
      
      case 'getOrder':
        result = await printfulApi(`orders/${orderId}`)
        break
      
      default:
        throw new Error('Invalid action')
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
