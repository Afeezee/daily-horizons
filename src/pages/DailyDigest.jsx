import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, Clock, FileText, Mail, CheckCircle, Rss, AlertCircle } from "lucide-react";
import DigestPreview from "../components/digest/DigestPreview";

const categories = ["News", "Opinion", "Culture", "Lifestyle", "Sport", "Education", "Technology"];

export default function DailyDigest() {
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

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['digestPreferences', user?.email],
    queryFn: async () => {
      const prefs = await base44.entities.DigestPreference.filter({ created_by: user.email });
      if (prefs.length > 0) {
        return prefs[0];
      }
      return null;
    },
    enabled: !!user,
  });

  const [formData, setFormData] = useState({
    delivery_time: preferences?.delivery_time || "08:00",
    frequency: preferences?.frequency || "daily",
    num_articles: preferences?.num_articles || 5,
    preferred_categories: preferences?.preferred_categories || [],
    is_active: preferences?.is_active ?? true,
  });

  useEffect(() => {
    if (preferences) {
      setFormData({
        delivery_time: preferences.delivery_time || "08:00",
        frequency: preferences.frequency || "daily",
        num_articles: preferences.num_articles || 5,
        preferred_categories: preferences.preferred_categories || [],
        is_active: preferences.is_active ?? true,
      });
    }
  }, [preferences]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (preferences) {
        await base44.entities.DigestPreference.update(preferences.id, formData);
      } else {
        await base44.entities.DigestPreference.create(formData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digestPreferences'] });
    },
  });

  const handleCategoryToggle = (category) => {
    setFormData(prev => ({
      ...prev,
      preferred_categories: prev.preferred_categories.includes(category)
        ? prev.preferred_categories.filter(c => c !== category)
        : [...prev.preferred_categories, category]
    }));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rss className="w-6 h-6 text-[var(--primary)]" />
              Daily Digest
            </CardTitle>
            <CardDescription>Sign in to configure your personalized news digest</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => base44.auth.redirectToLogin()} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Your Daily Digest</h1>
          <p className="text-xl text-blue-100">
            Personalized news briefs delivered on your schedule
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Digest Settings
              </CardTitle>
              <CardDescription>Customize how and when you receive your digest</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Active Toggle */}
              <div className="flex items-center justify-between p-4 bg-[var(--muted)] rounded-lg">
                <div>
                  <Label htmlFor="active" className="font-semibold">Digest Active</Label>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {formData.is_active ? "You'll receive digests" : "Paused"}
                  </p>
                </div>
                <Switch
                  id="active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
              </div>

              {/* Delivery Time */}
              <div>
                <Label htmlFor="time">Delivery Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.delivery_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, delivery_time: e.target.value }))}
                />
              </div>

              {/* Frequency */}
              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekdays">Weekdays Only</SelectItem>
                    <SelectItem value="three_per_week">3× per Week</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Number of Articles */}
              <div>
                <Label htmlFor="num">Number of Articles</Label>
                <Select
                  value={formData.num_articles.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, num_articles: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 articles</SelectItem>
                    <SelectItem value="5">5 articles</SelectItem>
                    <SelectItem value="7">7 articles</SelectItem>
                    <SelectItem value="10">10 articles</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Categories */}
              <div>
                <Label className="mb-3 block">Preferred Categories</Label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => handleCategoryToggle(category)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        formData.preferred_categories.includes(category)
                          ? 'bg-[var(--primary)] text-white'
                          : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-[var(--muted-foreground)] mt-2">
                  Leave empty for all categories
                </p>
              </div>

              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="w-full gap-2"
              >
                {saveMutation.isPending ? (
                  "Saving..."
                ) : saveMutation.isSuccess ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Saved!
                  </>
                ) : (
                  "Save Preferences"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Info Card */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-blue-600">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Curated Selection</h4>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Articles are selected based on your preferences, editorial picks, and trending stories
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-purple-600">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Email Delivery</h4>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Digest delivered to your inbox at your preferred time with beautifully formatted articles
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-green-600">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Read When Ready</h4>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Click through from your email to read full articles when you have time
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Delivery Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[var(--muted-foreground)] mb-4">
                  Your digest will be delivered to <strong>{user.email}</strong> at{" "}
                  <strong>{formData.delivery_time}</strong> {formData.frequency === "daily" ? "every day" : formData.frequency.replace("_", " ")}.
                </p>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Note: Automated email scheduling requires server-side setup. Use the "Send Test Email" button in the preview below to test email delivery manually.</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Live Preview Section */}
        <div className="mt-12">
          <DigestPreview preferences={formData} userEmail={user?.email} />
        </div>
      </div>
    </div>
  );
}