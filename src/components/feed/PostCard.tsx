import { Heart, MessageCircle, Share2, Bookmark, Calendar, Phone } from "lucide-react";
import { useState } from "react";
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

export default function PostCard({ post, onShare, onComment, fallbackImage }: PostCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [saved, setSaved] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [comment, setComment] = useState("");
  const [commentCount, setCommentCount] = useState(post.comment_count);
  const [comments, setComments] = useState<{ id: string; message: string; name: string; time: string }[]>([]);

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

  const submitComment = async () => {
    if (!comment.trim() || !user) return;
    const { data, error } = await supabase.from("comments").insert({
      user_id: user.id,
      post_id: post.id,
      message: comment.trim(),
    }).select().single();
    if (!error && data) {
      setComments(prev => [...prev, { id: data.id, message: data.message, name: "Tu", time: "ora" }]);
      setCommentCount(prev => prev + 1);
      setComment("");
    }
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
          <p className="text-sm font-semibold truncate">{post.profileData?.display_name || "Beauty Pro"}</p>
          <p className="text-[11px] text-muted-foreground">{formatTimeAgo(post.created_at)}</p>
        </div>
        <button onClick={() => navigate("/booking")} className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors">
          Prenota
        </button>
      </div>

      {/* Image */}
      {post.image_url && (
        <img
          src={post.image_url}
          alt=""
          className="w-full aspect-[4/5] object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = fallbackImage; }}
        />
      )}

      {/* Actions */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-4">
          <button onClick={toggleLike} className="flex items-center gap-1.5 group">
            <Heart className={`w-[22px] h-[22px] transition-all duration-200 ${liked ? "text-primary fill-primary scale-110" : "text-muted-foreground group-hover:text-foreground"}`} />
            <span className="text-xs font-medium text-muted-foreground">{likeCount}</span>
          </button>
          <button onClick={() => { if (!user) { navigate("/auth"); return; } setShowCommentInput(!showCommentInput); }} className="flex items-center gap-1.5 group">
            <MessageCircle className="w-[22px] h-[22px] text-muted-foreground group-hover:text-foreground transition-colors" />
            <span className="text-xs font-medium text-muted-foreground">{commentCount}</span>
          </button>
          <button onClick={onShare} className="group">
            <Share2 className="w-[22px] h-[22px] text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
          <div className="flex-1" />
          {post.profileData?.user_type === "professional" && (
            <>
              <button onClick={() => navigate(`/booking`)} className="px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
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

        {post.caption && <p className="text-sm leading-relaxed">{post.caption}</p>}

        {/* Contextual Action Buttons */}
        <PostCardActions postType={post.post_type} postId={post.id} userId={post.user_id} userType={post.profileData?.user_type} />

        {comments.length > 0 && (
          <div className="space-y-1.5">
            {comments.map(c => (
              <p key={c.id} className="text-xs">
                <span className="font-semibold">{c.name}</span>{" "}
                <span className="text-muted-foreground">{c.message}</span>
              </p>
            ))}
          </div>
        )}

        {showCommentInput && (
          <div className="flex items-center gap-2 fade-in">
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
        )}
      </div>
    </div>
  );
}