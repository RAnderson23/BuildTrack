// client/src/pages/clients.tsx
// COMPLETE UPDATED VERSION with ClientDetailModal integration

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Plus, Edit2, Trash2, Eye } from "lucide-react"; // Added Eye icon
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ClientModal } from "@/components/ClientModal";
import { ClientDetailModal } from "@/components/ClientDetailModal"; // NEW IMPORT
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Client } from "@shared/schema";

export default function ClientsPage() {
  const [showClientModal, setShowClientModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientDetail, setShowClientDetail] = useState(false); // NEW STATE
  const [detailClient, setDetailClient] = useState<Client | null>(null); // NEW STATE
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients, isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: string) => {
      return await apiRequest("DELETE", `/api/clients/${clientId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Success",
        description: "Client deleted successfully",
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
        description: "Failed to delete client",
        variant: "destructive",
      });
    },
  });

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setShowClientModal(true);
  };

  const handleDeleteClient = (clientId: string) => {
    if (confirm("Are you sure you want to delete this client? This will also delete all associated projects and contracts.")) {
      deleteClientMutation.mutate(clientId);
    }
  };

  const handleNewClient = () => {
    setSelectedClient(null);
    setShowClientModal(true);
  };

  // NEW FUNCTION: Handle viewing client details
  const handleViewClient = (client: Client) => {
    setDetailClient(client);
    setShowClientDetail(true);
  };

  if (isLoading) {
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
          <h2 className="text-2xl font-bold text-slate-900">Client Management</h2>
          <p className="text-slate-600">Manage your construction clients and their information</p>
        </div>
        <Button onClick={handleNewClient}>
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            All Clients ({Array.isArray(clients) ? clients.length : 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!Array.isArray(clients) || clients.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="mx-auto w-12 h-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No clients yet</h3>
              <p className="text-slate-600 mb-4">Add your first client to start managing construction projects.</p>
              <Button onClick={handleNewClient}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Client
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow 
                      key={client.id} 
                      className="hover:bg-slate-50 cursor-pointer"
                      onClick={() => handleViewClient(client)} // NEW: Make row clickable
                    >
                      <TableCell>
                        <div className="font-medium text-slate-900">{client.name}</div>
                        {client.notes && (
                          <div className="text-sm text-slate-500 truncate max-w-xs">
                            {client.notes}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-900">
                        {client.email || "No email"}
                      </TableCell>
                      <TableCell className="text-slate-900">
                        {client.phone || "No phone"}
                      </TableCell>
                      <TableCell className="text-slate-900">
                        <div className="max-w-xs truncate">
                          {client.address || "No address"}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : 'Recently'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation(); // NEW: Prevent row click
                              handleViewClient(client);
                            }}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation(); // NEW: Prevent row click
                              handleEditClient(client);
                            }}
                            title="Edit Client"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation(); // NEW: Prevent row click
                              handleDeleteClient(client.id);
                            }}
                            disabled={deleteClientMutation.isPending}
                            title="Delete Client"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
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

      {/* Existing ClientModal for create/edit */}
      <ClientModal
        open={showClientModal}
        onOpenChange={setShowClientModal}
        client={selectedClient}
      />

      {/* NEW: ClientDetailModal for viewing details */}
      {showClientDetail && detailClient && (
        <ClientDetailModal
          open={showClientDetail}
          onOpenChange={setShowClientDetail}
          client={detailClient}
          onEdit={() => {
            setShowClientDetail(false);
            handleEditClient(detailClient);
          }}
        />
      )}
    </div>
  );
}