"use client";

import { supabase } from "../../supabase/supabase";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { User } from "@supabase/supabase-js";
import { Check } from "lucide-react";

interface PricingCardProps {
  item: {
    id: string;
    name: string;
    description?: string;
    prices?: Array<{
      id: string;
      amount: number;
      currency: string;
      formattedAmount: string;
      displayAmount: string;
    }>;
  };
  user: User | null;
}

export default function PricingCard({
  item,
  user,
}: PricingCardProps) {
  // Handle checkout process
  const handleCheckout = async (priceId: string) => {
    console.log('Starting checkout process...');
    
    if (!user) {
      console.log('No user found, redirecting to sign-in');
      window.location.href = "/sign-in";
      return;
    }

    if (!priceId) {
      console.error('No price ID provided');
      alert('Invalid price ID. Please try again.');
      return;
    }

    try {
      console.log('Creating checkout with price ID:', priceId);
      console.log('User email:', user.email);
      
      // Prepare the request body according to the new Edge Function's expected format
      // Use the Polar product ID from the item data
      const polarProductId = item.id;
      const polarPriceId = item.prices?.[0]?.id;
      
      console.log('Creating checkout with product ID:', polarProductId);
      console.log('Using price ID:', polarPriceId);
      
      const requestBody = {
        productPriceId: polarProductId, // Use the Polar product ID
        successUrl: `${window.location.origin}/dashboard`,
        customerEmail: user.email || "",
        metadata: {
          user_id: user.id,
          source: 'web_checkout',
          timestamp: new Date().toISOString(),
          price_id: polarPriceId // Store the price ID for reference
        },
      };

      console.log('Request payload:', JSON.stringify(requestBody, null, 2));

      console.log('Sending request to create-checkout-robust Edge Function...');
      const { data, error } = await supabase.functions.invoke(
        "create-checkout-robust",
        {
          method: 'POST',
          body: requestBody, // No need to stringify, the invoke method does it automatically
          headers: {
            "Content-Type": "application/json",
            "x-customer-email": user.email || ""
            // No need for explicit Authorization header as it's automatically included by the Supabase client
          },
        }
      );

      console.log('Edge Function response:', { data, error });

      if (error) {
        console.error('Error from Edge Function:', error);
        throw error;
      }

      // Check if we got a valid response with a checkout URL
      if (data?.checkoutUrl) {
        console.log('Redirecting to checkout URL:', data.checkoutUrl);
        window.location.href = data.checkoutUrl;
      } else {
        console.error('No checkout URL returned in response:', data);
        throw new Error("No checkout URL returned in the response");
      }
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      
      // Extract error details from the response if available
      let errorMessage = 'Failed to start checkout';
      let errorDetails = '';
      
      if (error?.message) {
        errorMessage = error.message;
      }
      
      // Check if we have a structured error response from the Edge Function
      if (error?.error) {
        const responseError = error.error;
        if (typeof responseError === 'object') {
          if (responseError.error) errorMessage = responseError.error;
          if (responseError.details) errorDetails = responseError.details;
        } else if (typeof responseError === 'string') {
          errorDetails = responseError;
        }
      }
      
      // Show a user-friendly error message
      const fullErrorMessage = errorDetails 
        ? `${errorMessage}: ${errorDetails}` 
        : `${errorMessage}. Please try again later.`;
      
      console.error('Formatted error message:', fullErrorMessage);
      alert(fullErrorMessage);
    }
  };

  return (
    <Card
      className={`w-[350px] relative overflow-hidden ${item.popular ? "border-2 border-green-500 shadow-xl scale-105" : "border border-gray-200"}`}
    >
      {item.popular && (
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-blue-50 opacity-30" />
      )}
      <CardHeader className="relative">
        {item.popular && (
          <div className="px-4 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-blue-600 rounded-full w-fit mb-4">
            Most Popular
          </div>
        )}
        <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">
          {item.name}
        </CardTitle>
        <CardDescription className="flex items-baseline gap-2 mt-2">
          <span className="text-4xl font-bold text-gray-900">
            ${item?.prices?.[0]?.priceAmount / 100}
          </span>
          <span className="text-gray-600">/month</span>
        </CardDescription>
      </CardHeader>
      {item.description && (
        <CardContent className="relative">
          <ul className="space-y-4">
            {item.description.split("\n").map((desc: string, index: number) => (
              <li key={index} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                <span className="text-gray-600">{desc.trim()}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      )}
      <CardFooter className="relative">
        <Button
          onClick={async () => {
            await handleCheckout(item?.prices?.[0]?.id);
          }}
          className={`w-full py-6 text-lg font-medium ${
            item.popular
              ? "bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
              : "bg-gray-100 hover:bg-gray-200 text-gray-900"
          }`}
        >
          Start Tracking
        </Button>
      </CardFooter>
    </Card>
  );
}
