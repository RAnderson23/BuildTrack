import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Building, 
  Receipt, 
  DollarSign, 
  Edit, 
  TrendingUp, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Upload,
  FileEdit
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

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

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    enabled: !!isAuthenticated,
  });

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
    enabled: !!isAuthenticated,
  });

  const { data: receipts, isLoading: receiptsLoading } = useQuery({
    queryKey: ["/api/receipts"],
    enabled: !!isAuthenticated,
  });

  if (isLoading || statsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const recentProjects = Array.isArray(projects) ? projects.slice(0, 3) : [];
  const recentReceipts = Array.isArray(receipts) ? receipts.slice(0, 3) : [];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
        <p className="text-slate-600">Overview of your construction projects</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active Projects</p>
                <p className="text-3xl font-bold text-slate-900">
                  {stats?.activeProjects || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Building className="text-primary w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 text-sm text-green-600">
              <TrendingUp className="inline w-4 h-4 mr-1" />
              <span>Projects in progress</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Pending Receipts</p>
                <p className="text-3xl font-bold text-slate-900">
                  {stats?.pendingReceipts || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center">
                <Receipt className="text-amber-600 w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 text-sm text-amber-600">
              <Clock className="inline w-4 h-4 mr-1" />
              <span>Need approval</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Revenue</p>
                <p className="text-3xl font-bold text-slate-900">
                  ${stats?.totalRevenue ? stats.totalRevenue.toLocaleString() : '0'}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                <DollarSign className="text-green-600 w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 text-sm text-green-600">
              <TrendingUp className="inline w-4 h-4 mr-1" />
              <span>From approved contracts</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Change Orders</p>
                <p className="text-3xl font-bold text-slate-900">
                  {stats?.changeOrders || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                <Edit className="text-blue-600 w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 text-sm text-slate-600">
              <AlertCircle className="inline w-4 h-4 mr-1" />
              <span>Total change orders</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Recent Projects</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {projectsLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : recentProjects.length === 0 ? (
              <div className="p-4 text-center text-slate-500">
                <Building className="mx-auto w-8 h-8 mb-2 text-slate-400" />
                <p>No projects yet</p>
                <Button variant="link" className="mt-2" onClick={() => window.location.href = '/projects'}>
                  Create your first project
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentProjects.map((project: any) => (
                  <div key={project.id} className="p-4 hover:bg-slate-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-slate-900">{project.name}</h4>
                        <p className="text-sm text-slate-600">{project.description}</p>
                      </div>
                      <div className="text-right">
                        <span className={`status-${project.status}`}>
                          {project.status?.charAt(0).toUpperCase() + project.status?.slice(1)}
                        </span>
                        <p className="text-sm text-slate-600 mt-1">
                          ${project.budget ? parseFloat(project.budget).toLocaleString() : '0'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {receiptsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-start space-x-3">
                    <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentReceipts.length === 0 ? (
              <div className="text-center text-slate-500">
                <Receipt className="mx-auto w-8 h-8 mb-2 text-slate-400" />
                <p>No recent activity</p>
                <Button variant="link" className="mt-2">
                  Upload your first receipt
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentReceipts.map((receipt: any) => (
                  <div key={receipt.id} className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      receipt.status === 'approved' ? 'bg-green-100' :
                      receipt.status === 'rejected' ? 'bg-red-100' : 'bg-blue-100'
                    }`}>
                      {receipt.status === 'approved' ? (
                        <CheckCircle className="text-green-600 w-4 h-4" />
                      ) : receipt.status === 'rejected' ? (
                        <AlertCircle className="text-red-600 w-4 h-4" />
                      ) : (
                        <Upload className="text-blue-600 w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-900">
                        {receipt.status === 'approved' ? 'Receipt approved' :
                         receipt.status === 'rejected' ? 'Receipt rejected' :
                         'Receipt uploaded and parsing'} 
                        {receipt.vendor && ` from ${receipt.vendor}`}
                      </p>
                      <p className="text-xs text-slate-500">
                        {receipt.createdAt ? new Date(receipt.createdAt).toLocaleString() : 'Recently'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
