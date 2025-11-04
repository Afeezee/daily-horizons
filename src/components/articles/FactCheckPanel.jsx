import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Loader2, CheckCircle, AlertTriangle, XCircle, ExternalLink } from "lucide-react";

export default function FactCheckPanel({ article, compact = false }) {
  const [isChecking, setIsChecking] = useState(false);
  const [factCheckResult, setFactCheckResult] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const handleFactCheck = async () => {
    setIsChecking(true);
    setShowResults(true);
    
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a professional fact-checker. Analyze the following article for factual accuracy by searching the web for verification.

Article Title: ${article.title}
Article Category: ${article.category}
Article Content: ${article.body?.replace(/<[^>]*>/g, ' ').substring(0, 4000)}

Perform a comprehensive fact-check by:
1. Identifying key factual claims in the article
2. Searching for credible sources to verify each claim
3. Rating the overall accuracy of the article
4. Providing specific evidence and sources for your assessment

Return a JSON with:
- overall_rating: "verified", "mostly_accurate", "mixed", "mostly_false", or "false"
- confidence_score: number between 0-100
- summary: brief overall assessment (2-3 sentences)
- claims: array of objects with:
  - claim: the specific claim being checked
  - verdict: "true", "mostly_true", "unverifiable", "mostly_false", or "false"
  - evidence: explanation with sources
  - sources: array of credible source URLs

Be thorough and objective. Base verdicts on verifiable facts from credible sources.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            overall_rating: { 
              type: "string",
              enum: ["verified", "mostly_accurate", "mixed", "mostly_false", "false"]
            },
            confidence_score: { type: "number" },
            summary: { type: "string" },
            claims: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  claim: { type: "string" },
                  verdict: { type: "string" },
                  evidence: { type: "string" },
                  sources: { 
                    type: "array",
                    items: { type: "string" }
                  }
                }
              }
            }
          }
        }
      });

      setFactCheckResult(result);
    } catch (error) {
      console.error("Fact-check error:", error);
      setFactCheckResult({
        overall_rating: "error",
        summary: "Unable to complete fact-check. Please try again.",
        claims: []
      });
    } finally {
      setIsChecking(false);
    }
  };

  const getRatingIcon = (rating) => {
    switch (rating) {
      case "verified":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "mostly_accurate":
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case "mixed":
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case "mostly_false":
        return <XCircle className="w-5 h-5 text-orange-600" />;
      case "false":
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Shield className="w-5 h-5 text-gray-600" />;
    }
  };

  const getRatingColor = (rating) => {
    switch (rating) {
      case "verified":
        return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
      case "mostly_accurate":
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800";
      case "mixed":
        return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
      case "mostly_false":
        return "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800";
      case "false":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
      default:
        return "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800";
    }
  };

  const getVerdictColor = (verdict) => {
    if (verdict?.includes("true")) return "text-green-600 dark:text-green-400";
    if (verdict?.includes("false")) return "text-red-600 dark:text-red-400";
    return "text-yellow-600 dark:text-yellow-400";
  };

  if (compact) {
    return (
      <Button
        onClick={handleFactCheck}
        disabled={isChecking}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        {isChecking ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Checking...
          </>
        ) : (
          <>
            <Shield className="w-4 h-4" />
            Fact Check
          </>
        )}
      </Button>
    );
  }

  return (
    <div className="space-y-4">
      {!showResults ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              AI-Powered Fact Check
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">
              Our AI will analyze this article's factual claims by searching credible sources across the web
              and provide a detailed verification report with evidence.
            </p>
            <Button
              onClick={handleFactCheck}
              disabled={isChecking}
              className="gap-2"
            >
              {isChecking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing Article...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Start Fact Check
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : factCheckResult ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Fact Check Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Overall Rating */}
            <Alert className={getRatingColor(factCheckResult.overall_rating)}>
              <div className="flex items-start gap-3">
                {getRatingIcon(factCheckResult.overall_rating)}
                <div className="flex-1">
                  <h4 className="font-semibold mb-1 capitalize">
                    {factCheckResult.overall_rating?.replace("_", " ")}
                    {factCheckResult.confidence_score && (
                      <span className="text-sm font-normal ml-2">
                        (Confidence: {factCheckResult.confidence_score}%)
                      </span>
                    )}
                  </h4>
                  <AlertDescription>{factCheckResult.summary}</AlertDescription>
                </div>
              </div>
            </Alert>

            {/* Individual Claims */}
            {factCheckResult.claims && factCheckResult.claims.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-semibold text-sm">Detailed Analysis:</h4>
                {factCheckResult.claims.map((claim, index) => (
                  <div
                    key={index}
                    className="p-4 border border-[var(--border)] rounded-lg space-y-2"
                  >
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-sm text-[var(--muted-foreground)]">
                        Claim {index + 1}:
                      </span>
                      <p className="text-sm flex-1">{claim.claim}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[var(--muted-foreground)]">
                        Verdict:
                      </span>
                      <span className={`text-xs font-bold uppercase ${getVerdictColor(claim.verdict)}`}>
                        {claim.verdict}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-[var(--border)]">
                      <p className="text-sm text-[var(--muted-foreground)] mb-2">
                        {claim.evidence}
                      </p>
                      
                      {claim.sources && claim.sources.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-semibold text-[var(--muted-foreground)] mb-1">
                            Sources:
                          </p>
                          <div className="space-y-1">
                            {claim.sources.map((source, idx) => (
                              <a
                                key={idx}
                                href={source}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                              >
                                <ExternalLink className="w-3 h-3" />
                                {new URL(source).hostname}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 border-t border-[var(--border)]">
              <Button
                onClick={() => setShowResults(false)}
                variant="outline"
                size="sm"
              >
                Run New Check
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}