import { usePresenceTracker } from "@/hooks/usePresence";

/** Invisible component that keeps the user's online presence updated */
export default function PresenceTracker() {
  usePresenceTracker();
  return null;
}
