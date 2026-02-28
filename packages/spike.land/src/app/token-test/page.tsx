"use client";

import { useState } from "react";
import { CheckCircle, Key, Loader2, Play, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TokenTestResult {
  success: boolean;
  tokenSource: string;
  maskedToken: string;
  model: string;
  responseText?: string;
  usage?: { input_tokens: number; output_tokens: number; };
  latencyMs: number;
  error?: string;
}

export default function TokenTestPage() {
  const [result, setResult] = useState<TokenTestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  async function runTest() {
    setLoading(true);
    setResult(null);
    setFetchError(null);

    try {
      const res = await fetch("/api/token-test", { method: "POST" });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Claude OAuth Token Test
        </h1>
        <p className="text-muted-foreground">
          Verify your CLAUDE_CODE_OAUTH_TOKEN works for API calls.
        </p>
      </div>

      <Button onClick={runTest} disabled={loading} size="lg">
        {loading
          ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          : <Play className="mr-2 h-4 w-4" />}
        {loading ? "Testing..." : "Test Token"}
      </Button>

      {fetchError && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Network Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{fetchError}</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Key className="h-4 w-4" />
                Token Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Source</span>
                <span className="font-mono">{result.tokenSource}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Token</span>
                <span className="font-mono">{result.maskedToken}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Model</span>
                <span className="font-mono">{result.model}</span>
              </div>
            </CardContent>
          </Card>

          <Card
            className={result.success
              ? "border-green-500/50"
              : "border-destructive"}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                {result.success
                  ? <CheckCircle className="h-4 w-4 text-green-500" />
                  : <XCircle className="h-4 w-4 text-destructive" />}
                {result.success ? "Success" : "Failed"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {result.success && result.responseText && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Response</span>
                  <span className="font-mono">{result.responseText}</span>
                </div>
              )}
              {result.success && result.usage && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Usage</span>
                  <span className="font-mono">
                    {result.usage.input_tokens} in / {result.usage.output_tokens} out
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Latency</span>
                <span className="font-mono">{result.latencyMs}ms</span>
              </div>
              {result.error && (
                <div className="mt-2 rounded bg-destructive/10 p-3 text-destructive">
                  {result.error}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
