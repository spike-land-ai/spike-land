"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link } from "@/components/ui/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMcpHistory } from "@/hooks/useMcpHistory";
import { formatDate, formatDuration } from "@/lib/format/date";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  ExternalLink,
  ImagePlus,
  Loader2,
  Wand2,
} from "lucide-react";
import Image from "next/image";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return (
        <Badge className="bg-green-500">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    case "PROCESSING":
      return (
        <Badge className="bg-blue-500">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Processing
        </Badge>
      );
    case "FAILED":
      return (
        <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      );
    case "REFUNDED":
      return (
        <Badge variant="secondary">
          <Coins className="h-3 w-3 mr-1" />
          Refunded
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const getTypeBadge = (type: string) => {
  switch (type) {
    case "GENERATE":
      return (
        <Badge variant="outline">
          <ImagePlus className="h-3 w-3 mr-1" />
          Generate
        </Badge>
      );
    case "MODIFY":
      return (
        <Badge variant="outline">
          <Wand2 className="h-3 w-3 mr-1" />
          Modify
        </Badge>
      );
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
};

export function McpHistoryClient() {
  const {
    jobs,
    total,
    totalPages,
    isLoading,
    error,
    typeFilter,
    page,
    selectedJob,
    fetchHistory,
    handleTypeFilterChange,
    setPage,
    setSelectedJob,
  } = useMcpHistory();

  return (
    <div className="container mx-auto pt-24 pb-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">MCP Usage History</h1>
        <p className="text-muted-foreground mt-2">
          View your image generation and modification history
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Filter & Navigate</CardTitle>
              <CardDescription>
                {total} total jobs
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="GENERATE">Generate</SelectItem>
                  <SelectItem value="MODIFY">Modify</SelectItem>
                </SelectContent>
              </Select>

              <Link href="/apps/pixel/mcp-tools">
                <Button variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  MCP Tools
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
      </Card>

      {isLoading
        ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )
        : error
        ? (
          <Card>
            <CardContent className="py-8">
              <div className="flex flex-col items-center justify-center text-center">
                <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                <p className="text-destructive">{error}</p>
                <Button
                  onClick={fetchHistory}
                  variant="outline"
                  className="mt-4"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )
        : jobs.length === 0
        ? (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center text-center">
                <ImagePlus className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">No Jobs Found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {typeFilter !== "all"
                    ? `No ${typeFilter.toLowerCase()} jobs yet.`
                    : "You haven't used the MCP API yet."}
                </p>
                <Link href="/apps/pixel/mcp-tools">
                  <Button>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Try MCP Tools
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )
        : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {jobs.map(job => (
                <Card
                  key={job.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedJob(job)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getTypeBadge(job.type)}
                        {getStatusBadge(job.status)}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {job.tokensCost} tokens
                      </span>
                    </div>

                    {job.outputImageUrl
                      ? (
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-muted mb-3">
                          <Image
                            src={job.outputImageUrl}
                            alt="Generated image"
                            fill
                            className="object-cover"
                          />
                        </div>
                      )
                      : (
                        <div className="aspect-video rounded-lg bg-muted flex items-center justify-center mb-3">
                          {job.status === "PROCESSING"
                            ? <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            : <AlertCircle className="h-8 w-8 text-muted-foreground" />}
                        </div>
                      )}

                    <p className="text-sm line-clamp-2 mb-2">{job.prompt}</p>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDate(job.createdAt)}
                      </span>
                      {job.apiKeyName && (
                        <span className="truncate max-w-[100px]">
                          {job.apiKeyName}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}

      {/* Job Detail Dialog */}
      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="max-w-2xl">
          {selectedJob && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {getTypeBadge(selectedJob.type)}
                  {getStatusBadge(selectedJob.status)}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {selectedJob.outputImageUrl && (
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                    <Image
                      src={selectedJob.outputImageUrl}
                      alt="Generated image"
                      fill
                      className="object-contain"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Job ID</p>
                    <p className="font-mono text-xs">{selectedJob.id}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tier</p>
                    <p>{selectedJob.tier.replace("TIER_", "")} Quality</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tokens Used</p>
                    <p>{selectedJob.tokensCost}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Processing Time</p>
                    <p>
                      {formatDuration(
                        selectedJob.createdAt,
                        selectedJob.processingCompletedAt,
                      )}
                    </p>
                  </div>
                  {selectedJob.outputWidth && (
                    <>
                      <div>
                        <p className="text-muted-foreground">Dimensions</p>
                        <p>
                          {selectedJob.outputWidth} x {selectedJob.outputHeight}
                        </p>
                      </div>
                    </>
                  )}
                  {selectedJob.apiKeyName && (
                    <div>
                      <p className="text-muted-foreground">API Key</p>
                      <p>{selectedJob.apiKeyName}</p>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-muted-foreground text-sm mb-1">Prompt</p>
                  <p className="bg-muted p-3 rounded-md text-sm">
                    {selectedJob.prompt}
                  </p>
                </div>

                <div className="text-xs text-muted-foreground">
                  Created: {formatDate(selectedJob.createdAt)}
                  {selectedJob.processingCompletedAt && (
                    <>
                      | Completed: {formatDate(selectedJob.processingCompletedAt)}
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
