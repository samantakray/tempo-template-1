import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Polar } from "npm:@polar-sh/sdk";

// Configure CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey, X-Customer-Email",
};

// Log environment variables (masking sensitive values)
console.log("Environment variables: {");
console.log(`  POLAR_ACCESS_TOKEN: "${Deno.env.get("POLAR_ACCESS_TOKEN")?.replace(/./g, "*") || "not set"}",`);
console.log(`  POLAR_ORGANIZATION_ID: "${Deno.env.get("POLAR_ORGANIZATION_ID")?.replace(/./g, "*") || "not set"}",`);
console.log(`  NODE_ENV: "${Deno.env.get("NODE_ENV") || "not set"}"`);
console.log("}");

serve(async (req) => {
  console.log(`Request received at: ${new Date().toISOString()}`);
  console.log(`Request method: ${req.method}`);
  console.log(`Request URL: ${req.url}`);
  
  // Log request headers
  console.log("Request headers:", {
    ...Object.fromEntries(req.headers.entries()),
  });
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }
  
  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({
      error: "Method not allowed. Only POST requests are supported.",
    }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  }
  
  try {
    // Get request body
    const requestText = await req.text();
    console.log("Raw request body: ", requestText);
    
    let requestData;
    try {
      requestData = JSON.parse(requestText);
      console.log("Parsed request data:", requestData);
    } catch (error) {
      console.error("Failed to parse request body:", error);
      return new Response(JSON.stringify({
        error: "Invalid JSON in request body",
        details: error.message,
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }
    
    // Validate required fields
    const { productPriceId, successUrl, customerEmail, metadata } = requestData;
    
    if (!productPriceId) {
      return new Response(JSON.stringify({
        error: "Missing required field: productPriceId",
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }
    
    if (!successUrl) {
      return new Response(JSON.stringify({
        error: "Missing required field: successUrl",
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }
    
    if (!customerEmail) {
      return new Response(JSON.stringify({
        error: "Missing required field: customerEmail",
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }
    
    // Initialize Polar client
    const polar = new Polar({
      apiKey: Deno.env.get("POLAR_ACCESS_TOKEN") || "",
      organizationId: Deno.env.get("POLAR_ORGANIZATION_ID") || "",
    });
    
    console.log(`Creating checkout session for product: ${productPriceId}`);
    console.log(`Customer email: ${customerEmail}`);
    console.log(`Success URL: ${successUrl}`);
    
    // Create checkout session
    const checkoutResponse = await polar.checkout.create({
      productId: productPriceId,
      successUrl,
      customerEmail,
      metadata,
    });
    
    console.log("Checkout session created successfully");
    console.log(`Checkout URL: ${checkoutResponse.checkoutUrl}`);
    
    return new Response(JSON.stringify({
      checkoutUrl: checkoutResponse.checkoutUrl,
      sessionId: checkoutResponse.id,
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    
    // Check for specific error types and provide better error messages
    if (error.message && error.message.includes("Product does not exist")) {
      return new Response(JSON.stringify({
        error: "Invalid product ID. The specified product does not exist.",
        details: error.message,
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }
    
    return new Response(JSON.stringify({
      error: "Failed to create checkout session",
      details: error.message,
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  }
});
