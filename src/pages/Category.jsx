import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import ArticleCard from "../components/articles/ArticleCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Category() {
  const urlParams = new URLSearchParams(window.location.search);
  const categoryName = urlParams.get("name");
  const labelFilter = urlParams.get("label");

  const { data: articles, isLoading } = useQuery({
    queryKey: ['categoryArticles', categoryName, labelFilter],
    queryFn: async () => {
      let filtered = await base44.entities.Article.filter(
        { category: categoryName, status: "published" },
        "-published_date",
        50
      );

      // Client-side label filtering if needed
      if (labelFilter) {
        filtered = filtered.filter(a => a.labels && a.labels.includes(labelFilter));
      }

      return filtered;
    },
    initialData: [],
  });

  return (
    <div className="bg-[var(--background)] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{categoryName}</h1>
          {labelFilter && (
            <p className="text-xl text-[var(--muted-foreground)]">
              Filtered by: <span className="font-semibold">{labelFilter}</span>
            </p>
          )}
          <div className="flex items-center gap-2 mt-4 text-sm text-[var(--muted-foreground)]">
            <Filter className="w-4 h-4" />
            <span>{articles.length} articles</span>
          </div>
        </div>

        {/* Articles Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(9).fill(0).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="w-full h-48 rounded-lg" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : articles.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-[var(--muted-foreground)] text-lg mb-4">
              No articles found in this category yet.
            </p>
            <Button onClick={() => window.history.back()}>
              Go Back
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}