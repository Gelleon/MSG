'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/navigation';
import { useAuthStore } from '@/lib/store';
import { adminService, User } from '@/lib/admin-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AddUserModal } from './AddUserModal';
import { 
  Loader2, 
  Search, 
  Download, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  ArrowUpDown,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminUsersPage() {
  const router = useRouter();
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isBulkDelete, setIsBulkDelete] = useState(false);

  // Filters
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(timer);
  }, [search, page, sortBy, sortOrder]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminService.getUsers({
        page,
        limit,
        search,
        sortBy,
        sortOrder
      });
      setUsers(res.data);
      setTotal(res.total);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await adminService.exportUsers();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'users.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Export successful');
    } catch (error) {
      console.error(error);
      toast.error('Export failed');
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleSelectAll = () => {
    if (selectedUsers.length > 0) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.filter(u => u.id !== currentUser?.id).map(u => u.id));
    }
  };

  const handleSelectUser = (id: string) => {
    if (id === currentUser?.id) return;

    if (selectedUsers.includes(id)) {
      setSelectedUsers(prev => prev.filter(uid => uid !== id));
    } else {
      setSelectedUsers(prev => [...prev, id]);
    }
  };

  const confirmDelete = (user: User) => {
    setUserToDelete(user);
    setIsBulkDelete(false);
    setDeleteDialogOpen(true);
  };

  const confirmBulkDelete = () => {
    setIsBulkDelete(true);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      if (isBulkDelete) {
        await adminService.deleteUsers(selectedUsers);
        toast.success(`Deleted ${selectedUsers.length} users`);
        setSelectedUsers([]);
      } else if (userToDelete) {
        await adminService.deleteUser(userToDelete.id);
        toast.success(`User ${userToDelete.email} deleted`);
      }
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete user(s)');
    }
  };

  if (!isAuthenticated() || currentUser?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Access Denied</p>
      </div>
    );
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">Manage system users and permissions</p>
          </div>
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>

        {/* Toolbar */}
        <Card>
          <CardHeader className="pb-3">
             <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium">Users</CardTitle>
                <div className="flex items-center gap-2">
                    {selectedUsers.length > 0 && (
                        <Button variant="destructive" size="sm" onClick={confirmBulkDelete}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Selected ({selectedUsers.length})
                        </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                    </Button>
                    <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add User
                    </Button>
                </div>
             </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  className="pl-9 max-w-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <table className="w-full caption-bottom text-sm text-left">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground w-[40px]">
                        <input 
                            type="checkbox" 
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            checked={users.length > 0 && selectedUsers.length === users.length}
                            onChange={handleSelectAll}
                        />
                    </th>
                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('name')}>
                        <div className="flex items-center">
                            Name
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                    </th>
                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('email')}>
                        <div className="flex items-center">
                            Email
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                    </th>
                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('role')}>
                         <div className="flex items-center">
                            Role
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                    </th>
                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('createdAt')}>
                        <div className="flex items-center">
                            Joined
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                    </th>
                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-muted-foreground">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <td className="p-4 align-middle">
                            <input 
                                type="checkbox" 
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => handleSelectUser(user.id)}
                            disabled={user.id === currentUser?.id}
                        />
                        </td>
                        <td className="p-4 align-middle font-medium">{user.name || 'N/A'}</td>
                        <td className="p-4 align-middle">{user.email}</td>
                        <td className="p-4 align-middle">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                                user.role === 'ADMIN' ? 'bg-primary/10 text-primary' : 
                                user.role === 'MANAGER' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                'bg-secondary text-secondary-foreground'
                            }`}>
                                {user.role}
                            </span>
                        </td>
                        <td className="p-4 align-middle">{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td className="p-4 align-middle">
                            <span className="inline-flex h-2 w-2 rounded-full bg-green-500" />
                            <span className="ml-2">Active</span>
                        </td>
                        <td className="p-4 align-middle text-right">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => confirmDelete(user)}
                                className="text-muted-foreground hover:text-destructive"
                                disabled={user.id === currentUser?.id}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-end space-x-2 py-4">
              <div className="flex-1 text-sm text-muted-foreground">
                Total {total} users
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AddUserModal 
        open={isAddModalOpen} 
        onOpenChange={setIsAddModalOpen} 
        onSuccess={fetchUsers} 
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              {isBulkDelete 
                ? `Are you sure you want to delete ${selectedUsers.length} selected users? This action cannot be undone.`
                : `Are you sure you want to delete user "${userToDelete?.email}"? This action cannot be undone.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
