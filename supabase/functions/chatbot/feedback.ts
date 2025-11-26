// Feedback Endpoint for RAG Learning
// Allows users to provide feedback on responses to improve the system
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { processFeedback } from "./utils/rag-learning.ts";

interface FeedbackRequest {
  messageId: string;
  conversationId: string;
  feedbackType: "helpful" | "not_helpful" | "incorrect" | "suggestion";
  rating: number; // 1-5
  comment?: string;
}

serve(async (req) => {
  try {
    // Handle CORS
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        },
      });
    }

    // Parse request
    const { messageId, conversationId, feedbackType, rating, comment }: FeedbackRequest = await req.json();

    if (!messageId || !conversationId || !feedbackType || !rating) {
      return new Response(
        JSON.stringify({ error: "messageId, conversationId, feedbackType, and rating are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (rating < 1 || rating > 5) {
      return new Response(
        JSON.stringify({ error: "Rating must be between 1 and 5" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Process feedback
    const success = await processFeedback(
      supabase,
      messageId,
      conversationId,
      feedbackType,
      rating,
      comment
    );

    if (!success) {
      return new Response(
        JSON.stringify({ error: "Failed to process feedback" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Return success
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Thank you for your feedback! This helps us improve." 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Feedback error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});

