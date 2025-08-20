"use client"
import React from "react";

export function EmailRow({ email, selected, toggleSelect, openThread }) {
  return (
    <div
      className={`flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b ${
        email.status === "draft" ? "opacity-80" : ""
      }`}
      onClick={() => openThread(email)}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={(e) => {
          e.stopPropagation();
          toggleSelect(email.id);
        }}
        aria-label="Select email"
      />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between">
          <div className="truncate">
            <div className={`font-medium ${email.status === "unread" ? "text-black" : "text-gray-700"}`}>
              {email.subject || "(no subject)"}
            </div>
            <div className="text-sm text-gray-500 truncate">
              {email.recipientEmail} ·{" "}
              {email.bodyText
                ? email.bodyText.slice(0, 60)
                : email.bodyHtml
                ? email.bodyHtml.replace(/<[^>]+>/g, "").slice(0, 60)
                : ""}
            </div>
          </div>
          <div className="text-xs text-gray-500 whitespace-nowrap flex flex-col items-end">
            <div>{new Date(email.createdAt).toLocaleDateString()}</div>
            <div className="mt-1">
              <span
                className={`inline-block px-2 py-0.5 rounded text-[10px] ${
                  email.status === "unread"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {email.status}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
