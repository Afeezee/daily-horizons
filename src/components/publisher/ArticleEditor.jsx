import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Send, Loader2, Upload, Sparkles, X } from "lucide-react";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const categories = ["News", "Opinion", "Culture", "Lifestyle", "Sport", "Education", "Technology"];

const subcategories = {
  News: ["Breaking", "Politics", "World", "Business"],
  Opinion: ["Editorials", "Columns", "Letters"],
  Culture: ["Arts", "Books", "Film", "Music"],
  Lifestyle: ["Food", "Travel", "Health", "Fashion"],
  Sport: ["Football", "Athletics", "Analysis"],
  Education: ["Higher Ed", "K-12", "Research"],
  Technology: ["AI", "Startups", "Gadgets", "Science"],
};

export default function ArticleEditor({ article, user, onClose }) {
  const [formData, setFormData] = useState({
    title: article?.title || "",
    subtitle: article?.subtitle || "",
    body: article?.body || "",
    summary: article?.summary || "",
    category: article?.category || "News",
    labels: article?.labels || [],
    tags: article?.tags?.join(", ") || "",
    lead_image_url: article?.lead_image_url || "",
    meta_title: article?.meta_title || "",
    meta_description: article?.meta_description || "",
    reading_time: article?.reading_time || 5,
  });

  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLabelToggle = (label) => {
    setFormData(prev => ({
      ...prev,
      labels: prev.labels.includes(label)
        ? prev.labels.filter(l => l !== label)
        : [...prev.labels, label]
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleInputChange("lead_image_url", file_url);
    } catch (error) {
      console.error("Error uploading image:", error);
    }
    setIsUploading(false);
  };

  const handleGenerateImage = async () => {
    if (!formData.title) {
      alert("Please add a title first");
      return;
    }

    setIsGeneratingImage(true);
    try {
      const { url } = await base44.integrations.Core.GenerateImage({
        prompt: `Professional news article header image for: ${formData.title}. Modern, high quality, editorial style.`,
      });
      handleInputChange("lead_image_url", url);
    } catch (error) {
      console.error("Error generating image:", error);
    }
    setIsGeneratingImage(false);
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const articleData = {
        ...formData,
        tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
        author_name: user.display_name || user.full_name,
        status: "draft",
      };

      if (article) {
        await base44.entities.Article.update(article.id, articleData);
      } else {
        await base44.entities.Article.create(articleData);
      }

      onClose();
    } catch (error) {
      console.error("Error saving draft:", error);
    }
    setIsSaving(false);
  };

  const handlePublish = async () => {
    if (!formData.title || !formData.body || !formData.category) {
      alert("Please fill in at least title, body, and category");
      return;
    }

    setIsPublishing(true);
    try {
      const articleData = {
        ...formData,
        tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
        author_name: user.display_name || user.full_name,
        status: "pending_moderation",
      };

      let articleId = article?.id;

      if (article) {
        await base44.entities.Article.update(article.id, articleData);
      } else {
        const newArticle = await base44.entities.Article.create(articleData);
        articleId = newArticle.id;
      }

      // AI Moderation
      const moderationResult = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a content moderator for a news platform. Analyze the following article for:
1. Derogatory language or character assassination
2. Factual accuracy and credibility
3. Writing quality
4. Misinformation or propaganda

Article Title: ${formData.title}
Article Body: ${formData.body.substring(0, 3000)}

Return a JSON with:
- approved (boolean): true if the article meets standards
- issues (array of strings): list of specific issues found
- recommendation (string): brief recommendation

Be thorough but fair. News articles can be critical but must be factual and professional.`,
        response_json_schema: {
          type: "object",
          properties: {
            approved: { type: "boolean" },
            issues: { type: "array", items: { type: "string" } },
            recommendation: { type: "string" }
          }
        }
      });

      if (moderationResult.approved) {
        await base44.entities.Article.update(articleId, {
          status: "published",
          published_date: new Date().toISOString(),
          moderation_notes: "Approved by AI moderation"
        });
        alert("Article published successfully!");
      } else {
        await base44.entities.Article.update(articleId, {
          status: "rejected",
          moderation_notes: `Moderation issues: ${moderationResult.issues.join(", ")}. ${moderationResult.recommendation}`
        });
        alert(`Article not published. Issues found:\n\n${moderationResult.issues.join("\n")}\n\n${moderationResult.recommendation}`);
      }

      onClose();
    } catch (error) {
      console.error("Error publishing article:", error);
      alert("Error publishing article. Please try again.");
    }
    setIsPublishing(false);
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={onClose} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSaveDraft} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span className="ml-2">Save Draft</span>
            </Button>
            <Button onClick={handlePublish} disabled={isPublishing} className="gap-2">
              {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Publish
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Article headline"
              className="text-2xl font-bold border-0 border-b-2 rounded-none px-0 focus-visible:ring-0"
            />
          </div>

          {/* Subtitle */}
          <div>
            <Label htmlFor="subtitle">Subtitle / Kicker</Label>
            <Input
              id="subtitle"
              value={formData.subtitle}
              onChange={(e) => handleInputChange("subtitle", e.target.value)}
              placeholder="Optional subtitle or summary line"
            />
          </div>

          {/* Lead Image */}
          <div>
            <Label>Lead Image</Label>
            <div className="space-y-3">
              {formData.lead_image_url && (
                <div className="relative w-full h-64 rounded-lg overflow-hidden">
                  <img src={formData.lead_image_url} alt="Lead" className="w-full h-full object-cover" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => handleInputChange("lead_image_url", "")}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('imageUpload').click()}
                  disabled={isUploading}
                  className="gap-2"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Upload Image
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerateImage}
                  disabled={isGeneratingImage}
                  className="gap-2"
                >
                  {isGeneratingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Generate with AI
                </Button>
              </div>
              <input
                id="imageUpload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Category and Labels */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Labels / Subcategories</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {subcategories[formData.category]?.map(label => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => handleLabelToggle(label)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      formData.labels.includes(label)
                        ? 'bg-[var(--primary)] text-white'
                        : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Body */}
          <div>
            <Label>Article Body *</Label>
            <div className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden border border-[var(--border)]">
              <ReactQuill
                theme="snow"
                value={formData.body}
                onChange={(value) => handleInputChange("body", value)}
                className="min-h-96"
                modules={{
                  toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['blockquote', 'code-block'],
                    ['link', 'image'],
                    ['clean']
                  ]
                }}
              />
            </div>
          </div>

          {/* Summary */}
          <div>
            <Label htmlFor="summary">Summary (for Daily Digest)</Label>
            <Textarea
              id="summary"
              value={formData.summary}
              onChange={(e) => handleInputChange("summary", e.target.value)}
              placeholder="One paragraph summary (3 sentences max)"
              rows={3}
            />
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => handleInputChange("tags", e.target.value)}
              placeholder="e.g., climate change, politics, technology"
            />
          </div>

          {/* SEO Fields */}
          <div className="space-y-4 p-4 border border-[var(--border)] rounded-lg">
            <h3 className="font-semibold">SEO Settings</h3>
            <div>
              <Label htmlFor="meta_title">Meta Title</Label>
              <Input
                id="meta_title"
                value={formData.meta_title}
                onChange={(e) => handleInputChange("meta_title", e.target.value)}
                placeholder="SEO title (leave blank to use article title)"
              />
            </div>
            <div>
              <Label htmlFor="meta_description">Meta Description</Label>
              <Textarea
                id="meta_description"
                value={formData.meta_description}
                onChange={(e) => handleInputChange("meta_description", e.target.value)}
                placeholder="SEO description"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="reading_time">Estimated Reading Time (minutes)</Label>
              <Input
                id="reading_time"
                type="number"
                value={formData.reading_time}
                onChange={(e) => handleInputChange("reading_time", parseInt(e.target.value))}
                min="1"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}