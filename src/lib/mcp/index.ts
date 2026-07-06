import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchProfessionals from "./tools/search-professionals";
import listMyBookings from "./tools/list-my-bookings";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "stayle-mcp",
  title: "Stayle App MCP",
  version: "0.1.0",
  instructions:
    "Tools for the Stayle beauty & lifestyle app. Use search_professionals to find registered beauty pros and list_my_bookings for the signed-in user's bookings.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchProfessionals, listMyBookings],
});