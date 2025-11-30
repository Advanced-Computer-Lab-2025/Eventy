import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileImage, FileText } from "lucide-react";
import { useState, useEffect } from "react";

interface DocumentViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  title?: string;
  filename?: string;
}

export default function DocumentViewer({
  open,
  onOpenChange,
  url,
  title = "Document Viewer",
  filename,
}: DocumentViewerProps) {
  const [isImage, setIsImage] = useState(false);
  const [isPdf, setIsPdf] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (url) {
      const lowerUrl = url.toLowerCase();
      setIsImage(
        lowerUrl.endsWith(".jpg") ||
          lowerUrl.endsWith(".jpeg") ||
          lowerUrl.endsWith(".png") ||
          lowerUrl.endsWith(".webp") ||
          lowerUrl.endsWith(".gif")
      );
      setIsPdf(lowerUrl.endsWith(".pdf"));
      setError(false);
    }
  }, [url]);

  const handleDownload = async () => {
    if (!url) return;

    try {
      // Fetch the file as a blob
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch file");
      }
      const blob = await response.blob();

      // Extract filename from URL, handling query parameters
      const urlPath = url.split("?")[0]; // Remove query parameters
      const defaultFilename = urlPath.split("/").pop() || "document";
      const downloadFilename = filename || defaultFilename;

      // Create a blob URL and trigger download
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = downloadFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      // Fallback to opening in new tab if download fails
      window.open(url, "_blank");
    }
  };

  const handleError = () => {
    setError(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto flex items-center justify-center bg-muted/20 rounded-lg p-4 min-h-[400px]">
          {error ? (
            <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground">
              <FileText className="h-16 w-16" />
              <p>Unable to display document</p>
              <Button variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download Instead
              </Button>
            </div>
          ) : isImage ? (
            <img
              src={url}
              alt={title}
              className="max-w-full max-h-full object-contain rounded"
              onError={handleError}
            />
          ) : isPdf ? (
            <iframe
              src={url}
              className="w-full h-full min-h-[600px] rounded border"
              title={title}
              onError={handleError}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground">
              <FileImage className="h-16 w-16" />
              <p>Preview not available for this file type</p>
              <Button variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download File
              </Button>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleDownload}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
