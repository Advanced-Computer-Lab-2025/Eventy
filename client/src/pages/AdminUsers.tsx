import { useState,useEffect } from "react";
import axios from "axios";
import { Plus, Search, MoreVertical, Shield, UserX, UserCheck } from "lucide-react";
import AdminHeader from "@/components/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CreatePrivilegedUserForm from "@/components/CreatePrivilegedUserForm";


import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";


interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string | null;
  status: string;
  studentStaffId?: string;
}

export default function AdminUsers() {
 const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [assigningRole, setAssigningRole] = useState<string | null>(null);
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    password: "",
    role: "admin",
  });
   const [userToDelete, setUserToDelete] = useState<string | null>(null);
  // Derive current user identity from localStorage or JWT token as fallback
  const token = localStorage.getItem('token');
  let tokenUserId: string | null = null;
  let tokenUserEmail: string | null = null;
  if (token) {
    try {
      const [, payloadBase64] = token.split('.');
      const payloadJson = JSON.parse(atob(payloadBase64));
      tokenUserId = payloadJson.id || null;
      tokenUserEmail = payloadJson.email || null;
    } catch (_e) {
      // ignore decode errors
    }
  }
  const currentUserId = localStorage.getItem('userId') || localStorage.getItem('id') || tokenUserId;
  const currentUserEmail = localStorage.getItem('userEmail') || localStorage.getItem('email') || tokenUserEmail;

  const handleDeleteUser = async (userId: string) => {
    try {
      await axios.delete(`http://localhost:4000/api/users/${userId}/delete`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setUserToDelete(null);
      setError(null);
      fetchUsers();
    } catch (error: any) {
      console.error("Delete error:", error);
      console.error("Error response:", error.response?.data);
      
      if (error.response?.status === 403) {
        setError("You cannot delete your own account");
      } else {
        setError(error.response?.data?.message || error.message || "Failed to delete user");
      }
      setUserToDelete(null);
    }
  };

   // Fetch users when component mounts
  useEffect(() => {
    fetchUsers();
    fetchPendingUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('http://localhost:4000/api/users/getusers', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setUsers(response.data.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingUsers = async () => {
    try {
      setPendingLoading(true);
      const response = await axios.get('http://localhost:4000/api/users/pending', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setPendingUsers(response.data.data);
    } catch (err) {
      console.error('Failed to fetch pending users:', err);
      setPendingUsers([]);
    } finally {
      setPendingLoading(false);
    }
  };

  const handleAssignRole = async (userId: string, role: string) => {
    try {
      setAssigningRole(userId);
      await axios.patch(`http://localhost:4000/api/users/${userId}/assign-role`, 
        { role },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setError(null);
      // Refresh both tables to reflect the role assignment
      await fetchPendingUsers(); // Remove user from pending table
      await fetchUsers(); // Add user to main table with new role
    } catch (error: any) {
      console.error("Assign role error:", error);
      setError(error.response?.data?.message || "Failed to assign role");
    } finally {
      setAssigningRole(null);
    }
  };

  // Move loading/error checks BEFORE using filteredUsers
  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  if (error) return <div className="flex justify-center items-center min-h-screen text-red-500">{error}</div>;

  const filteredUsers = users.filter(user => 
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold">User Management</h1>
            <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-admin">
              <Plus className="h-4 w-4 mr-2" />
              Create Admin/Event Office
            </Button>
          </div>
          <p className="text-muted-foreground">
            Manage users, roles, and permissions
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-users"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user._id} data-testid={`row-user-${user._id}`}>
                    <TableCell className="font-medium"> {`${user.firstName} ${user.lastName}`}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge className="capitalize"> {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.studentStaffId || 'N/A'}</TableCell>
                    <TableCell>
                      {user.status === "active" ? (
                        <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
                      ) : (
                        <Badge variant="destructive">Blocked</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`button-actions-${user._id}`}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => console.log("Verify role for:", user._id)}
                            data-testid={`action-verify-${user._id}`}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Verify Role
                          </DropdownMenuItem>
                          {user.status === "active" ? (
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => console.log("Block user:", user._id)}
                              data-testid={`action-block-${user._id}`}
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Block User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              onClick={() => console.log("Unblock user:", user._id)}
                              data-testid={`action-unblock-${user._id}`}
                            >
                              <UserCheck className="h-4 w-4 mr-2" />
                              Unblock User
                            </DropdownMenuItem>
                          )}

  {(currentUserId ? user._id !== currentUserId : true) && (currentUserEmail ? user.email !== currentUserEmail : true) && (user.role === 'admin' || user.role === 'events_office') && (
    <DropdownMenuItem 
      className="text-destructive"
      onClick={() => setUserToDelete(user._id)}
      data-testid={`action-delete-${user._id}`}
    >
      <UserX className="h-4 w-4 mr-2" />
      Delete Account
    </DropdownMenuItem>
  )}
</DropdownMenuContent>
                          
                        
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Pending Users</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingLoading ? (
              <div className="text-center py-8">Loading pending users...</div>
            ) : pendingUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No pending users</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingUsers.map((user) => (
                    <TableRow key={user._id} data-testid={`row-pending-user-${user._id}`}>
                      <TableCell className="font-medium">{`${user.firstName} ${user.lastName}`}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">Unassigned</Badge>
                      </TableCell>
                      <TableCell>{user.studentStaffId || 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              disabled={assigningRole === user._id}
                              data-testid={`button-assign-role-${user._id}`}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleAssignRole(user._id, "professor")}
                              disabled={assigningRole === user._id}
                              data-testid={`action-assign-professor-${user._id}`}
                            >
                              Assign as Professor
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleAssignRole(user._id, "ta")}
                              disabled={assigningRole === user._id}
                              data-testid={`action-assign-ta-${user._id}`}
                            >
                              Assign as TA
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleAssignRole(user._id, "staff")}
                              disabled={assigningRole === user._id}
                              data-testid={`action-assign-staff-${user._id}`}
                            >
                              Assign as Staff
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Admin/Event Office Account</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new admin or event office account
            </DialogDescription>
          </DialogHeader>
          <CreatePrivilegedUserForm
            onSuccess={() => { setShowCreateDialog(false); fetchUsers(); }}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the user account
            and remove all associated data.
          </AlertDialogDescription>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && handleDeleteUser(userToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>


    </div>
  );
}