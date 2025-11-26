import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

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
    <div className={`w-44 ${className}`}>
      <label className="sr-only">Sort events</label>
      <Select
        value={sortOrder}
        onValueChange={(value) => onSortChange(value as "asc" | "desc")}
      >
        <SelectTrigger>
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
