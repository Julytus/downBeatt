import { Card, CardContent } from "@/components/ui/card";

export interface StatTileProps {
  label: string;
  value: string;
  subtitle: string;
}

export function StatTile({ label, value, subtitle }: StatTileProps) {
  return (
    <Card aria-label={label} className="p-4 sm:p-6">
      <CardContent className="p-0 space-y-1 sm:space-y-2">
        <p className="text-xs sm:text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-2xl sm:text-3xl font-bold tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
