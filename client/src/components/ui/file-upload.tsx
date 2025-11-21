import { useState, useRef, useCallback } from "react";
import {
  Upload,
  X,
  CheckCircle2,
  Image as ImageIcon,
  FileText,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { toast } from "@/hooks/use-toast";
import "./file-upload.css";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // in MB
  label: string;
  description?: string;
  value?: string; // URL of uploaded file
  isUploading?: boolean;
  previewType?: "image" | "document";
  className?: string;
  onRemove?: () => void;
}

export function FileUpload({
  onFileSelect,
  accept = "image/*,application/pdf",
  maxSize = 5,
  label,
  description,
  value,
  isUploading = false,
  previewType = "image",
  className,
  onRemove,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const handleFile = useCallback(
    (file: File) => {
      // Validate file size
      if (file.size > maxSize * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: `File size must be less than ${maxSize}MB`,
        });
        return;
      }

      setFileName(file.name);
      setFileSize(formatFileSize(file.size));

      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }

      onFileSelect(file);
    },
    [maxSize, onFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    setFileName("");
    setFileSize("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onRemove?.();
  };

  const hasFile = preview || fileName || value;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
        <span className="text-xs text-muted-foreground">
          (Maximum file size: {maxSize}MB)
        </span>
      </div>

      <div
        onClick={!hasFile && !isUploading ? handleClick : undefined}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer",
          "hover:border-primary/50 hover:bg-accent/5",
          isDragging && "border-primary bg-primary/5 scale-[1.02]",
          hasFile && "border-solid border-primary/20 bg-accent/10",
          isUploading && "pointer-events-none opacity-75",
          !hasFile && !isUploading && "border-muted-foreground/25"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isUploading}
        />

        {/* Loading State */}
        {isUploading && (
          <div className="flex flex-col items-center justify-center p-8 space-y-3">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="text-sm font-medium">Uploading...</p>
            <div className="w-full max-w-xs h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary animate-pulse"
                style={{ width: "60%" }}
              />
            </div>
          </div>
        )}

        {/* Success State with Preview */}
        {!isUploading && hasFile && (
          <div className="relative group">
            {preview && previewType === "image" ? (
              <div className="relative">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleRemove}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Remove
                  </Button>
                </div>
                <div className="absolute top-2 right-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    {previewType === "image" ? (
                      <ImageIcon className="h-6 w-6 text-primary" />
                    ) : (
                      <FileText className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm font-medium flex items-center gap-2">
                      {fileName || "File uploaded"}
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </p>
                    {fileSize && (
                      <p className="text-xs text-muted-foreground">
                        {fileSize}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleRemove}
                  className="transition-opacity"
                >
                  <X className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!isUploading && !hasFile && (
          <div className="flex flex-col items-center justify-center p-8 space-y-3 text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-primary/5 transition-transform group-hover:scale-110">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">
                Drop your file here, or{" "}
                <span className="text-primary underline-offset-4 hover:underline">
                  browse
                </span>
              </p>
              {description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {description}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
