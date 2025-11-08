import { useState, useRef } from "react";
import { Plus, Trash2, Store, Upload, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { bazaarApiService } from "@/lib/bazaarApi";
import { useToast } from "@/hooks/use-toast";

interface VendorApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bazaarId: string;
  bazaarName: string;
  onApplicationSubmitted?: () => void;
}

interface Attendee {
  name: string;
  email: string;
  individualID?: string;
}

export default function VendorApplicationDialog({
  open,
  onOpenChange,
  bazaarId,
  bazaarName,
  onApplicationSubmitted,
}: VendorApplicationDialogProps) {
  const { toast } = useToast();
  const [attendees, setAttendees] = useState<Attendee[]>([
    { name: "", email: "" }
  ]);
  const [boothSize, setBoothSize] = useState<"2x2" | "4x4">("2x2");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingIds, setUploadingIds] = useState<{ [key: number]: boolean }>({});
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  const addAttendee = () => {
    if (attendees.length < 5) {
      setAttendees([...attendees, { name: "", email: "" }]);
    }
  };

  const removeAttendee = (index: number) => {
    if (attendees.length > 1) {
      setAttendees(attendees.filter((_, i) => i !== index));
    }
  };

  const updateAttendee = (index: number, field: keyof Attendee, value: string) => {
    const updatedAttendees = attendees.map((attendee, i) =>
      i === index ? { ...attendee, [field]: value } : attendee
    );
    setAttendees(updatedAttendees);
  };

  const handleUploadId = async (index: number, file: File) => {
    setUploadingIds(prev => ({ ...prev, [index]: true }));
    
    try {
      const result = await bazaarApiService.uploadIdCard(file);
      
      const updatedAttendees = attendees.map((attendee, i) =>
        i === index ? { ...attendee, individualID: result.url } : attendee
      );
      setAttendees(updatedAttendees);
      
      toast({
        title: "ID Uploaded Successfully",
        description: `ID card for ${attendees[index].name || 'attendee'} has been uploaded.`,
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload ID card. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingIds(prev => ({ ...prev, [index]: false }));
    }
  };

  const triggerFileInput = (index: number) => {
    fileInputRefs.current[index]?.click();
  };

  const validateForm = () => {
    // Check if all attendees have both name and email
    const validAttendees = attendees.filter(attendee => 
      attendee.name.trim() && attendee.email.trim()
    );
    
    if (validAttendees.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one attendee with name and email is required.",
        variant: "destructive",
      });
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const attendee of validAttendees) {
      if (!emailRegex.test(attendee.email)) {
        toast({
          title: "Validation Error",
          description: `Invalid email format for ${attendee.name || 'attendee'}.`,
          variant: "destructive",
        });
        return false;
      }
      
      if (!attendee.individualID) {
        toast({
          title: "Validation Error",
          description: `Please upload an ID card for ${attendee.name || 'attendee'}.`,
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const validAttendees = attendees.filter(attendee => 
        attendee.name.trim() && attendee.email.trim()
      );

      await bazaarApiService.applyToBazaar(bazaarId, {
        attendees: validAttendees.map(attendee => ({
          name: attendee.name,
          email: attendee.email,
          individualID: attendee.individualID || "",
        })),
        boothSize,
      });

      toast({
        title: "Application Submitted",
        description: "Your vendor application has been submitted successfully!",
      });

      // Reset form
      setAttendees([{ name: "", email: "" }]);
      setBoothSize("2x2");
      onOpenChange(false);
      
      // Notify parent component that application was submitted
      if (onApplicationSubmitted) {
        onApplicationSubmitted();
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      
      // Check if it's a duplicate application error
      if (error instanceof Error && error.message.includes("already applied to this bazaar")) {
        toast({
          title: "Already Applied",
          description: "You have already applied to this bazaar.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Application Failed",
          description: error instanceof Error ? error.message : "You have already applied to this bazaar.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Apply to {bazaarName}
          </DialogTitle>
          <DialogDescription>
            Fill in the details to apply as a vendor for this bazaar. You can register up to 5 individuals.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Attendees Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Attendees ({attendees.length}/5)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAttendee}
                disabled={attendees.length >= 5}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Attendee
              </Button>
            </div>
            
            <div className="space-y-3">
              {attendees.map((attendee, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-muted-foreground">
                        Attendee {index + 1}
                      </span>
                      {attendees.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttendee(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor={`name-${index}`}>Name</Label>
                        <Input
                          id={`name-${index}`}
                          placeholder="Full name"
                          value={attendee.name}
                          onChange={(e) => updateAttendee(index, "name", e.target.value)}
                          required={index === 0}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`email-${index}`}>Email</Label>
                        <Input
                          id={`email-${index}`}
                          type="email"
                          placeholder="email@example.com"
                          value={attendee.email}
                          onChange={(e) => updateAttendee(index, "email", e.target.value)}
                          required={index === 0}
                        />
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <input
                        type="file"
                        ref={(el) => (fileInputRefs.current[index] = el)}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleUploadId(index, file);
                          }
                        }}
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant={attendee.individualID ? "outline" : "default"}
                        size="sm"
                        onClick={() => triggerFileInput(index)}
                        disabled={uploadingIds[index]}
                        className="w-full flex items-center gap-2"
                      >
                        {uploadingIds[index] ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                            Uploading...
                          </>
                        ) : attendee.individualID ? (
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
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Booth Size Section */}
          <div className="space-y-2">
            <Label htmlFor="boothSize" className="text-base font-semibold">Booth Size</Label>
            <Select value={boothSize} onValueChange={(value: "2x2" | "4x4") => setBoothSize(value)}>
              <SelectTrigger id="boothSize">
                <SelectValue placeholder="Select booth size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2x2">2x2</SelectItem>
                <SelectItem value="4x4">4x4</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Choose the size of your booth space. Larger booths may have additional fees.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
