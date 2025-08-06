import { useState, useCallback } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CloudUpload, Receipt, Upload, Eye, Check, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { queryClient, apiRequest } from "@/lib/queryClient";
import ReceiptReviewModal from "@/components/ReceiptReviewModal";

export default function Receipts() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dragOver, setDragOver] = useState(false);

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

  const { data: receipts, isLoading: receiptsLoading } = useQuery({
    queryKey: ["/api/receipts"],
    enabled: !!isAuthenticated,
  });

  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
    enabled: !!isAuthenticated,
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/receipts/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Receipt uploaded successfully. AI parsing in progress...",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/receipts"] });
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
        title: "Upload Failed",
        description: error.message || "Failed to upload receipt",
        variant: "destructive",
      });
    },
  });

  const updateReceiptMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PUT", `/api/receipts/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/receipts"] });
      toast({
        title: "Success",
        description: "Receipt updated successfully",
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
        description: "Failed to update receipt",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (files: FileList) => {
    Array.from(files).forEach((file) => {
      const formData = new FormData();
      formData.append("receipt", file);
      uploadMutation.mutate(formData);
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleReviewReceipt = (receipt: any) => {
    setSelectedReceipt(receipt);
    setShowReviewModal(true);
  };

  const handleApproveReceipt = (receiptId: string) => {
    updateReceiptMutation.mutate({
      id: receiptId,
      data: { status: "approved" },
    });
  };

  const handleRejectReceipt = (receiptId: string) => {
    updateReceiptMutation.mutate({
      id: receiptId,
      data: { status: "rejected" },
    });
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      approved: "status-approved",
      rejected: "status-rejected",
      pending: "status-pending",
    };
    
    return (
      <span className={statusClasses[status as keyof typeof statusClasses] || "status-pending"}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  const filteredReceipts = Array.isArray(receipts) ? receipts.filter((receipt: any) => {
    if (statusFilter === "all") return true;
    return receipt.status === statusFilter;
  }) : [];

  if (isLoading || receiptsLoading) {
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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Receipt Management</h2>
          <p className="text-slate-600">Upload and manage construction receipts</p>
        </div>
      </div>

      {/* Upload Area */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div 
            className={`upload-area ${dragOver ? 'drag-over' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => document.getElementById('receiptUpload')?.click()}
          >
            <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <CloudUpload className="text-slate-600 text-xl" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">Drop receipt files here</h3>
            <p className="text-slate-600 mb-4">Or click to browse and upload receipt images</p>
            <p className="text-sm text-slate-500">Supports: JPG, PNG, PDF files up to 10MB</p>
            <input
              type="file"
              id="receiptUpload"
              className="hidden"
              accept=".jpg,.jpeg,.png,.pdf"
              multiple
              onChange={handleFileInputChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Receipts Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-900">Uploaded Receipts</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredReceipts.length === 0 ? (
            <div className="p-8 text-center">
              <Receipt className="mx-auto w-12 h-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                {statusFilter === "all" ? "No receipts yet" : `No ${statusFilter} receipts`}
              </h3>
              <p className="text-slate-600 mb-4">
                {statusFilter === "all" 
                  ? "Upload your first receipt to get started with expense tracking."
                  : `You don't have any ${statusFilter} receipts at the moment.`
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReceipts.map((receipt: any) => {
                    const project = Array.isArray(projects) ? projects.find((p: any) => p.id === receipt.projectId) : null;
                    
                    return (
                      <TableRow key={receipt.id} className="hover:bg-slate-50">
                        <TableCell>
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mr-3">
                              <Receipt className="text-slate-600 w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-medium text-slate-900">{receipt.fileName}</div>
                              <div className="text-sm text-slate-500">
                                Uploaded {receipt.createdAt ? new Date(receipt.createdAt).toLocaleString() : 'Recently'}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-900">
                          {receipt.vendor || (receipt.aiParsed ? 'Parsing...' : 'Pending AI')}
                        </TableCell>
                        <TableCell className="text-slate-900">
                          {receipt.receiptDate ? new Date(receipt.receiptDate).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell className="font-medium text-slate-900">
                          {receipt.totalAmount ? `$${parseFloat(receipt.totalAmount).toLocaleString()}` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(receipt.status)}
                        </TableCell>
                        <TableCell className="text-slate-900">
                          {project?.name || 'Unassigned'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleReviewReceipt(receipt)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {receipt.status === 'pending' && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleApproveReceipt(receipt.id)}
                                  disabled={updateReceiptMutation.isPending}
                                >
                                  <Check className="w-4 h-4 text-green-600" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleRejectReceipt(receipt.id)}
                                  disabled={updateReceiptMutation.isPending}
                                >
                                  <X className="w-4 h-4 text-red-600" />
                                </Button>
                              </>
                            )}
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

      <ReceiptReviewModal
        open={showReviewModal}
        onOpenChange={setShowReviewModal}
        receipt={selectedReceipt}
        projects={Array.isArray(projects) ? projects : []}
      />
    </div>
  );
}
