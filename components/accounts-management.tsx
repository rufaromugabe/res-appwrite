import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuthContext } from "@/hooks/useAuthContext";
import { getAllUsers, updateUserRole, searchUsers, type UserData } from "@/data/appwrite-user-data";
import { toast } from "react-toastify";
import { Search } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Input } from "./ui/input";


const PAGE_SIZE = 20;

const AdminAccountManagement = () => {
  const { user } = useAuthContext();
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const observerRef = useRef(null);

  const fetchUsers = useCallback(async (offset = 0, append = false) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const result = await getAllUsers(PAGE_SIZE, offset);
      
      setUsers(prev => append ? [...prev, ...result.users] : result.users);
      setHasMore(result.hasMore);
      setCurrentOffset(offset);
      
      console.log(`Fetched ${result.users.length} users, hasMore: ${result.hasMore}`);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users.");
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setIsSearching(false);
      fetchUsers(0, false);
      return;
    }

    setIsSearching(true);
    setLoading(true);
    try {
      const searchResults = await searchUsers(query.trim());
      setUsers(searchResults);
      setHasMore(false); // No pagination for search results
    } catch (error) {
      console.error("Error searching users:", error);
      toast.error("Failed to search users.");
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userDocId: string, newRole: "user" | "admin") => {
    try {
      await updateUserRole(userDocId, newRole);
      setUsers(prev => prev.map(user => 
        user.$id === userDocId ? { ...user, role: newRole } : user
      ));
      toast.success("User role updated successfully!");
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update user role.");
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      handleSearch(newQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const handleObserver = useCallback((entries: { isIntersecting: any; }[]) => {
    if (entries[0].isIntersecting && hasMore && !isSearching && !loading) {
      fetchUsers(currentOffset + PAGE_SIZE, true);
    }
  }, [hasMore, isSearching, loading, currentOffset, fetchUsers]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, { threshold: 1 });
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [handleObserver]);

  return (
    <div className="max-w-5xl mx-auto h-full  mt-10 p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">User Account Management</h1>
      <div className="relative mb-6">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by name or email" value={searchQuery} onChange={handleSearchChange} className="pl-8" />
      </div>
      <Table className="w-full">
        <TableHeader className="bg-gray-100">
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.$id}>
              <TableCell>{user.displayName}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>
                <Select value={user.role} onValueChange={(role) => handleRoleChange(user.$id!, role as "user" | "admin")}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Change Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}        </TableBody>
      </Table>
      {!isSearching && <div ref={observerRef} className="h-10"></div>}
    </div>
  );
};

export default AdminAccountManagement;
