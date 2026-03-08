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
