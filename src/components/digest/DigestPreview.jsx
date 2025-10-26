import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Clock, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DigestPreview({ preferences }) {
  const { data: articles, isLoading } = useQuery({
    queryKey: ['digestPreview', preferences],
    queryFn: async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      let query = {
        status: "published",
      };

      // If user has category preferences, filter by them
      if (preferences.preferred_categories && preferences.preferred_categories.length > 0) {
        // Note: This is simplified - in production, you'd use $in operator
        // For now, we'll fetch all and filter client-side
      }

      let allArticles = await base44.entities.Article.filter(query, "-published_date", 50);

      // Client-side filtering by categories if specified
      if (preferences.preferred_categories && preferences.preferred_categories.length > 0) {
        allArticles = allArticles.filter(a =>
          preferences.preferred_categories.includes(a.category)
        );
      }

      // Sort by editorial priority and recency
      const sortedArticles = allArticles.sort((a, b) => {
        const scoreA = (a.is_editor_pick ? 40 : 0) + (a.views_count || 0) * 0.01;
        const scoreB = (b.is_editor_pick ? 40 : 0) + (b.views_count || 0) * 0.01;
        return scoreB - scoreA;
      });

      return sortedArticles.slice(0, preferences.num_articles || 5);
    },
    enabled: !!preferences,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview: Next Digest</CardTitle>
        <p className="text-sm text-[var(--muted-foreground)]">
          Here's what your digest might look like based on your preferences
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="p-4 border border-[var(--border)] rounded-lg">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ))
        ) : articles && articles.length > 0 ? (
          articles.map((article, index) => (
            <Link
              key={article.id}
              to={createPageUrl("Article") + `?id=${article.id}`}
              className="block p-4 border border-[var(--border)] rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-[var(--primary)] text-white rounded text-xs font-semibold uppercase">
                      {article.category}
                    </span>
                    {article.is_editor_pick && (
                      <span className="px-2 py-0.5 bg-yellow-400 text-yellow-900 rounded text-xs font-semibold">
                        Editor's Pick
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold mb-2 group-hover:text-[var(--accent)] transition-colors">
                    {article.title}
                  </h4>
                  <p className="text-sm text-[var(--muted-foreground)] mb-3 line-clamp-3">
                    {article.summary || article.subtitle || article.body.replace(/<[^>]*>/g, '').substring(0, 200) + '...'}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{article.author_name || article.created_by}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{format(new Date(article.published_date), "MMM d, HH:mm")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-8 text-[var(--muted-foreground)]">
            No articles match your preferences yet. Try adjusting your categories or check back later.
          </div>
        )}
      </CardContent>
    </Card>
  );
}