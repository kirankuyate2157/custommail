"use client"
import React, { useState } from "react";

export default function ComposeEditor({ parentThread, onSend }) {
  const [body, setBody] = useState("");

  const handleSend = () => {
    if (onSend) {
      onSend({ body, parentThread });
    } else {
      console.log("Reply content:", body);
    }
    setBody("");
  };

  return (
    <div className="border rounded p-3">
      <div className="mb-2 font-semibold">Reply</div>
      <textarea
        rows={4}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Type your reply..."
        className="w-full border rounded p-2 resize-none"
      />
      <div className="flex justify-end mt-2">
        <button
          onClick={handleSend}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}
