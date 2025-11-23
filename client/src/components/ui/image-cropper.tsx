import { useState, useRef, useCallback } from "react";
import ReactCrop, { Crop, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import "./file-upload.css";
import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { Loader2 } from "lucide-react";

interface ImageCropperProps {
  image: string;
  onCropComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number;
  circularCrop?: boolean;
}

export function ImageCropper({
  image,
  onCropComplete,
  onCancel,
  aspectRatio = 1,
  circularCrop = false,
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    width: 90,
    height: 90,
    x: 5,
    y: 5,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const getCroppedImg = useCallback(
    async (image: HTMLImageElement, crop: PixelCrop): Promise<Blob> => {
      const canvas = document.createElement("canvas");
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      canvas.width = crop.width;
      canvas.height = crop.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("No 2d context");
      }

      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
      );

      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Canvas is empty"));
            }
          },
          "image/jpeg",
          0.95
        );
      });
    },
    []
  );

  const handleCropComplete = async () => {
    if (!completedCrop || !imgRef.current) return;

    try {
      setIsProcessing(true);
      const croppedBlob = await getCroppedImg(imgRef.current, completedCrop);
      onCropComplete(croppedBlob);
    } catch (error) {
      console.error("Error cropping image:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Crop Your Image</DialogTitle>
          <DialogDescription>
            Adjust the crop area to select the portion of the image you want to
            use
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center max-h-[60vh] overflow-auto bg-muted/20 rounded-lg p-4">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspectRatio}
            circularCrop={circularCrop}
          >
            <img
              ref={imgRef}
              src={image}
              alt="Crop preview"
              className="max-w-full h-auto"
              onLoad={(e) => {
                const { width, height } = e.currentTarget;
                const crop: Crop = {
                  unit: "%",
                  width: 90,
                  height: 90,
                  x: 5,
                  y: 5,
                };
                setCrop(crop);
              }}
            />
          </ReactCrop>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleCropComplete}
            disabled={isProcessing || !completedCrop}
          >
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isProcessing ? "Processing..." : "Apply Crop"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
