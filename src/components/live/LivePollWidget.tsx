import { useState, useEffect } from "react";
import { BarChart3, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface LivePollWidgetProps {
  streamId: string;
}

interface Poll {
  id: string;
  question: string;
  options: string[];
  results: Record<string, number>;
  is_active: boolean;
}

export default function LivePollWidget({ streamId }: LivePollWidgetProps) {
  const { user } = useAuth();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [voted, setVoted] = useState<number | null>(null);
  const [totalVotes, setTotalVotes] = useState(0);

  useEffect(() => {
    fetchActivePoll();

    const channel = supabase
      .channel(`poll-${streamId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "live_polls", filter: `stream_id=eq.${streamId}` }, () => {
        fetchActivePoll();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "poll_votes" }, () => {
        fetchActivePoll();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamId]);

  const fetchActivePoll = async () => {
    const { data } = await supabase
      .from("live_polls")
      .select("*")
      .eq("stream_id", streamId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      const options = Array.isArray(data.options) ? data.options as string[] : [];
      const results = (data.results && typeof data.results === 'object' && !Array.isArray(data.results))
        ? data.results as Record<string, number>
        : {};
      setPoll({ ...data, options, results });
      const total = Object.values(results).reduce((a: number, b) => a + (b as number), 0);
      setTotalVotes(total);

      // Check if user already voted
      if (user) {
        const { data: vote } = await supabase
          .from("poll_votes")
          .select("option_index")
          .eq("poll_id", data.id)
          .eq("user_id", user.id)
          .maybeSingle();
        if (vote) setVoted(vote.option_index);
      }
    } else {
      setPoll(null);
    }
  };

  const vote = async (index: number) => {
    if (!poll || !user || voted !== null) return;

    setVoted(index);

    await supabase.from("poll_votes").insert({
      poll_id: poll.id,
      user_id: user.id,
      option_index: index,
    });

    // Update results
    const newResults = { ...poll.results };
    newResults[String(index)] = (newResults[String(index)] || 0) + 1;
    await supabase.from("live_polls").update({ results: newResults }).eq("id", poll.id);
  };

  if (!poll) return null;

  return (
    <div className="glass rounded-2xl p-4 mb-3 fade-in border border-primary/20">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4 text-primary" />
        <p className="text-sm font-bold">Sondaggio</p>
        <span className="text-xs text-muted-foreground ml-auto">{totalVotes} voti</span>
      </div>
      <p className="text-sm font-medium mb-3">{poll.question}</p>
      <div className="space-y-2">
        {poll.options.map((option, i) => {
          const count = poll.results[String(i)] || 0;
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const isVoted = voted === i;

          return (
            <button
              key={i}
              onClick={() => vote(i)}
              disabled={voted !== null}
              className={`w-full relative overflow-hidden rounded-xl p-3 text-left transition-all ${
                isVoted ? "border-2 border-primary" : "border border-border"
              } ${voted === null ? "hover:border-primary/50" : ""}`}
            >
              {voted !== null && (
                <div
                  className="absolute inset-y-0 left-0 bg-primary/10 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              )}
              <div className="relative flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  {isVoted && <CheckCircle2 className="w-4 h-4 text-primary" />}
                  {option}
                </span>
                {voted !== null && (
                  <span className="text-xs font-bold text-primary">{pct}%</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
