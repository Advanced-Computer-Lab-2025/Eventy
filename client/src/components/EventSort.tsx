import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";

interface EventSortProps {
  sortOrder: "asc" | "desc";
  onSortChange: (order: "asc" | "desc") => void;
  className?: string;
}

export default function EventSort({
  sortOrder,
  onSortChange,
  className = "",
}: EventSortProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <ArrowUpDown className="h-4 w-4" />
      <span className="text-sm font-semibold">Sort:</span>
      <Select
        value={sortOrder}
        onValueChange={(value) => onSortChange(value as "asc" | "desc")}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="asc">Earliest First</SelectItem>
          <SelectItem value="desc">Latest First</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
