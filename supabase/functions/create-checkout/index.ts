import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Polar } from "npm:@polar-sh/sdk";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-customer-email',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Log environment variables (without sensitive values)
console.log('Environment variables:', {
  POLAR_ACCESS_TOKEN: Deno.env.get('POLAR_ACCESS_TOKEN') ? '***' : 'Not set',
  POLAR_ORGANIZATION_ID: Deno.env.get('POLAR_ORGANIZATION_ID') ? '***' : 'Not set',
  NODE_ENV: Deno.env.get('NODE_ENV') || 'development'
});

// Initialize Polar client
const polar = new Polar({
  accessToken: Deno.env.get('POLAR_ACCESS_TOKEN'),
  server: "sandbox",
});

console.log('Edge Function started');

serve(async (req) => {
  console.log('Request received:', req.method, req.url);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    // Log request details
    console.log('Request received at:', new Date().toISOString());
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    
    // Parse request body
    let requestBody: any = {};
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      try {
        const text = await req.text();
        console.log('Raw request body:', text);
        
        if (text) {
          try {
            requestBody = JSON.parse(text);
            console.log('Successfully parsed request body:', JSON.stringify(requestBody, null, 2));
          } catch (parseError) {
            console.error('Failed to parse JSON body:', parseError);
            return new Response(
              JSON.stringify({ 
                error: 'Invalid JSON in request body',
                details: parseError.message
              }),
              { 
                status: 400, 
                headers: { 
                  ...corsHeaders, 
                  'Content-Type': 'application/json' 
                } 
              }
            );
          }
        } else {
          console.warn('Empty request body');
        }
      } catch (e) {
        console.error('Error reading request body:', e);
        return new Response(
          JSON.stringify({ 
            error: 'Error reading request body',
            details: e.message
          }),
          { 
            status: 400, 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            } 
          }
        );
      }
    } else {
      console.warn('Unexpected content type:', contentType);
      return new Response(
        JSON.stringify({ 
          error: 'Unsupported content type',
          details: `Expected 'application/json' but got '${contentType}'`
        }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          } 
        }
      );
    }

    const { productPriceId, successUrl, customerEmail, metadata } = requestBody;

    // Validate required fields
    const missingFields = [];
    if (!productPriceId) missingFields.push('productPriceId');
    if (!successUrl) missingFields.push('successUrl');
    if (!customerEmail) missingFields.push('customerEmail');
    if (!metadata) missingFields.push('metadata');

    if (missingFields.length > 0) {
      const errorMsg = `Missing required parameters: ${missingFields.join(', ')}`;
      console.error('Validation error:', errorMsg);
      return new Response(
        JSON.stringify({ 
          error: 'Validation failed',
          details: errorMsg,
          missingFields
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Creating checkout session with:', {
      productPriceId,
      successUrl,
      customerEmail,
      metadata: typeof metadata === 'object' ? metadata : '[non-object]'
    });

    try {
      // Create checkout session
      console.log('Calling Polar API...');
      const result = await polar.checkouts.create({
        productPriceId,
        successUrl,
        customerEmail,
        metadata,
      });

      console.log('Polar API response:', JSON.stringify({
        id: result?.id,
        url: result?.url ? '*** [URL present]' : 'No URL',
        status: 'success'
      }, null, 2));

      return new Response(
        JSON.stringify({ 
          sessionId: result.id, 
          url: result.url,
          success: true 
        }),
        {
          status: 200,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          },
        }
      );
    } catch (apiError) {
      console.error('Polar API Error:', {
        message: apiError.message,
        code: apiError.code,
        response: apiError.response ? {
          status: apiError.response.status,
          statusText: apiError.response.statusText,
          data: apiError.response.data
        } : 'No response',
        stack: apiError.stack
      });
      
      throw apiError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error('Error in checkout process:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      // Include additional error details if available
      ...(error.response ? {
        response: {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        }
      } : {})
    });
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred',
        code: error.code,
        ...(error.response?.data ? { details: error.response.data } : {})
      }),
      {
        status: error.response?.status || 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );
  }
});