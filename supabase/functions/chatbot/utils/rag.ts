// RAG (Retrieval Augmented Generation) Implementation
// Searches knowledge base for relevant context
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

export async function searchKnowledgeBase(
  supabase: SupabaseClient,
  query: string,
  language: string = "en",
  platformId: string | null = null,
  limit: number = 3
): Promise<string> {
  try {
    // For now, we'll do a simple text search
    // In production, you'd want to:
    // 1. Generate embedding for the query
    // 2. Use vector similarity search
    // 3. Return top matching knowledge base entries

    let queryBuilder = supabase
      .from("chatbot_knowledge")
      .select("title, content, content_type")
      .or(`metadata->>'language' eq. ${language}, metadata->>'language' is null`)
      .ilike("content", `%${query}%`);

    // Filter by platform: include platform-specific or global (null) entries
    if (platformId) {
      queryBuilder = queryBuilder.or(`platform_id.eq.${platformId},platform_id.is.null`);
    } else {
      // If no platform specified, only get global entries
      queryBuilder = queryBuilder.is("platform_id", null);
    }

    const { data: results, error } = await queryBuilder.limit(limit);

    if (error) {
      console.error("Knowledge base search error:", error);
      return "";
    }

    if (!results || results.length === 0) {
      return "";
    }

    // Format results as context
    const context = results
      .map((r) => `[${r.content_type}] ${r.title}: ${r.content.substring(0, 200)}...`)
      .join("\n\n");

    return context;
  } catch (error) {
    console.error("RAG search error:", error);
    return "";
  }
}

// Helper function to generate embedding (for future use with vector search)
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured for embeddings");
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "text-embedding-ada-002",
      input: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Embedding API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

