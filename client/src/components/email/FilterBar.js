"use client"
import React from "react";

export function FilterBar({ filters, setFilters, onClear }) {
  return (
    <div className="flex flex-wrap gap-2 items-center bg-white p-3 border-b">
      <input
        placeholder="Search subject or recipient"
        value={filters.search}
        onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
        className="border rounded px-2 py-1 flex-1 min-w-[140px]"
        aria-label="Search"
      />
      <select
        value={filters.status.join(",")}
        onChange={(e) =>
          setFilters((f) => ({
            ...f,
            status: e.target.value ? e.target.value.split(",") : [],
          }))
        }
        className="border rounded px-2 py-1"
        aria-label="Status"
      >
        <option value="unread">Unread</option>
        <option value="sent">Sent</option>
        <option value="draft">Draft</option>
        <option value="follow_up">Follow-up</option>
        <option value="failed">Failed</option>
      </select>
      <input
        placeholder="Recipient"
        value={filters.recipient}
        onChange={(e) => setFilters((f) => ({ ...f, recipient: e.target.value }))}
        className="border rounded px-2 py-1"
        aria-label="Recipient filter"
      />
      <button
        onClick={onClear}
        className="ml-auto text-sm text-blue-600 underline"
        aria-label="Clear filters"
      >
        Clear all
      </button>
    </div>
  );
}
