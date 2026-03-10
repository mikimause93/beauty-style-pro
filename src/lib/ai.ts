import { supabase } from "@/integrations/supabase/client";

export async function aiJobMatch(applicantSkills: string[], applicantExperience: number, jobRequirements: string[], jobDescription: string) {
  const { data, error } = await supabase.functions.invoke("ai-beauty", {
    body: {
      action: "job_match",
      data: { applicantSkills, applicantExperience, jobRequirements, jobDescription },
    },
  });
  if (error) throw error;
  return data?.data;
}

export async function aiGenerateDescription(serviceName: string, category?: string, targetAudience?: string) {
  const { data, error } = await supabase.functions.invoke("ai-beauty", {
    body: {
      action: "generate_description",
      data: { serviceName, category, targetAudience },
    },
  });
  if (error) throw error;
  return data?.data?.text || data?.data;
}

export async function aiSuggestServices(userPreferences?: string[], currentServices?: string[], city?: string) {
  const { data, error } = await supabase.functions.invoke("ai-beauty", {
    body: {
      action: "suggest_services",
      data: { userPreferences, currentServices, city },
    },
  });
  if (error) throw error;
  return data?.data;
}

// ── AI Smart Match ──────────────────────────────────────────────────

export async function aiSmartMatchProfessionals(userCity?: string, preferences?: string[], userType?: string) {
  const { data, error } = await supabase.functions.invoke("ai-smart-match", {
    body: {
      action: "match_professionals",
      user_city: userCity,
      user_preferences: preferences,
      user_type: userType,
    },
  });
  if (error) throw error;
  return data;
}

export async function aiMatchServices(query: string, category?: string) {
  const { data, error } = await supabase.functions.invoke("ai-smart-match", {
    body: {
      action: "match_services",
      data: { query, category },
    },
  });
  if (error) throw error;
  return data;
}

export async function aiMapMatch(lat: number, lng: number, radiusKm = 10, specialty?: string) {
  const { data, error } = await supabase.functions.invoke("ai-smart-match", {
    body: {
      action: "map_match",
      data: { lat, lng, radius_km: radiusKm, specialty },
    },
  });
  if (error) throw error;
  return data;
}

// ── AI Growth Engine ────────────────────────────────────────────────

export async function aiGetGrowthSuggestions(userId: string) {
  const { data, error } = await supabase.functions.invoke("ai-growth-engine", {
    body: { action: "user_suggestions", user_id: userId },
  });
  if (error) throw error;
  return data?.suggestions || [];
}

export async function aiGetContentIdeas(userId: string) {
  const { data, error } = await supabase.functions.invoke("ai-growth-engine", {
    body: { action: "content_ideas", user_id: userId },
  });
  if (error) throw error;
  return data?.ideas || [];
}

export async function aiGetAutoOffers() {
  const { data, error } = await supabase.functions.invoke("ai-growth-engine", {
    body: { action: "auto_offers" },
  });
  if (error) throw error;
  return data?.offers || [];
}

// ── AI Chatbot: Job Match & Service Recommendations ─────────────────

export async function aiJobMatchAnalysis(jobId: string, applicantId: string) {
  const { data, error } = await supabase.functions.invoke("chatbot-assistant", {
    body: {
      action: "job_match",
      data: { job_id: jobId, applicant_id: applicantId },
    },
  });
  if (error) throw error;
  return data;
}

export async function aiRecommendServices(userId: string) {
  const { data, error } = await supabase.functions.invoke("chatbot-assistant", {
    body: {
      action: "recommend_services",
      user_id: userId,
    },
  });
  if (error) throw error;
  return data?.recommendations || [];
}
