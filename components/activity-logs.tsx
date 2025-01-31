"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Input } from "./ui/input";
import { collection, getDocs, query, orderBy, getFirestore, startAfter, limit, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const PAGE_SIZE = 10; // Number of logs to fetch per page

const Skeleton = ({ rows = 5, columns = 6 }) => (
  <div className="animate-pulse">
    {[...Array(rows)].map((_, rowIndex) => (
      <div key={rowIndex} className="flex items-center gap-4 mb-4">
        {[...Array(columns)].map((_, colIndex) => (
          <div key={colIndex} className="h-5 bg-gray-300 rounded-md" style={{ flex: 1, margin: "0 4px" }}></div>
        ))}
      </div>
    ))}
  </div>
);

const Logs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateRange, setDateRange] = useState<{ startDate: Date | null; endDate: Date | null }>({ startDate: null, endDate: null });
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  
  const db = getFirestore();
  const observerRef = useRef(null);

  const fetchLogs = useCallback(async (paginate = false) => {
    if (!hasMore && paginate) return;
    setLoading(true);
    try {
      let logsQuery = query(
        collection(db, "ActivityLogs"),
        orderBy("timestamp", "desc"),
        lastDoc ? startAfter(lastDoc) : limit(PAGE_SIZE)
      );
      
      const querySnapshot = await getDocs(logsQuery);
      const logsData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      
      if (paginate) {
        setLogs((prevLogs) => [...prevLogs, ...logsData]);
      } else {
        setLogs(logsData);
      }
      
      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1] || null);
      setHasMore(querySnapshot.docs.length === PAGE_SIZE);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  }, [db, lastDoc, hasMore]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleObserver = useCallback((entries: any[]) => {
    const target = entries[0];
    if (target.isIntersecting) {
      fetchLogs(true);
    }
  }, [fetchLogs]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, { threshold: 1 });
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [handleObserver]);

  const filteredLogs = logs.filter((log) => {
    const matchesQuery =
      searchQuery === "" ||
      log.adminEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.activity?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.regNumber?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDateRange =
      (!dateRange.startDate || new Date(log.timestamp) >= dateRange.startDate) &&
      (!dateRange.endDate || new Date(log.timestamp) <= dateRange.endDate);

    return matchesQuery && matchesDateRange;
  });

  return (
    <div className="max-w-6xl mx-auto h-full bg-gray-50 p-8 rounded-lg shadow-md">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Activity Logs</h2>

      <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm">
        <Input
          className="border border-gray-300 rounded-md px-4 py-2 text-gray-700"
          placeholder="Search by admin email, activity, or registration number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="flex flex-col sm:flex-row gap-4 sm:ml-4 mt-4 sm:mt-0">
          <DatePicker selected={dateRange.startDate} onChange={(date) => setDateRange((prev) => ({ ...prev, startDate: date }))} placeholderText="Start Date" className="border border-gray-300 rounded-md px-4 py-2 text-gray-700" />
          <DatePicker selected={dateRange.endDate} onChange={(date) => setDateRange((prev) => ({ ...prev, endDate: date }))} placeholderText="End Date" className="border border-gray-300 rounded-md px-4 py-2 text-gray-700" />
        </div>
      </div>

      {loading && logs.length === 0 ? (
        <Skeleton rows={5} columns={6} />
      ) : filteredLogs.length === 0 ? (
        <div className="text-center text-gray-500">No logs found for the selected criteria.</div>
      ) : (
        <Table className="w-full border-collapse bg-white rounded-lg shadow-md">
          <TableHeader className="bg-gray-200">
            <TableRow>
              <TableHead>Admin Email</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead>Reg Number</TableHead>
              <TableHead>Old Status</TableHead>
              <TableHead>New Status</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{log.adminEmail}</TableCell>
                <TableCell>{log.activity}</TableCell>
                <TableCell>{log.regNumber}</TableCell>
                <TableCell>{log.oldStatus}</TableCell>
                <TableCell>{log.newStatus}</TableCell>
                <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <div ref={observerRef} className="h-10"></div>
    </div>
  );
};

export default Logs;
