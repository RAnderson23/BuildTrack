import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Plus, FileText, Eye, Edit, MoreHorizontal } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import ContractBuilder from "@/components/ContractBuilder";

export default function Contracts() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [showContractBuilder, setShowContractBuilder] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);

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

  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
    enabled: !!isAuthenticated,
  });

  // Get all contracts for all projects
  const contractQueries = projects?.map((project: any) => ({
    queryKey: ["/api/projects", project.id, "contracts"],
    enabled: !!isAuthenticated,
  })) || [];

  const handleNewContract = () => {
    setSelectedContract(null);
    setShowContractBuilder(true);
  };

  const handleEditContract = (contract: any) => {
    setSelectedContract(contract);
    setShowContractBuilder(true);
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      approved: "status-approved",
      rejected: "status-rejected",
      pending: "status-pending",
      draft: "status-planning",
    };
    
    return (
      <span className={statusClasses[status as keyof typeof statusClasses] || "status-pending"}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  const getTypeBadge = (type: string, isChangeOrder: boolean) => {
    if (isChangeOrder) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
          Change Order
        </span>
      );
    }
    
    const typeClasses = {
      contract: "bg-blue-100 text-blue-800",
      estimate: "bg-slate-100 text-slate-800",
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeClasses[type as keyof typeof typeClasses] || typeClasses.estimate}`}>
        {type?.charAt(0).toUpperCase() + type?.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-48 bg-slate-200 rounded-lg"></div>
          <div className="h-64 bg-slate-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  // Mock contracts data for now - in real app, this would be fetched from API
  const mockContracts = [
    {
      id: '1',
      contractNumber: 'CON-2024-001',
      title: 'Kitchen Remodel Contract',
      projectName: 'Kitchen Remodel',
      type: 'contract',
      isChangeOrder: false,
      totalAmount: '45200.00',
      status: 'approved',
      createdAt: '2024-03-15',
    },
    {
      id: '2', 
      contractNumber: 'EST-2024-002',
      title: 'Office Build-out Estimate',
      projectName: 'Office Build-out',
      type: 'estimate',
      isChangeOrder: false,
      totalAmount: '128500.00',
      status: 'pending',
      createdAt: '2024-03-10',
    },
    {
      id: '3',
      contractNumber: 'CHG-2024-001',
      title: 'Additional Electrical Work',
      projectName: 'Kitchen Remodel',
      type: 'contract',
      isChangeOrder: true,
      totalAmount: '3200.00',
      status: 'draft',
      createdAt: '2024-03-20',
    },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Contracts & Estimates</h2>
          <p className="text-slate-600">Create and manage project contracts and estimates</p>
        </div>
        <Button onClick={handleNewContract}>
          <Plus className="w-4 h-4 mr-2" />
          New Contract
        </Button>
      </div>

      {/* Contract Builder Preview */}
      <ContractBuilder 
        projects={projects || []}
        className="mb-6"
      />

      {/* Existing Contracts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">Existing Contracts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {mockContracts.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="mx-auto w-12 h-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No contracts yet</h3>
              <p className="text-slate-600 mb-4">Create your first estimate or contract to get started.</p>
              <Button onClick={handleNewContract}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Contract
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contract</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockContracts.map((contract) => (
                    <TableRow key={contract.id} className="hover:bg-slate-50">
                      <TableCell>
                        <div>
                          <div className="font-medium text-slate-900">{contract.contractNumber}</div>
                          <div className="text-sm text-slate-500">
                            Created {new Date(contract.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-900">
                        {contract.projectName}
                      </TableCell>
                      <TableCell>
                        {getTypeBadge(contract.type, contract.isChangeOrder)}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">
                        ${parseFloat(contract.totalAmount).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(contract.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          {contract.isChangeOrder && (
                            <Button variant="ghost" size="sm" className="text-amber-600">
                              Change Order
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleEditContract(contract)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
