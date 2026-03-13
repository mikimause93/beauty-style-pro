import { Heart, MessageCircle, Share2, Bookmark, Calendar, Phone, ChevronLeft, ChevronRight, ThumbsUp, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import PostCardActions from "./PostCardActions";

interface PostCardProps {
  post: {
    id: string;
    user_id: string;
    caption: string | null;
    image_url: string | null;
    video_url: string | null;
    like_count: number;
    comment_count: number;
    post_type: string | null;
    created_at: string;
    profileData?: { display_name: string | null; avatar_url: string | null; user_type: string };
  };
  onShare?: () => void;
  onComment?: () => void;
  fallbackImage: string;
}

interface CommentData {
  id: string;
  message: string;
  user_id: string;
  created_at: string;
  display_name: string;
  avatar_url: string | null;
  like_count: number;
  liked_by_me: boolean;
  applause_count: number;
  applauded_by_me: boolean;
}

export default function PostCard({ post, onShare, onComment, fallbackImage }: PostCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [saved, setSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const [commentCount, setCommentCount] = useState(post.comment_count);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);
  const [likerNames, setLikerNames] = useState<string[]>([]);

  // Check if user already liked this post
  useEffect(() => {
    if (user) {
      supabase.from("post_likes").select("id").eq("user_id", user.id).eq("post_id", post.id).maybeSingle()
        .then(({ data }) => { if (data) setLiked(true); });
    }
  }, [user, post.id]);

  // Fetch names of people who liked (visible to all)
  useEffect(() => {
    if (likeCount > 0) {
      supabase.from("post_likes").select("user_id").eq("post_id", post.id).limit(3)
        .then(async ({ data }) => {
          if (data && data.length > 0) {
            const ids = data.map(d => d.user_id);
            const { data: profiles } = await supabase.from("profiles").select("display_name").in("user_id", ids);
            if (profiles) setLikerNames(profiles.map(p => p.display_name || "Utente").filter(Boolean));
          }
        });
    }
  }, [post.id, likeCount]);

  const formatTimeAgo = (date: string) => {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}g`;
  };

  const toggleLike = async () => {
    if (!user) { navigate("/auth"); return; }
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount(prev => prev + (newLiked ? 1 : -1));
    if (newLiked) {
      await supabase.from("post_likes").insert({ user_id: user.id, post_id: post.id });
    } else {
      await supabase.from("post_likes").delete().eq("user_id", user.id).eq("post_id", post.id);
    }
  };

  const loadComments = async () => {
    setLoadingComments(true);
    const { data } = await supabase
      .from("comments")
      .select("id, message, user_id, created_at")
      .eq("post_id", post.id)
      .order("created_at", { ascending: true })
      .limit(50);

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      setComments(data.map(c => {
        const p = profileMap.get(c.user_id);
        return {
          id: c.id,
          message: c.message,
          user_id: c.user_id,
          created_at: c.created_at,
          display_name: p?.display_name || "Utente",
          avatar_url: p?.avatar_url || null,
          like_count: 0,
          liked_by_me: false,
          applause_count: 0,
          applauded_by_me: false,
        };
      }));
    }
    setLoadingComments(false);
  };

  const toggleComments = () => {
    if (!user) { navigate("/auth"); return; }
    const next = !showComments;
    setShowComments(next);
    if (next && comments.length === 0) loadComments();
  };

  const submitComment = async () => {
    if (!comment.trim() || !user) return;
    const { data, error } = await supabase.from("comments").insert({
      user_id: user.id,
      post_id: post.id,
      message: comment.trim(),
    }).select().single();
    if (!error && data) {
      const { data: prof } = await supabase.from("profiles").select("display_name, avatar_url").eq("user_id", user.id).maybeSingle();
      setComments(prev => [...prev, {
        id: data.id,
        message: data.message,
        user_id: user.id,
        created_at: data.created_at,
        display_name: prof?.display_name || "Tu",
        avatar_url: prof?.avatar_url || null,
        like_count: 0,
        liked_by_me: false,
        applause_count: 0,
        applauded_by_me: false,
      }]);
      setCommentCount(prev => prev + 1);
      setComment("");
    }
  };

  const toggleCommentLike = (commentId: string) => {
    setComments(prev => prev.map(c => c.id === commentId ? {
      ...c,
      liked_by_me: !c.liked_by_me,
      like_count: c.like_count + (c.liked_by_me ? -1 : 1),
    } : c));
  };

  const toggleCommentApplause = (commentId: string) => {
    setComments(prev => prev.map(c => c.id === commentId ? {
      ...c,
      applauded_by_me: !c.applauded_by_me,
      applause_count: c.applause_count + (c.applauded_by_me ? -1 : 1),
    } : c));
  };

  // Like label with real names visible to all
  const getLikeLabel = () => {
    if (likeCount === 0) return "";
    if (liked && likeCount === 1) return "Piace a te";
    if (liked && likerNames.length > 0) {
      const others = likerNames.filter(n => n !== "Tu").slice(0, 2);
      return others.length > 0
        ? `Piace a te, ${others.join(", ")} ${likeCount > others.length + 1 ? `e altri ${likeCount - others.length - 1}` : ""}`
        : `Piace a te e altre ${likeCount - 1} persone`;
    }
    if (likerNames.length > 0) {
      return likeCount <= 3
        ? `Piace a ${likerNames.join(", ")}`
        : `Piace a ${likerNames.slice(0, 2).join(", ")} e altri ${likeCount - 2}`;
    }
    return `${likeCount} ${likeCount === 1 ? "like" : "likes"}`;
  };

  return (
    <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <button onClick={() => navigate(`/profile/${post.user_id}`)}>
          <img
            src={post.profileData?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.id}`}
            alt=""
            className="w-10 h-10 rounded-full object-cover ring-1 ring-border"
            onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.id}`; }}
          />
        </button>
        <div className="flex-1 min-w-0">
          <button onClick={() => navigate(`/profile/${post.user_id}`)} className="text-sm font-semibold truncate block hover:text-primary transition-colors">
            {post.profileData?.display_name || "Beauty Pro"}
          </button>
          <p className="text-[11px] text-muted-foreground">{formatTimeAgo(post.created_at)}</p>
        </div>
        {(post.profileData?.user_type === "professional" || post.profileData?.user_type === "business") && (
          <button onClick={() => navigate(`/booking/${post.user_id}`)} className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors">
            Prenota
          </button>
        )}
      </div>

      {/* Image / Before-After */}
      {post.post_type === "before_after" && (post as any).before_image_url && (post as any).after_image_url ? (
        <div className="relative aspect-square overflow-hidden">
          <img src={(post as any).after_image_url} alt="Dopo" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
            <img src={(post as any).before_image_url} alt="Prima" className="w-full h-full object-cover"
              style={{ width: `${100 / (sliderPos / 100)}%`, maxWidth: "none" }} />
          </div>
          <div className="absolute top-0 bottom-0 w-0.5 bg-primary-foreground z-10" style={{ left: `${sliderPos}%` }}>
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full gradient-primary flex items-center justify-center shadow-glow">
              <ChevronLeft className="w-3 h-3 text-primary-foreground" />
              <ChevronRight className="w-3 h-3 text-primary-foreground" />
            </div>
          </div>
          <div className="absolute top-3 left-3 px-2 py-1 rounded-full glass text-[10px] font-bold">Prima</div>
          <div className="absolute top-3 right-3 px-2 py-1 rounded-full glass text-[10px] font-bold">Dopo</div>
          <input type="range" min={10} max={90} value={sliderPos}
            onChange={e => setSliderPos(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20" />
        </div>
      ) : post.image_url ? (
        <img
          src={post.image_url}
          alt=""
          className="w-full aspect-[4/5] object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = fallbackImage; }}
        />
      ) : null}

      {/* Actions */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-4">
          <button onClick={toggleLike} className="flex items-center gap-1.5 group">
            <Heart className={`w-[22px] h-[22px] transition-all duration-200 ${liked ? "text-primary fill-primary scale-110" : "text-muted-foreground group-hover:text-foreground"}`} />
          </button>
          <button onClick={toggleComments} className="flex items-center gap-1.5 group">
            <MessageCircle className="w-[22px] h-[22px] text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
          <button onClick={onShare} className="group">
            <Share2 className="w-[22px] h-[22px] text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
          <div className="flex-1" />
          {(post.profileData?.user_type === "professional" || post.profileData?.user_type === "business") && (
            <>
              <button onClick={() => navigate(`/booking/${post.user_id}`)} className="px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                Prenota
              </button>
              <button onClick={() => navigate(`/chat`)} className="w-[22px] h-[22px]">
                <Phone className="w-[18px] h-[18px] text-muted-foreground" />
              </button>
            </>
          )}
          <button onClick={() => setSaved(!saved)}>
            <Bookmark className={`w-[22px] h-[22px] transition-all duration-200 ${saved ? "text-primary fill-primary" : "text-muted-foreground"}`} />
          </button>
        </div>

        {/* Like count with names - visible to all */}
        {likeCount > 0 && (
          <p className="text-xs font-semibold">{getLikeLabel()}</p>
        )}

        {/* Caption with username */}
        {post.caption && (
          <p className="text-sm leading-relaxed">
            <button onClick={() => navigate(`/profile/${post.user_id}`)} className="font-semibold mr-1 hover:text-primary transition-colors">
              {post.profileData?.display_name || "Beauty Pro"}
            </button>
            {post.caption}
          </p>
        )}

        {/* View all comments link */}
        {commentCount > 0 && !showComments && (
          <button onClick={toggleComments} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Visualizza {commentCount > 1 ? `tutti i ${commentCount} commenti` : "1 commento"}
          </button>
        )}

        {/* Contextual Action Buttons */}
        <PostCardActions postType={post.post_type} postId={post.id} userId={post.user_id} userType={post.profileData?.user_type} />

        {/* Comments section */}
        {showComments && (
          <div className="space-y-2 fade-in">
            {loadingComments && (
              <div className="flex justify-center py-2">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {comments.map(c => (
              <div key={c.id} className="flex items-start gap-2">
                <button onClick={() => navigate(`/profile/${c.user_id}`)}>
                  <img
                    src={c.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.user_id}`}
                    alt=""
                    className="w-7 h-7 rounded-full object-cover shrink-0"
                  />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-xs">
                    <button onClick={() => navigate(`/profile/${c.user_id}`)} className="font-semibold mr-1 hover:text-primary transition-colors">
                      {c.display_name}
                    </button>
                    <span className="text-muted-foreground">{c.message}</span>
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">{formatTimeAgo(c.created_at)}</span>
                    {/* Like */}
                    <button onClick={() => toggleCommentLike(c.id)} className="flex items-center gap-0.5">
                      <ThumbsUp className={`w-3 h-3 ${c.liked_by_me ? "text-primary fill-primary" : "text-muted-foreground"}`} />
                      {c.like_count > 0 && <span className="text-[10px] text-muted-foreground">{c.like_count}</span>}
                    </button>
                    {/* Applause */}
                    <button onClick={() => toggleCommentApplause(c.id)} className="flex items-center gap-0.5">
                      <Sparkles className={`w-3 h-3 ${c.applauded_by_me ? "text-accent fill-accent" : "text-muted-foreground"}`} />
                      {c.applause_count > 0 && <span className="text-[10px] text-muted-foreground">{c.applause_count}</span>}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Comment input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                value={comment}
                onChange={e => setComment(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submitComment()}
                placeholder="Scrivi un commento..."
                className="flex-1 bg-muted rounded-full px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
              <button
                onClick={submitComment}
                disabled={!comment.trim()}
                className="px-4 py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-40 transition-opacity"
              >
                Invia
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
