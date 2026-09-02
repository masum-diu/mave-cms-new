// pages/form-responses/index.jsx

import React, { useEffect, useMemo, useState } from "react";
import { Spin, Alert, Button, Input } from "antd";
import {
  TableOutlined,
  AppstoreOutlined,
  SearchOutlined,
  InboxOutlined,
  CalendarOutlined,
  FormOutlined,
  ReloadOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
} from "@ant-design/icons";
import moment from "moment";
import FormResponsesTable from "../../../components/FormResponses/FormResponsesTable";
import FormResponsesGrid from "../../../components/FormResponses/FormResponsesGrid";
import instance from "../../../axios";
import { useAuth } from "../../../src/context/AuthContext";

const StatCard = ({ icon, label, value, bg, text }) => (
  <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl"
      style={{ backgroundColor: bg, color: text }}
    >
      {icon}
    </div>
    <div>
      <div className="text-2xl font-bold text-gray-800 leading-none">{value}</div>
      <div className="text-xs font-medium text-gray-400 mt-1">{label}</div>
    </div>
  </div>
);

const FormResponsesIndexPage = () => {
  const { user: currentUser } = useAuth();
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // 'table' or 'grid'
  const [query, setQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("desc"); // 'desc' = newest first, 'asc' = oldest first

  // Function to fetch all form responses
  const fetchResponses = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await instance.get(`/form-submission`);
      if (response.status === 200) {
        // Ensure that form_data is an object; if not, handle accordingly
        const sanitizedData = response.data.map((item) => ({
          ...item,
          form_data:
            item.form_data && typeof item.form_data === "object"
              ? item.form_data
              : {},
        }));
        setResponses(sanitizedData);
      } else {
        setError("Failed to fetch form responses.");
      }
    } catch (err) {
      console.error("Error fetching form responses:", err);
      setError("An error occurred while fetching form responses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResponses();
  }, []);

  const filteredResponses = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? responses.filter((r) => {
          if (String(r.id).includes(q)) return true;
          if (r.form_type?.toLowerCase().includes(q)) return true;
          return JSON.stringify(r.form_data || {}).toLowerCase().includes(q);
        })
      : responses;

    return [...base].sort((a, b) => {
      const diff = moment(a.created_at).valueOf() - moment(b.created_at).valueOf();
      return sortOrder === "asc" ? diff : -diff;
    });
  }, [responses, query, sortOrder]);

  const stats = useMemo(() => {
    const todayCount = responses.filter((r) =>
      moment(r.created_at).isSame(moment(), "day")
    ).length;
    const uniqueForms = new Set(responses.map((r) => r.form_id)).size;
    return { total: responses.length, today: todayCount, forms: uniqueForms };
  }, [responses]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert message="Error" description={error} type="error" showIcon />
      </div>
    );
  }

  return (
    <div className="mavecontainer p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 my-6">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl text-xl"
            style={{ backgroundColor: "#fef3c7", color: "#b45309" }}
          >
            <InboxOutlined />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 leading-none">
              Form Responses
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Everything submitted through your published forms
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            shape="round"
            icon={
              viewMode === "table" ? <AppstoreOutlined /> : <TableOutlined />
            }
            onClick={() =>
              setViewMode((prev) => (prev === "table" ? "grid" : "table"))
            }
          >
            {viewMode === "table" ? "Grid View" : "List View"}
          </Button>
          <Button
            shape="round"
            icon={<ReloadOutlined />}
            onClick={fetchResponses}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          icon={<InboxOutlined />}
          label="Total Responses"
          value={stats.total}
          bg="#fef3c7"
          text="#b45309"
        />
        <StatCard
          icon={<CalendarOutlined />}
          label="Submitted Today"
          value={stats.today}
          bg="#dcfce7"
          text="#15803d"
        />
        <StatCard
          icon={<FormOutlined />}
          label="Forms Represented"
          value={stats.forms}
          bg="#dbeafe"
          text="#1d4ed8"
        />
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-6">
        <Input
          allowClear
          size="large"
          placeholder="Search by ID, type, or field value..."
          prefix={<SearchOutlined className="text-gray-300 mr-1" />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ borderRadius: 999, maxWidth: 480 }}
        />
        <Button
          shape="round"
          size="large"
          icon={
            sortOrder === "desc" ? (
              <SortDescendingOutlined />
            ) : (
              <SortAscendingOutlined />
            )
          }
          onClick={() =>
            setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))
          }
        >
          {sortOrder === "desc" ? "Newest First" : "Oldest First"}
        </Button>
      </div>

      {filteredResponses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <InboxOutlined style={{ fontSize: 40 }} />
          <p className="mt-3">No responses match your search.</p>
        </div>
      ) : viewMode === "table" ? (
        <FormResponsesTable
          responses={filteredResponses}
          refreshData={fetchResponses}
          currentUser={currentUser}
        />
      ) : (
        <FormResponsesGrid
          responses={filteredResponses}
          refreshData={fetchResponses}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default FormResponsesIndexPage;
