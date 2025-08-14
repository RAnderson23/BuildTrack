// client/src/components/ProjectDetailModal.tsx
// Shows project details and all its contracts

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  Receipt as ReceiptIcon, 
  Plus, 
  Edit, 
  Calendar,
  DollarSign,
  User,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  Building2
} from "lucide-react";

interface ProjectDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: any;
  client?: any;
  onEdit: () => void;
}

export function ProjectDetailModal({ open, onOpenChange, project, client, onEdit }: ProjectDetailModalProps) {
  const [showNewContract, setShowNewContract] = useState(false);

  // Fetch contracts for this project
  const { data: contracts = [], isLoading: contractsLoading } = useQuery({
    queryKey: [`/api/projects/${project?.id}/contracts`],
    enabled: !!project?.id,
    queryFn: async () => {
      // For now, return mock data - replace with actual API call
      return [
        // Mock contracts - replace with actual API call
      ];
    }
  });

  // Fetch receipts for this project
  const { data: receipts = [], isLoading: receiptsLoading } = useQuery({
    queryKey: [`/api/projects/${project?.id}/receipts`],
    enabled: !!project?.id,
    queryFn: async () => {
      // For now, return empty - replace with actual API call
      return [];
    }
  });

  // Calculate project health metrics
  const budget = parseFloat(project?.budget || '0');
  const actualCost = parseFloat(project?.actualCost || '0');
  const budgetUsedPercent = budget > 0 ? (actualCost / budget) * 100 : 0;
  const isOverBudget = actualCost > budget;

  const totalContractValue = contracts.reduce((sum: number, c: any) => 
    sum + parseFloat(c.totalAmount || '0'), 0
  );

  const approvedContracts = contracts.filter((c: any) => c.status === 'approved');
  const pendingContracts = contracts.filter((c: any) => c.status === 'pending');
  const changeOrders = contracts.filter((c: any) => c.isChangeOrder);

  const getStatusColor = (status: string) => {
    const colors = {
      planning: 'bg-slate-100 text-slate-800',
      active: 'bg-green-100 text-green-800',
      on_hold: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800'
    };
    return colors[status as keyof typeof colors] || colors.planning;
  };

  const getContractStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-slate-100 text-slate-800',
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl">{project.name}</DialogTitle>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(project.status)}>
                  {project.status}
                </Badge>
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Project
                </Button>
              </div>
            </div>
            {client && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Building2 className="w-4 h-4" />
                <span>{client.name}</span>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project Overview */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {project.description && (
                  <p className="text-slate-600">{project.description}</p>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Start Date</p>
                    <p className="font-medium">
                      {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">End Date</p>
                    <p className="font-medium">
                      {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Budget</p>
                    <p className="font-medium">${budget.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Actual Cost</p>
                    <p className={`font-medium ${isOverBudget ? 'text-red-600' : ''}`}>
                      ${actualCost.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Budget Progress */}
                {budget > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Budget Usage</span>
                      <span className={`font-medium ${isOverBudget ? 'text-red-600' : ''}`}>
                        {budgetUsedPercent.toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(budgetUsedPercent, 100)} 
                      className={isOverBudget ? 'bg-red-100' : ''}
                    />
                    {isOverBudget && (
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        <span>Project is ${(actualCost - budget).toLocaleString()} over budget</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-2xl font-bold">{contracts.length}</p>
                    <p className="text-sm text-slate-600">Total Contracts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-2xl font-bold">${totalContractValue.toLocaleString()}</p>
                    <p className="text-sm text-slate-600">Contract Value</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-2xl font-bold">{changeOrders.length}</p>
                    <p className="text-sm text-slate-600">Change Orders</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <ReceiptIcon className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-2xl font-bold">{receipts.length}</p>
                    <p className="text-sm text-slate-600">Receipts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contracts Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Contracts & Estimates ({contracts.length})
                </CardTitle>
                <Button size="sm" onClick={() => setShowNewContract(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Contract
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {contractsLoading ? (
                <div className="text-center py-4 text-slate-500">Loading contracts...</div>
              ) : contracts.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 mb-4">No contracts yet for this project</p>
                  <Button onClick={() => setShowNewContract(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Contract
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {contracts.map((contract: any) => (
                    <div
                      key={contract.id}
                      className="border rounded-lg p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h4 className="font-medium text-slate-900">
                              {contract.contractNumber}
                            </h4>
                            <Badge className={getContractStatusColor(contract.status)}>
                              {contract.status}
                            </Badge>
                            {contract.isChangeOrder && (
                              <Badge className="bg-amber-100 text-amber-800">
                                Change Order
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mt-1">{contract.title}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              {parseFloat(contract.totalAmount).toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(contract.createdAt).toLocaleDateString()}
                            </span>
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

          {/* Receipts Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Receipts ({receipts.length})
                </CardTitle>
                <Button size="sm" onClick={() => window.location.href = '/receipts'}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Receipt
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {receiptsLoading ? (
                <div className="text-center py-4 text-slate-500">Loading receipts...</div>
              ) : receipts.length === 0 ? (
                <div className="text-center py-8">
                  <ReceiptIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No receipts uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Receipt list would go here */}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}