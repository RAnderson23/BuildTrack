import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface ReceiptReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: any;
  projects: any[];
}

export default function ReceiptReviewModal({ 
  open, 
  onOpenChange, 
  receipt, 
  projects 
}: ReceiptReviewModalProps) {
  const { toast } = useToast();
  const [vendor, setVendor] = useState(receipt?.vendor || "");
  const [date, setDate] = useState(
    receipt?.receiptDate ? new Date(receipt.receiptDate).toISOString().split('T')[0] : ""
  );
  const [total, setTotal] = useState(receipt?.totalAmount || "");
  const [selectedProject, setSelectedProject] = useState(receipt?.projectId || "");
  const [selectedContract, setSelectedContract] = useState(receipt?.contractId || "");

  const updateReceiptMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", `/api/receipts/${receipt.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/receipts"] });
      onOpenChange(false);
      toast({
        title: "Success",
        description: "Receipt approved and assigned successfully",
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

  const handleApprove = () => {
    updateReceiptMutation.mutate({
      status: "approved",
      vendor,
      receiptDate: date ? new Date(date) : null,
      totalAmount: total,
      projectId: selectedProject || null,
      contractId: selectedContract || null,
    });
  };

  const handleReject = () => {
    updateReceiptMutation.mutate({
      status: "rejected",
    });
  };

  if (!receipt) return null;

  const parsedData = receipt.parsedData || {};
  const lineItems = parsedData.lineItems || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Review Receipt
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Receipt Image/Info */}
          <div>
            <h4 className="font-medium text-slate-900 mb-3">Receipt Information</h4>
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <div className="space-y-2">
                <p><strong>File:</strong> {receipt.fileName}</p>
                <p><strong>Uploaded:</strong> {new Date(receipt.createdAt).toLocaleString()}</p>
                <p><strong>AI Parsed:</strong> {receipt.aiParsed ? "Yes" : "No"}</p>
                {receipt.aiParsed && parsedData.error && (
                  <p className="text-red-600"><strong>Parsing Error:</strong> {parsedData.error}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Parsed Data */}
          <div>
            <h4 className="font-medium text-slate-900 mb-3">Parsed Data</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Vendor</Label>
                  <Input 
                    value={vendor} 
                    onChange={(e) => setVendor(e.target.value)}
                    placeholder="Enter vendor name"
                  />
                </div>
                <div>
                  <Label>Date</Label>
                  <Input 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <Label>Total Amount</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  value={total} 
                  onChange={(e) => setTotal(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              
              {lineItems.length > 0 && (
                <div>
                  <Label className="mb-2 block">Line Items</Label>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lineItems.map((item: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="text-sm">{item.description}</TableCell>
                            <TableCell className="text-right text-sm">{item.quantity || 1}</TableCell>
                            <TableCell className="text-right text-sm">
                              ${item.totalPrice?.toFixed(2) || '0.00'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
              
              <div>
                <Label>Assign to Project</Label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No project</SelectItem>
                    {projects.map((project: any) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Assign to Contract</Label>
                <Select value={selectedContract} onValueChange={setSelectedContract}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select contract..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No contract</SelectItem>
                    {/* In a real app, this would be populated based on selected project */}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleReject}
            disabled={updateReceiptMutation.isPending}
          >
            Reject
          </Button>
          <Button 
            onClick={handleApprove}
            disabled={updateReceiptMutation.isPending}
          >
            {updateReceiptMutation.isPending ? "Saving..." : "Approve & Assign"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
