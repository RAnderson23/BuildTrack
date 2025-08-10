import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface ProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: any;
  clients: any[];
}

export default function ProjectModal({ 
  open, 
  onOpenChange, 
  project, 
  clients 
}: ProjectModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    clientId: "",
    status: "planning",
    budget: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || "",
        description: project.description || "",
        clientId: project.clientId || "",
        status: project.status || "planning",
        budget: project.budget || "",
        startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : "",
        endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : "",
      });
    } else {
      setFormData({
        name: "",
        description: "",
        clientId: "",
        status: "planning",
        budget: "",
        startDate: "",
        endDate: "",
      });
    }
  }, [project, open]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/projects", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      onOpenChange(false);
      toast({
        title: "Success",
        description: "Project created successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", `/api/projects/${project.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      onOpenChange(false);
      toast({
        title: "Success",
        description: "Project updated successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      budget: formData.budget ? formData.budget : null,
      startDate: formData.startDate ? new Date(formData.startDate) : null,
      endDate: formData.endDate ? new Date(formData.endDate) : null,
    };

    if (project) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {project ? "Edit Project" : "New Project"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter project name"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter project description"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="clientId">Client</Label>
            <Select value={formData.clientId} onValueChange={(value) => setFormData({ ...formData, clientId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client: any) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="budget">Budget</Label>
            <Input
              id="budget"
              type="number"
              step="0.01"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              placeholder="0.00"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : project ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
