"use client"
import React, { useState, useEffect } from "react";
import { FilterBar } from "./FilterBar";
import { EmailList } from "./EmailList";
import { ThreadView } from "./ThreadView";
import { fetcher } from "../../lib/fetcher"; // or use native fetch
// you can import fallback to api base
// import api from "@/lib/api";

export default function InboxLayout() {
  const [filters, setFilters] = useState({
    account: "",
    status: ["unread"],
    recipient: "",
    search: "",
  });
  const [emails, setEmails] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [activeThread, setActiveThread] = useState(null);
  const [loading, setLoading] = useState(false);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  };

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const res = await fetcher("/api/email/list");
      setEmails(res.emails || []);
    } catch (e) {
      console.error("fetchEmails error", e);
    } finally {
      setLoading(false);
    }
  };

  const openThread = async (email) => {
    try {
      const url = new URL("/api/email/thread", window.location.origin);
      url.searchParams.set("userId", email.userId);
      url.searchParams.set("recipientEmail", email.recipientEmail);
      const res = await fetcher(url.toString());
      setActiveThread(res.thread || [email]);
    } catch (e) {
      console.error("openThread error", e);
      setActiveThread([email]);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, [filters]);

  return (
    <div className="flex min-h-full w-full">
      <div className="w-full md:w-[40%] border-r flex flex-col">
        <FilterBar
          filters={filters}
          setFilters={setFilters}
          onClear={() =>
            setFilters({ account: "", status: [], recipient: "", search: "" })
          }
        />
        {loading ? (
          <div className="p-4 text-center">Loading emails...</div>
        ) : (
          <EmailList
            emails={emails}
            selectedIds={selectedIds}
            toggleSelect={toggleSelect}
            openThread={openThread}
          />
        )}
        <div className="p-2 text-sm text-gray-600">
          Showing {emails.length} emails
        </div>
      </div>

      <div className="hidden md:flex flex-1">
        {activeThread ? (
          <ThreadView
            thread={activeThread}
            onClose={() => setActiveThread(null)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select an email to view thread
          </div>
        )}
      </div>
    </div>
  );
}
