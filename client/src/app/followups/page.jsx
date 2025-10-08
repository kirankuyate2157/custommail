// app/follow-ups/page.jsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "sonner";
import {
  FiSearch,
  FiChevronDown,
  FiChevronUp,
  FiRefreshCw,
  FiArrowRight,
} from "react-icons/fi";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const PAGE_SIZE = 8;

// Format ISO -> readable
const fmtDate = (iso) => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
};

function StatusBadge({ status }) {
  if (status === "done")
    return (
      <span className='inline-block px-2 py-0.5 text-xs rounded bg-green-50 text-green-700'>
        done
      </span>
    );
  if (status === "failed")
    return (
      <span className='inline-block px-2 py-0.5 text-xs rounded bg-red-50 text-red-700'>
        failed
      </span>
    );
  return (
    <span className='inline-block px-2 py-0.5 text-xs rounded bg-gray-50 text-gray-700'>
      {status}
    </span>
  );
}

/**
 * Follow-ups page
 */
export default function FollowUpsPage() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all"); // all | failed
  const [page, setPage] = useState(1);

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [sending, setSending] = useState(false);

  // Load data (paginated)
  const load = async ({
    q: qArg = q,
    page: p = page,
    filter: f = filter,
  } = {}) => {
    setLoading(true);
    try {
      const url = `/api/followups?q=${encodeURIComponent(
        qArg || ""
      )}&page=${p}&pageSize=${PAGE_SIZE}&filter=${f}`;
      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json();
      if (!json.ok)
        throw new Error(json.message || "Failed to load follow-ups");
      setItems(json.data.items || []);
      setTotal(json.data.total || 0);
      setPage(json.data.page || p);
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to load follow-ups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // debounce search + reload when q or filter changes
  useEffect(() => {
    const t = setTimeout(() => load({ q, page: 1, filter }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, filter]);

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(total / PAGE_SIZE)),
    [total]
  );

  // Toggle expand only via icon to match your request
  const toggleExpand = (id) => setExpandedId((cur) => (cur === id ? null : id));

  // Resend (calls /api/followups/resend)
  const resend = async (followUpId, templateId) => {
    if (sending) return;
    setSending(true);
    toast.loading("Resending…", { id: "resend" });
    try {
      const res = await fetch("/api/followups/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followUpId, templateId }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "Resend failed");

      // Update single item from server response
      setItems((cur) =>
        cur.map((it) =>
          it.id === json.data.followUp.id ? json.data.followUp : it
        )
      );
      toast.success(json.data.simulated.isSuccess ? "Sent" : "Failed");
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Resend failed");
    } finally {
      setSending(false);
      toast.dismiss("resend");
    }
  };

  return (
    <div className='min-h-screen p-6 bg-background text-foreground'>
      <Toaster richColors position='top-right' />

      <div className='max-w-8xl mx-auto space-y-6'>
        {/* Title + controls */}
        <div className='flex flex-col w-full md:flex-row items-start md:items-center gap-3  justify-between'>
          <div className='relative flex w-[30%]'>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder='Search by email, name, company...'
              className='w-full pr-10'
              aria-label='Search follow-ups'
            />
            <div className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none'>
              <FiSearch />
            </div>
          </div>

          <div className='flex   gap-2 items-center'>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className='border rounded px-2 py-2 text-sm bg-background'
              aria-label='Filter follow-ups'
            >
              <option value='all'>All</option>
              <option value='failed'>Failed</option>
            </select>

            <Button
              onClick={() => load({})}
              size='sm'
              variant='outline'
              aria-label='Refresh list'
            >
              <FiRefreshCw />
            </Button>
          </div>
        </div>

        <Card className={"px-2 py-1 border-none rounded-md shadow-none"}>
          <CardContent className='p-0'>
            {/* table header (desktop) */}
            <div className='hidden md:grid grid-cols-12 gap-3 items-center px-4 py-3 border-b text-sm text-muted-foreground bg-muted/20'>
              <div className='col-span-3 font-medium'>MailID</div>
              <div className='col-span-1 font-medium'>Pronoun</div>
              <div className='col-span-2 font-medium'>Name</div>
              <div className='col-span-1 font-medium'>Company</div>
              <div className='col-span-1 text-center font-medium'>
                TotalSent
              </div>
              <div className='col-span-1 font-medium'>Last update</div>
              <div className='col-span-1 text-center font-medium'>Success</div>
              <div className='col-span-1 text-center font-medium'>Failed</div>
              <div className='col-span-1'> </div>
            </div>

            {/* rows */}
            <div className='divide-y'>
              {loading ? (
                <div className='p-6 text-sm text-muted-foreground'>
                  Loading…
                </div>
              ) : items.length === 0 ? (
                <div className='p-6 text-sm text-muted-foreground'>
                  No follow-ups found.
                </div>
              ) : (
                items.map((it) => (
                  <div
                    key={it.id}
                    className='py-3 px-4'
                    onClick={() => toggleExpand(it.id)}
                  >
                    {/* main row layout (grid on md, stacked for smaller) */}
                    <div className='md:grid grid-cols-12 gap-3 items-start'>
                      {/* MailID */}
                      <div className='col-span-3'>
                        <a
                          className='text-blue-500 hover:underline break-words'
                          href={`mailto:${it.email}`}
                        >
                          {it.email}
                        </a>
                      </div>

                      {/* pronoun */}
                      <div className='col-span-1 text-sm'>{it.pronoun}</div>

                      {/* name */}
                      <div className='col-span-2 text-sm'>{it.name}</div>

                      {/* company */}
                      <div className='col-span-1 text-sm'>{it.company}</div>

                      {/* totalSent */}
                      <div className='col-span-1 text-center'>
                        {it.totalSent}
                      </div>

                      {/* last update */}
                      <div className='col-span-1 text-sm'>
                        {fmtDate(it.lastUpdate)}
                      </div>

                      {/* success */}
                      <div className='col-span-1 text-center'>
                        <span className='inline-block px-2 py-0.5 text-sm text-green-700'>
                          {it.success ?? 0}
                        </span>
                      </div>

                      {/* failed */}
                      <div className='col-span-1 text-center'>
                        <span className='inline-block px-2 py-0.5 text-sm text-red-700'>
                          {it.failed ?? 0}
                        </span>
                      </div>
                      {/* expand toggle (icon only) */}
                      <div className='col-span-1 flex justify-center items-center'>
                        <button
                          aria-expanded={expandedId === it.id}
                          aria-controls={`followup-history-${it.id}`}
                          className='p-1 rounded hover:bg-muted'
                          title={
                            expandedId === it.id ? "Collapse" : "Expand history"
                          }
                        >
                          {expandedId === it.id ? (
                            <FiChevronUp />
                          ) : (
                            <FiChevronDown />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Inline expandable area containing a history table */}
                    <AnimatePresence initial={false}>
                      {expandedId === it.id && (
                        <motion.div
                          id={`followup-history-${it.id}`}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.24 }}
                          className='mt-3'
                        >
                          <div className='bg-muted p-3 rounded'>
                            {/* <div className="flex items-center justify-between mb-2">
                              <div className="text-xs font-semibold">History</div>
                              <div className="text-xs text-muted-foreground">{(it.history?.length || 0) + " entries"}</div>
                            </div> */}

                            {/* history table */}
                            <div className='overflow-x-auto'>
                              <table className='w-full text-sm'>
                                <thead>
                                  <tr className='text-left border-b'>
                                    <th className='py-2 pr-4'>Template ID</th>
                                    <th className='py-2 pr-4'>Title</th>
                                    <th className='py-2 pr-4'>Time</th>
                                    <th className='py-2 pr-4'>Status</th>
                                    <th className='py-2 pr-4 text-right'>
                                      Action
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {it.history && it.history.length > 0 ? (
                                    it.history.map((h) => (
                                      <tr
                                        key={h.id}
                                        className='border-b last:border-b-0'
                                      >
                                        <td className='py-3 pr-4 align-top'>
                                          {h.templateId}
                                        </td>
                                        <td className='py-3 pr-4 align-top max-w-[40ch] truncate'>
                                          {h.title}
                                        </td>
                                        <td className='py-3 pr-4 align-top'>
                                          {fmtDate(h.time)}
                                        </td>
                                        <td className='py-3 pr-4 align-top'>
                                          <StatusBadge status={h.status} />
                                        </td>
                                        <td className='py-3 pr-4 align-top text-right'>
                                          <button
                                            onClick={() =>
                                              resend(it.id, h.templateId)
                                            }
                                            className='inline-flex items-center gap-2 px-3 py-1 rounded border hover:bg-muted text-sm'
                                            aria-label={`Resend template ${h.templateId} to ${it.email}`}
                                          >
                                            <FiArrowRight />
                                          </button>
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td
                                        colSpan={5}
                                        className='py-4 text-sm text-muted-foreground'
                                      >
                                        No history found for this follow-up.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))
              )}
            </div>

            {/* footer / pagination */}
            {/* {page  pageCount && ( */}
              <div className='px-4 py-3 border-t flex items-center justify-between'>
                <div className='text-sm text-muted-foreground'>
                  Page {page} of {pageCount} — {total} total
                </div>
                <div className='flex items-center gap-2'>
                  <Button
                    size='sm'
                    onClick={() => {
                      if (page > 1) {
                        const next = page - 1;
                        setPage(next);
                        load({ page: next });
                      }
                    }}
                    disabled={page <= 1}
                  >
                    Prev
                  </Button>
                  <Button
                    size='sm'
                    onClick={() => {
                      if (page < pageCount) {
                        const next = page + 1;
                        setPage(next);
                        load({ page: next });
                      }
                    }}
                    disabled={page >= pageCount}
                  >
                    Next
                  </Button>
                </div>
              </div>
            {/* )} */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
