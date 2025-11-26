// Script to create a new platform in the database
// Usage: deno run --allow-net --allow-env scripts/create-platform.ts

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  Deno.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface PlatformInput {
  platform_key: string;
  name: string;
  domain?: string;
  branding?: {
    primary_color?: string;
    secondary_color?: string;
    gradient?: string;
  };
  mission_statement?: string;
  features?: string[];
  subscription_tiers?: Record<string, any>;
}

async function createPlatform(input: PlatformInput) {
  const { data, error } = await supabase
    .from("chatbot_platforms")
    .insert({
      platform_key: input.platform_key,
      name: input.name,
      domain: input.domain || null,
      branding: input.branding || {},
      mission_statement: input.mission_statement || null,
      features: input.features || [],
      subscription_tiers: input.subscription_tiers || {},
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating platform:", error);
    return null;
  }

  console.log("✅ Platform created successfully!");
  console.log("Platform ID:", data.id);
  console.log("Platform Key:", data.platform_key);
  console.log("Platform Name:", data.name);
  return data;
}

// Example usage
if (import.meta.main) {
  const args = Deno.args;
  
  if (args.length < 2) {
    console.log("Usage: deno run --allow-net --allow-env scripts/create-platform.ts <platform_key> <name>");
    console.log("\nExample:");
    console.log('  deno run scripts/create-platform.ts couplesconnect "Couples Connect"');
    Deno.exit(1);
  }

  const platformKey = args[0];
  const name = args[1];
  const domain = args[2] || undefined;

  await createPlatform({
    platform_key: platformKey,
    name: name,
    domain: domain,
    branding: {
      primary_color: "#3b82f6",
      secondary_color: "#8b5cf6",
      gradient: "from-blue-500 to-purple-600",
    },
    mission_statement: "Helping couples build stronger relationships.",
  });
}

export { createPlatform };

