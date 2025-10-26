import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Clock, User, Eye, Heart, Bookmark, Share2, MessageSquare,
  Twitter, Facebook, Linkedin, Copy, CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import CommentSection from "../components/articles/CommentSection";
import ShareMenu from "../components/articles/ShareMenu";
import RelatedArticles from "../components/articles/RelatedArticles";

export default function Article() {
  const urlParams = new URLSearchParams(window.location.search);
  const articleId = urlParams.get("id");
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      }
    };
    checkAuth();
  }, []);

  const { data: article, isLoading } = useQuery({
    queryKey: ['article', articleId],
    queryFn: async () => {
      const articles = await base44.entities.Article.filter({ id: articleId });
      if (articles.length > 0) {
        // Increment view count
        await base44.entities.Article.update(articleId, {
          views_count: (articles[0].views_count || 0) + 1
        });
        return articles[0];
      }
      return null;
    },
    enabled: !!articleId,
  });

  const { data: savedArticles } = useQuery({
    queryKey: ['savedArticles', user?.email],
    queryFn: () => base44.entities.SavedArticle.filter({ created_by: user.email }),
    enabled: !!user,
    initialData: [],
  });

  const { data: userLike } = useQuery({
    queryKey: ['articleLike', articleId, user?.email],
    queryFn: () => base44.entities.ArticleLike.filter({ article_id: articleId, created_by: user.email }),
    enabled: !!user && !!articleId,
    initialData: [],
  });

  const isSaved = savedArticles.some(s => s.article_id === articleId);
  const isLiked = userLike.length > 0;

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isSaved) {
        const saved = savedArticles.find(s => s.article_id === articleId);
        await base44.entities.SavedArticle.delete(saved.id);
      } else {
        await base44.entities.SavedArticle.create({ article_id: articleId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedArticles'] });
    },
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (isLiked) {
        await base44.entities.ArticleLike.delete(userLike[0].id);
        await base44.entities.Article.update(articleId, {
          likes_count: Math.max(0, (article.likes_count || 0) - 1)
        });
      } else {
        await base44.entities.ArticleLike.create({ article_id: articleId, reaction_type: "like" });
        await base44.entities.Article.update(articleId, {
          likes_count: (article.likes_count || 0) + 1
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['article', articleId] });
      queryClient.invalidateQueries({ queryKey: ['articleLike'] });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <Skeleton className="w-full h-96 mb-8" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Article not found</h1>
        <Link to={createPageUrl("Home")}>
          <Button>Return to Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[var(--background)]">
      <article className="max-w-4xl mx-auto px-4 py-12">
        {/* Category Badge */}
        <div className="flex items-center gap-2 mb-4">
          <Link to={createPageUrl("Category") + `?name=${article.category}`}>
            <span className="px-3 py-1 bg-[var(--primary)] text-white rounded-full text-sm font-semibold uppercase hover:bg-[var(--primary)]/90 transition-colors">
              {article.category}
            </span>
          </Link>
          {article.labels?.map((label, i) => (
            <span key={i} className="px-3 py-1 bg-[var(--muted)] text-[var(--muted-foreground)] rounded-full text-sm">
              {label}
            </span>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
          {article.title}
        </h1>

        {/* Subtitle */}
        {article.subtitle && (
          <p className="text-xl text-[var(--muted-foreground)] mb-6">
            {article.subtitle}
          </p>
        )}

        {/* Article Meta */}
        <div className="flex flex-wrap items-center gap-4 pb-6 mb-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[var(--muted-foreground)]" />
            <span className="font-semibold">{article.author_name || article.created_by}</span>
          </div>
          <span className="text-[var(--muted-foreground)]">•</span>
          <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
            <Clock className="w-4 h-4" />
            <span>{format(new Date(article.published_date || article.created_date), "MMMM d, yyyy 'at' HH:mm")}</span>
          </div>
          {article.reading_time && (
            <>
              <span className="text-[var(--muted-foreground)]">•</span>
              <span className="text-[var(--muted-foreground)]">{article.reading_time} min read</span>
            </>
          )}
          <span className="text-[var(--muted-foreground)]">•</span>
          <div className="flex items-center gap-1 text-[var(--muted-foreground)]">
            <Eye className="w-4 h-4" />
            <span>{article.views_count || 0} views</span>
          </div>
        </div>

        {/* Lead Image */}
        {article.lead_image_url && (
          <div className="mb-8 rounded-lg overflow-hidden">
            <img
              src={article.lead_image_url}
              alt={article.title}
              className="w-full h-auto"
            />
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center justify-between py-4 mb-8 border-y border-[var(--border)]">
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => likeMutation.mutate()}
                  className={`gap-2 ${isLiked ? 'text-red-500 border-red-500' : ''}`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                  {article.likes_count || 0}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => saveMutation.mutate()}
                  className={`gap-2 ${isSaved ? 'text-blue-500 border-blue-500' : ''}`}
                >
                  <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                  {isSaved ? 'Saved' : 'Save'}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => base44.auth.redirectToLogin()}
              >
                Sign in to like & save
              </Button>
            )}
          </div>
          <ShareMenu article={article} />
        </div>

        {/* Article Body */}
        <div
          className="prose prose-lg max-w-none mb-12"
          dangerouslySetInnerHTML={{ __html: article.body }}
          style={{
            color: 'var(--foreground)',
            fontFamily: 'Georgia, serif',
            lineHeight: '1.8',
          }}
        />

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {article.tags.map((tag, i) => (
              <Link
                key={i}
                to={createPageUrl("Search") + `?q=${encodeURIComponent(tag)}`}
                className="px-3 py-1 bg-[var(--muted)] text-[var(--muted-foreground)] rounded-full text-sm hover:bg-[var(--muted-foreground)] hover:text-white transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Comments Section */}
        <CommentSection articleId={articleId} article={article} user={user} />
      </article>

      {/* Related Articles Sidebar */}
      <div className="bg-[var(--muted)] py-12">
        <div className="max-w-7xl mx-auto px-4">
          <RelatedArticles category={article.category} currentArticleId={articleId} />
        </div>
      </div>
    </div>
  );
}