
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";

export interface RecentVisit {
  id: string;
  visitorName: string;
  branchName: string;
  visitTime: string; // Formatted time string
}

interface RecentVisitsListProps {
  visits: RecentVisit[];
}

export default function RecentVisitsList({ visits }: RecentVisitsListProps) {
  if (!visits || visits.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
        No hay visitas recientes para mostrar.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {visits.map((visit) => (
        <div key={visit.id} className="flex items-center gap-4 p-2 rounded-md hover:bg-muted/50 transition-colors">
          <Avatar className="h-10 w-10 border">
            {/* Placeholder for visitor image, could use initials or a generic icon */}
            {/* <AvatarImage src="/avatars/01.png" alt={visit.visitorName} /> */}
            <AvatarFallback className="bg-primary/10 text-primary">
              {visit.visitorName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0,2) || <User className="h-5 w-5"/>}
            </AvatarFallback>
          </Avatar>
          <div className="grid gap-0.5 text-sm flex-1">
            <p className="font-semibold text-foreground truncate">{visit.visitorName}</p>
            <p className="text-xs text-muted-foreground truncate">
              En: {visit.branchName}
            </p>
          </div>
          <div className="text-xs text-muted-foreground whitespace-nowrap">
            {visit.visitTime}
          </div>
        </div>
      ))}
    </div>
  );
}
