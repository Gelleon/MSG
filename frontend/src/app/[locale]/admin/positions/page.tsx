'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/navigation';
import { useAuthStore } from '@/lib/store';
import { positionsService, Position } from '@/lib/positions-service';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Loader2, 
  Search, 
  Plus, 
  Pencil, 
  Trash2, 
  Users,
  Check,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslations } from 'next-intl';

export default function AdminPositionsPage() {
  const t = useTranslations('Admin.Positions');
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [positions, setPositions] = useState<Position[]>([]);
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  
  // Form Data
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
  const [formData, setFormData] = useState({ nameRu: '', nameZh: '' });
  
  // Assign Users Logic
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  useEffect(() => {
    fetchPositions();
  }, []);

  const fetchPositions = async () => {
    setLoading(true);
    try {
      const data = await positionsService.getAll();
      setPositions(data);
    } catch (error) {
      console.error(error);
      toast.error(t('errorFetch'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await positionsService.create(formData);
      toast.success(t('successCreate'));
      setIsAddModalOpen(false);
      setFormData({ nameRu: '', nameZh: '' });
      fetchPositions();
    } catch (error) {
      toast.error(t('errorCreate'));
    }
  };

  const handleUpdate = async () => {
    if (!currentPosition) return;
    try {
      await positionsService.update(currentPosition.id, formData);
      toast.success(t('successUpdate'));
      setIsEditModalOpen(false);
      setCurrentPosition(null);
      setFormData({ nameRu: '', nameZh: '' });
      fetchPositions();
    } catch (error) {
      toast.error(t('errorUpdate'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return;
    try {
      await positionsService.delete(id);
      toast.success(t('successDelete'));
      fetchPositions();
    } catch (error) {
      toast.error(t('errorDelete'));
    }
  };

  const openAssignModal = async (position: Position) => {
    setCurrentPosition(position);
    setAssignLoading(true);
    try {
      // Fetch all users to select from
      // Note: In a real app with many users, we should use server-side search
      const res = await adminService.getUsers({ limit: 1000 }); 
      setUsers(res.data);
      // Pre-select users who already have this position
      // Wait, the API returns users assigned to this position?
      // positionsService.getAll includes users.
      // But we need checking if position.users contains user.id
      const assignedUserIds = position.users?.map(u => u.id) || [];
      setSelectedUsers(assignedUserIds);
      
      setIsAssignModalOpen(true);
    } catch (error) {
      toast.error(t('errorFetchUsers'));
    } finally {
      setAssignLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!currentPosition) return;
    try {
      // We need to determine which users to ADD and which to REMOVE?
      // Or just SET the list?
      // The API assignToUsers updates specific users to have this position.
      // It doesn't clear others.
      // So we need:
      // 1. Identify currently assigned users (from currentPosition.users)
      // 2. Identify new selection (selectedUsers)
      // 3. Users to assign: selectedUsers
      // 4. Users to unassign: currentlyAssigned.filter(id => !selectedUsers.includes(id))
      
      const currentlyAssigned = currentPosition.users?.map(u => u.id) || [];
      const toAssign = selectedUsers;
      const toUnassign = currentlyAssigned.filter(id => !selectedUsers.includes(id));

      if (toAssign.length > 0) {
        await positionsService.assignToUsers(currentPosition.id, toAssign);
      }
      if (toUnassign.length > 0) {
        // We need an unassign endpoint or loop
        // I added unassignFromUsers to service/controller
        await positionsService.unassignFromUsers(toUnassign);
      }

      toast.success(t('successAssign'));
      setIsAssignModalOpen(false);
      fetchPositions();
    } catch (error) {
      toast.error(t('errorAssign'));
    }
  };

  const filteredUsers = users.filter(u => 
    (u.name?.toLowerCase().includes(userSearch.toLowerCase()) || 
     u.email?.toLowerCase().includes(userSearch.toLowerCase()))
  );

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[#8B5CF6]">{t('title')}</h1>
        <Button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white"
        >
          <Plus className="mr-2 h-4 w-4" /> {t('addPosition')}
        </Button>
      </div>

      <Card className="border-[#8B5CF6]/20 shadow-lg">
        <CardHeader className="bg-[#8B5CF6]/5 border-b border-[#8B5CF6]/10">
          <CardTitle className="text-[#8B5CF6]">{t('allPositions')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-[#8B5CF6]/5">
                <TableHead className="text-[#8B5CF6]">{t('nameRu')}</TableHead>
                <TableHead className="text-[#8B5CF6]">{t('nameZh')}</TableHead>
                <TableHead className="text-[#8B5CF6]">{t('usersCount')}</TableHead>
                <TableHead className="text-right text-[#8B5CF6]">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#8B5CF6]" />
                  </TableCell>
                </TableRow>
              ) : positions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                    {t('noPositionsFound')}
                  </TableCell>
                </TableRow>
              ) : (
                positions.map((position) => (
                  <TableRow key={position.id} className="hover:bg-[#8B5CF6]/5">
                    <TableCell className="font-medium">{position.nameRu}</TableCell>
                    <TableCell>{position.nameZh}</TableCell>
                    <TableCell>{position.users?.length || 0}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openAssignModal(position)}
                        className="text-[#8B5CF6] hover:text-[#7C3AED] hover:bg-[#8B5CF6]/10"
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setCurrentPosition(position);
                          setFormData({ nameRu: position.nameRu, nameZh: position.nameZh });
                          setIsEditModalOpen(true);
                        }}
                        className="text-[#8B5CF6] hover:text-[#7C3AED] hover:bg-[#8B5CF6]/10"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDelete(position.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[425px] border-[#8B5CF6] bg-white">
          <DialogHeader>
            <DialogTitle className="text-[#8B5CF6]">{t('createTitle')}</DialogTitle>
            <DialogDescription>
              {t('createDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nameRu">{t('nameRu')}</Label>
              <Input
                id="nameRu"
                value={formData.nameRu}
                onChange={(e) => setFormData({ ...formData, nameRu: e.target.value })}
                className="border-[#8B5CF6]/20 focus-visible:ring-[#8B5CF6]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nameZh">{t('nameZh')}</Label>
              <Input
                id="nameZh"
                value={formData.nameZh}
                onChange={(e) => setFormData({ ...formData, nameZh: e.target.value })}
                className="border-[#8B5CF6]/20 focus-visible:ring-[#8B5CF6]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>{t('cancel')}</Button>
            <Button onClick={handleCreate} className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white">{t('create')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px] border-[#8B5CF6] bg-white">
          <DialogHeader>
            <DialogTitle className="text-[#8B5CF6]">{t('editTitle')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-nameRu">{t('nameRu')}</Label>
              <Input
                id="edit-nameRu"
                value={formData.nameRu}
                onChange={(e) => setFormData({ ...formData, nameRu: e.target.value })}
                className="border-[#8B5CF6]/20 focus-visible:ring-[#8B5CF6]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-nameZh">{t('nameZh')}</Label>
              <Input
                id="edit-nameZh"
                value={formData.nameZh}
                onChange={(e) => setFormData({ ...formData, nameZh: e.target.value })}
                className="border-[#8B5CF6]/20 focus-visible:ring-[#8B5CF6]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>{t('cancel')}</Button>
            <Button onClick={handleUpdate} className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white">{t('saveChanges')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="sm:max-w-[600px] border-[#8B5CF6] bg-white h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-[#8B5CF6]">{t('assignTitle', {name: currentPosition?.nameRu})}</DialogTitle>
            <DialogDescription>
              {t('assignDesc')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center space-x-2 my-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder={t('searchUsers')} 
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="flex-1 border-[#8B5CF6]/20 focus-visible:ring-[#8B5CF6]"
            />
          </div>

          <ScrollArea className="flex-1 border rounded-md p-4">
            {assignLoading ? (
               <div className="flex justify-center p-4"><Loader2 className="animate-spin text-[#8B5CF6]" /></div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map(user => (
                  <div key={user.id} className="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded-md">
                    <Checkbox 
                      id={`user-${user.id}`}
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedUsers([...selectedUsers, user.id]);
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                        }
                      }}
                      className="border-[#8B5CF6] data-[state=checked]:bg-[#8B5CF6]"
                    />
                    <Label htmlFor={`user-${user.id}`} className="flex-1 cursor-pointer">
                      <div className="font-medium">{user.name || 'Unnamed'}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </Label>
                    {user.role && <span className="text-xs px-2 py-1 bg-slate-100 rounded text-slate-500">{user.role}</span>}
                  </div>
                ))}
                {filteredUsers.length === 0 && (
                  <div className="text-center text-muted-foreground py-4">{t('noUsersFound')}</div>
                )}
              </div>
            )}
          </ScrollArea>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>{t('cancel')}</Button>
            <Button onClick={handleAssign} className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white">
              {t('saveAssignments')} ({selectedUsers.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
