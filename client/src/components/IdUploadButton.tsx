import { useRef, useState } from "react";
import { Upload, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bazaarApiService } from "@/lib/bazaarApi";
import { useToast } from "@/hooks/use-toast";

interface IdUploadButtonProps {
  index: number;
  attendeeName: string;
  individualID?: string;
  onUploadSuccess: (index: number, url: string) => void;
  className?: string;
  buttonClassName?: string;
  showReuploadButton?: boolean;
}

export default function IdUploadButton({
  index,
  attendeeName,
  individualID,
  onUploadSuccess,
  className = "",
  buttonClassName = "",
  showReuploadButton = true,
}: IdUploadButtonProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadId = async (file: File) => {
    setIsUploading(true);

    try {
      const result = await bazaarApiService.uploadIdCard(file);
      onUploadSuccess(index, result.url);

      toast({
        title: "ID Uploaded Successfully",
        description: `ID card for ${attendeeName || "attendee"} has been uploaded.`,
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to upload ID card. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUploadId(file);
    }
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={className}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
      />
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={individualID ? "outline" : "default"}
          size="sm"
          onClick={() => {
            if (!individualID) {
              triggerFileInput();
            }
          }}
          disabled={isUploading || !!individualID}
          className={`flex items-center gap-2 ${buttonClassName || ""}`}
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              Uploading...
            </>
          ) : individualID ? (
            <>
              <Check className="h-4 w-4 text-green-600" />
              ID Uploaded
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Upload ID
            </>
          )}
        </Button>
        {showReuploadButton && individualID && !isUploading && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={triggerFileInput}
            className="flex items-center gap-2"
            title="Reupload ID"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
