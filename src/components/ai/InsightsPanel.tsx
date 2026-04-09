"use client";

import ReactMarkdown from "react-markdown";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";

interface InsightsPanelProps {
  insights: string | null;
  loading?: boolean;
}

export function InsightsPanel({ insights, loading }: InsightsPanelProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  if (!insights) return null;

  return (
    <Accordion type="single" collapsible defaultValue="insights">
      <AccordionItem value="insights">
        <AccordionTrigger className="text-base font-semibold">
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            Análise de IA
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="prose prose-sm max-w-none text-foreground [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_ul]:pl-4 [&_li]:mb-1">
            <ReactMarkdown>{insights}</ReactMarkdown>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
