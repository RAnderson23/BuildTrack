// client/src/components/ClientDetailModal.tsx
// Shows client details and all their projects

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  FileText, 
  Receipt, 
  Plus, 
  Edit, 
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  ChevronRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ProjectModal from "./ProjectModal";
import { useLocation } from "wouter";

interface ClientDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: any;
  onEdit: () => void;
}

export function ClientDetailModal({ open, onOpenChange, client, onEdit }: ClientDetailModalProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showNewProject, setShowNewProject] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  // Fetch projects for this client
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects", { clientId: client?.id }],
    enabled: !!client?.id,
    queryFn: async () => {
      const response = await fetch('/api/projects');
      const allProjects = await response.json();
      // Filter projects for this client
      return allProjects.filter((p: any) => p.clientId === client.id);
    }
  });

  // Calculate stats
  const activeProjects = projects.filter((p: any) => p.status === 'active').length;
  const completedProjects = projects.filter((p: any) => p.status === 'completed').length;
  const totalBudget = projects.reduce((sum: number, p: any) => sum + (parseFloat(p.budget) || 0), 0);

  const getStatusColor = (status: string) => {
    const colors = {
      planning: 'bg-slate-100 text-slate-800',
      active: 'bg-green-100 text-green-800',
      on_hold: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800'
    };
    return colors[status as keyof typeof colors] || colors.planning;
  };

  const handleProjectClick = (project: any) => {
    // Navigate to projects page with this project selected
    // Or open project detail modal
    setSelectedProject(project);
    onOpenChange(false);
    setLocation('/projects');
  };

  const handleNewProject = () => {
    setShowNewProject(true);
  };

  if (!client) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl">{client.name}</DialogTitle>
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Client
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Client Info Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    {client.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <a href={`mailto:${client.email}`} className="text-blue-600 hover:underline">
                          {client.email}
                        </a>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <a href={`tel:${client.phone}`} className="text-blue-600 hover:underline">
                          {client.phone}
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    {client.address && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                        <span className="text-slate-600">{client.address}</span>
                      </div>
                    )}
                    {client.createdAt && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">
                          Client since {new Date(client.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {client.notes && (
                  <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600">{client.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">{activeProjects}</div>
                  <p className="text-sm text-slate-600">Active Projects</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">{completedProjects}</div>
                  <p className="text-sm text-slate-600">Completed</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">${totalBudget.toLocaleString()}</div>
                  <p className="text-sm text-slate-600">Total Budget</p>
                </CardContent>
              </Card>
            </div>

            {/* Projects Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Projects ({projects.length})</CardTitle>
                  <Button size="sm" onClick={handleNewProject}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Project
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {projectsLoading ? (
                  <div className="text-center py-4 text-slate-500">Loading projects...</div>
                ) : projects.length === 0 ? (
                  <div className="text-center py-8">
                    <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 mb-4">No projects yet for this client</p>
                    <Button onClick={handleNewProject}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Project
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {projects.map((project: any) => (
                      <div
                        key={project.id}
                        className="border rounded-lg p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => handleProjectClick(project)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h4 className="font-medium text-slate-900">{project.name}</h4>
                              <Badge className={getStatusColor(project.status)}>
                                {project.status}
                              </Badge>
                            </div>
                            {project.description && (
                              <p className="text-sm text-slate-600 mt-1">{project.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                              {project.budget && (
                                <span className="flex items-center gap-1">
                                  <DollarSign className="w-3 h-3" />
                                  {parseFloat(project.budget).toLocaleString()}
                                </span>
                              )}
                              {project.startDate && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(project.startDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Project Modal */}
      {showNewProject && (
        <ProjectModal
          open={showNewProject}
          onOpenChange={setShowNewProject}
          clients={[client]} // Only show this client
          defaultClientId={client.id} // Pre-select this client
        />
      )}
    </>
  );
}