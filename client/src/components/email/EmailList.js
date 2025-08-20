"use client"
import React from "react";
import { EmailRow } from "./EmailRow";

export function EmailList({ emails, selectedIds, toggleSelect, openThread }) {
  if (!emails.length) {
    return <div className="p-4 text-center text-gray-500">No emails found.</div>;
  }

  return (
    <div className="overflow-auto flex-1">
      {emails.map((e) => (
        <EmailRow
          key={e.id}
          email={e}
          selected={selectedIds.has(e.id)}
          toggleSelect={toggleSelect}
          openThread={openThread}
        />
      ))}
    </div>
  );
}
