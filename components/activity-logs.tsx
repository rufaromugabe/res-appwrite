"use client";

import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Input } from "./ui/input";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useAuthContext } from "@/hooks/useAuthContext";

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
  const { user } = useAuthContext();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateRange, setDateRange] = useState<{ startDate: Date | null; endDate: Date | null }>({ startDate: null, endDate: null });

  // TODO: Implement activity logging with Appwrite
  // For now, show empty state with explanation
  useEffect(() => {
    // Temporary empty logs for demonstration
    setLogs([]);
    setLoading(false);
  }, []);

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
    <div className="max-w-5xl mx-auto h-full bg-gray-50 p-8 rounded-lg shadow-md">
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
      {/* <div ref={observerRef} className="h-10"></div> */}
    </div>
  );
};

export default Logs;
