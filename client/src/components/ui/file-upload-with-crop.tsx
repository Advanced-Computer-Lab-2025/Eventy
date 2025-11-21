import { useState, useCallback } from "react";
import { FileUpload } from "./file-upload";
import { ImageCropper } from "./image-cropper";

interface FileUploadWithCropProps {
  onFileSelect: (file: File | Blob) => void;
  accept?: string;
  maxSize?: number;
  label: string;
  description?: string;
  value?: string;
  isUploading?: boolean;
  enableCrop?: boolean;
  cropAspectRatio?: number;
  circularCrop?: boolean;
  previewType?: "image" | "document";
  className?: string;
  onRemove?: () => void;
}

export function FileUploadWithCrop({
  onFileSelect,
  accept = "image/*",
  maxSize = 5,
  label,
  description,
  value,
  isUploading = false,
  enableCrop = false,
  cropAspectRatio = 1,
  circularCrop = false,
  previewType = "image",
  className,
  onRemove,
}: FileUploadWithCropProps) {
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string>("");

  const handleFileSelect = useCallback(
    (file: File) => {
      // If cropping is enabled and file is an image, show cropper
      if (enableCrop && file.type.startsWith("image/")) {
        setOriginalFileName(file.name);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImageToCrop(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        // Otherwise, pass file directly
        onFileSelect(file);
      }
    },
    [enableCrop, onFileSelect]
  );

  const handleCropComplete = useCallback(
    (croppedBlob: Blob) => {
      // Create a File object from the Blob
      const croppedFile = new File([croppedBlob], originalFileName, {
        type: "image/jpeg",
      });
      onFileSelect(croppedFile);
      setImageToCrop(null);
    },
    [originalFileName, onFileSelect]
  );

  const handleCropCancel = useCallback(() => {
    setImageToCrop(null);
  }, []);

  return (
    <>
      <FileUpload
        onFileSelect={handleFileSelect}
        accept={accept}
        maxSize={maxSize}
        label={label}
        description={description}
        value={value}
        isUploading={isUploading}
        previewType={previewType}
        className={className}
        onRemove={onRemove}
      />

      {imageToCrop && (
        <ImageCropper
          image={imageToCrop}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={cropAspectRatio}
          circularCrop={circularCrop}
        />
      )}
    </>
  );
}
