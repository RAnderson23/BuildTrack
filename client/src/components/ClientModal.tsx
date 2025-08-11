// Simplified version of ClientModal.tsx for testing
// This removes react-hook-form to isolate the issue

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: any;
}

export function ClientModal({ open, onOpenChange, client }: ClientModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!client;

  // Simple state instead of react-hook-form
  const [formData, setFormData] = useState({
    name: client?.name || "",
    email: client?.email || "",
    phone: client?.phone || "",
    address: client?.address || "",
    notes: client?.notes || "",
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      console.log("Sending data to server:", data);

      if (isEditing) {
        return await apiRequest("PUT", `/api/clients/${client.id}`, data);
      } else {
        return await apiRequest("POST", "/api/clients", data);
      }
    },
    onSuccess: (data) => {
      console.log("Success! Response:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      onOpenChange(false);
      toast({
        title: "Success",
        description: `Client ${isEditing ? "updated" : "created"} successfully`,
      });
    },
    onError: (error: any) => {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || `Failed to ${isEditing ? "update" : "create"} client`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted with data:", formData);

    // Basic validation
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Client name is required",
        variant: "destructive",
      });
      return;
    }

    mutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Client" : "Add New Client"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Client Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => {
                console.log("Name changed to:", e.target.value);
                setFormData({ ...formData, name: e.target.value });
              }}
              placeholder="Enter client name"
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="client@example.com"
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(555) 123-4567"
            />
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Enter client address"
              className="min-h-[60px]"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about the client"
              className="min-h-[60px]"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={mutation.isPending}
              onClick={() => console.log("Submit button clicked!")}
            >
              {mutation.isPending ? "Saving..." : (isEditing ? "Update Client" : "Create Client")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}