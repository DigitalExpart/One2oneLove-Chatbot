// User Context Builder - Gathers user data for personalized responses
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

interface UserContext {
  subscriptionTier?: string;
  partnerName?: string;
  relationshipGoals?: Array<{ id: string; title: string; progress: number }>;
  upcomingMilestones?: Array<{ id: string; title: string; date: string }>;
  recentActivities?: string[];
  language?: string;
  featureUsage?: Record<string, number>;
}

export async function buildContext(
  supabase: SupabaseClient,
  userId: string
): Promise<UserContext> {
  const context: UserContext = {};

  try {
    // Get user profile and subscription info
    // Note: Adjust table names based on your actual schema
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier, partner_name, language")
      .eq("id", userId)
      .single();

    if (profile) {
      context.subscriptionTier = profile.subscription_tier || "Basis";
      context.partnerName = profile.partner_name;
      context.language = profile.language || "en";
    }

    // Get active relationship goals
    // Note: Adjust table name based on your actual schema
    const { data: goals } = await supabase
      .from("relationship_goals")
      .select("id, title, progress")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(5);

    if (goals) {
      context.relationshipGoals = goals.map((g: any) => ({
        id: g.id,
        title: g.title,
        progress: g.progress || 0,
      }));
    }

    // Get upcoming milestones
    // Note: Adjust table name based on your actual schema
    const { data: milestones } = await supabase
      .from("milestones")
      .select("id, title, date")
      .eq("user_id", userId)
      .gte("date", new Date().toISOString())
      .order("date", { ascending: true })
      .limit(5);

    if (milestones) {
      context.upcomingMilestones = milestones.map((m: any) => ({
        id: m.id,
        title: m.title,
        date: m.date,
      }));
    }

    // Get recent activities (last 7 days)
    // Note: This is a placeholder - adjust based on your activity tracking
    context.recentActivities = [];

    // Get feature usage stats
    // Note: Adjust based on your feature usage tracking
    context.featureUsage = {};

  } catch (error) {
    console.error("Error building user context:", error);
    // Return minimal context on error
  }

  return context;
}

