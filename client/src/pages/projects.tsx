  // client/src/pages/projects.tsx
  // COMPLETE FIXED VERSION with ProjectDetailModal integration

  import { useState, useEffect } from "react";
  import { useQuery, useMutation } from "@tanstack/react-query";
  import { Button } from "@/components/ui/button";
  import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
  import { 
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";
  import { Plus, Building, Eye, Edit } from "lucide-react"; // Single import for all icons
  import { useAuth } from "@/hooks/useAuth";
  import { useToast } from "@/hooks/use-toast";
  import { isUnauthorizedError } from "@/lib/authUtils";
  import { queryClient } from "@/lib/queryClient";
  import ProjectModal from "@/components/ProjectModal";
  import { ProjectDetailModal } from "@/components/ProjectDetailModal";

  export default function Projects() {
    const { toast } = useToast();
    const { isAuthenticated, isLoading } = useAuth();
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [showProjectDetail, setShowProjectDetail] = useState(false);
    const [detailProject, setDetailProject] = useState(null);

    // Handler function for viewing project details
    const handleViewProject = (project: any) => {
      setDetailProject(project);
      setShowProjectDetail(true);
    };

    // Redirect to login if not authenticated
    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
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
    }, [isAuthenticated, isLoading, toast]);

    const { data: projects, isLoading: projectsLoading } = useQuery({
      queryKey: ["/api/projects"],
      enabled: !!isAuthenticated,
    });

    const { data: clients } = useQuery({
      queryKey: ["/api/clients"],
      enabled: !!isAuthenticated,
    });

    const getStatusBadge = (status: string) => {
      const statusClasses = {
        active: "status-active",
        planning: "status-planning", 
        completed: "status-completed",
        on_hold: "status-pending"
      };

      return (
        <span className={statusClasses[status as keyof typeof statusClasses] || "status-pending"}>
          {status?.charAt(0).toUpperCase() + status?.slice(1).replace('_', ' ')}
        </span>
      );
    };

    const getProgressPercentage = (project: any) => {
      if (project.status === 'completed') return 100;
      if (project.status === 'active') return Math.random() * 50 + 25; // Mock progress
      if (project.status === 'planning') return Math.random() * 25;
      return 0;
    };

    const handleEditProject = (project: any) => {
      setSelectedProject(project);
      setShowProjectModal(true);
    };

    const handleNewProject = () => {
      setSelectedProject(null);
      setShowProjectModal(true);
    };

    if (isLoading || projectsLoading) {
      return (
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-1/4"></div>
            <div className="h-64 bg-slate-200 rounded-lg"></div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Projects</h2>
            <p className="text-slate-600">Manage your construction projects and contracts</p>
          </div>
          <Button onClick={handleNewProject}>
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {!Array.isArray(projects) || projects.length === 0 ? (
              <div className="p-8 text-center">
                <Building className="mx-auto w-12 h-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No projects yet</h3>
                <p className="text-slate-600 mb-4">Get started by creating your first construction project.</p>
                <Button onClick={handleNewProject}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Project
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(projects || []).map((project: any) => {
                      const client = Array.isArray(clients) ? clients.find((c: any) => c.id === project.clientId) : null;
                      const progress = getProgressPercentage(project);

                      return (
                        <TableRow 
                          key={project.id} 
                          className="hover:bg-slate-50 cursor-pointer"
                          onClick={() => handleViewProject(project)}
                        >
                          <TableCell>
                            <div>
                              <div className="font-medium text-slate-900">{project.name}</div>
                              <div className="text-sm text-slate-500">
                                Started {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-900">
                            {client?.name || 'Unknown Client'}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(project.status)}
                          </TableCell>
                          <TableCell className="text-slate-900">
                            ${project.budget ? parseFloat(project.budget).toLocaleString() : '0'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <div className="progress-bar mr-2">
                                <div 
                                  className="progress-fill" 
                                  style={{ width: `${progress}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-slate-600">{Math.round(progress)}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewProject(project);
                                }}
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditProject(project);
                                }}
                                title="Edit Project"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project Modal for Create/Edit */}
        <ProjectModal
          open={showProjectModal}
          onOpenChange={setShowProjectModal}
          project={selectedProject}
          clients={Array.isArray(clients) ? clients : []}
        />

        {/* Project Detail Modal for Viewing */}
        {showProjectDetail && detailProject && (
          <ProjectDetailModal
            open={showProjectDetail}
            onOpenChange={setShowProjectDetail}
            project={detailProject}
            client={clients?.find((c: any) => c.id === detailProject.clientId)}
            onEdit={() => {
              setShowProjectDetail(false);
              handleEditProject(detailProject);
            }}
          />
        )}
      </div>
    );
  }