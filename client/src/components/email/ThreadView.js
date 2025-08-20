"use client"
import React from "react";
import ComposeEditor from "./ComposeEditor";

export function ThreadView({ thread, onClose }) {
  if (!thread || !thread.length) return null;
  const first = thread[0];
  return (
    <div className="flex-1 flex flex-col border-l">
      <div className="px-4 py-2 border-b flex justify-between items-center">
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="text-sm">
            ← Back
          </button>
          <div>
            <div className="font-semibold">Thread with {first.recipientEmail}</div>
            <div className="text-xs text-gray-500">Subject: {first.subject}</div>
          </div>
        </div>
        <div className="text-sm text-gray-600">Status: {first.status}</div>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {thread.map((email) => (
          <div key={email.id} className="bg-white p-4 rounded shadow-sm">
            <div className="text-xs text-gray-500 mb-1">
              {new Date(email.createdAt).toLocaleString()} — {email.status}
            </div>
            <div
              className="prose"
              dangerouslySetInnerHTML={{
                __html: email.bodyHtml || email.bodyText || "",
              }}
            />
          </div>
        ))}

        <div className="mt-4">
          <ComposeEditor parentThread={thread} />
        </div>
      </div>
    </div>
  );
}
