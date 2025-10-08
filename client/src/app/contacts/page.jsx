// app/contacts/page.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "sonner";
import {
  FiSearch,
  FiUploadCloud,
  FiPlus,
  FiEdit2,
  FiTrash2,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { z } from "zod";
import { ClipboardEdit, Trash } from "lucide-react";

/* -------------------------
  Client-side helpers & validators
   ------------------------- */
const PAGE_SIZE = 10;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Zod for client validation mirror (lightweight)
const ContactZ = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  pronoun: z.string().optional(),
  company: z.string().optional(),
  roles: z.string().optional(),
  notes: z.string().optional(),
  phone: z.string().optional(),
  status: z.string().optional(),
});

function fmtDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

/* -------------------------
  Contacts Page component
   ------------------------- */
export default function ContactsPage() {
  // listing
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Add contact modal
  const [openAdd, setOpenAdd] = useState(false);
  const [form, setForm] = useState({
    email: "",
    pronoun: "",
    name: "",
    company: "",
    roles: "",
    notes: "",
    phone: "",
    status: "new",
  });
  const [formErrors, setFormErrors] = useState({});
  // under CSV upload state
  const [editingRow, setEditingRow] = useState(null); // index of row being edited

  // CSV upload state
  const fileRef = useRef(null);
  const [csvPreview, setCsvPreview] = useState(null); // { rows: [{row, valid, errors}], filename }
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  // reload helper
  const load = async ({ q: qArg = q, page: p = page } = {}) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/contacts?q=${encodeURIComponent(
          qArg || ""
        )}&page=${p}&pageSize=${PAGE_SIZE}`,
        { cache: "no-store" }
      );
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "Failed to load");
      setItems(json.data.items || []);
      setTotal(json.data.total || 0);
      setPage(json.data.page || p);
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to load contacts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load({ page: 1 });
    // eslint-disable-next-line
  }, []);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => load({ q, page: 1 }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [q]);

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(total / PAGE_SIZE)),
    [total]
  );

  /* -------------------------
    Add contact logic
     ------------------------- */
  const validateForm = () => {
    const out = {};
    try {
      ContactZ.parse(form);
      return {}; // no errors
    } catch (e) {
      for (const issue of e.errors || []) {
        out[issue.path.join(".")] = issue.message;
      }
      return out;
    }
  };

  const submitAdd = async () => {
    const errs = validateForm();
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error("Fix the form errors");
      return;
    }
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "Create failed");
      toast.success("Contact added");
      setOpenAdd(false);
      setForm({
        email: "",
        pronoun: "",
        name: "",
        company: "",
        roles: "",
        notes: "",
        phone: "",
        status: "new",
      });
      load({ page: 1 });
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Create failed");
    }
  };

  /* -------------------------
    CSV parsing & preview (client side)
    - Accepts simple CSV with header row that includes: email,name,pronoun,company,roles,notes,phone,status
    - tolerant parsing: split lines, split by comma, trims, supports quoted values
     ------------------------- */

  const parseCSV = (text) => {
    // simple CSV parse: split lines, handle quoted cells (basic)
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return { error: "Empty CSV" };
    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const expected = ["email", "name"];
    // header must include email and name at least
    if (!header.includes("email") || !header.includes("name")) {
      return {
        error: "CSV must include at least 'email' and 'name' columns in header",
      };
    }
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // CSV cell handling basic: split by comma, but respect quoted values
      const cells = [];
      let cur = "";
      let inQuote = false;
      for (let chIndex = 0; chIndex < line.length; chIndex++) {
        const ch = line[chIndex];
        if (ch === '"' || ch === "'") {
          inQuote = !inQuote;
          continue;
        }
        if (ch === "," && !inQuote) {
          cells.push(cur.trim());
          cur = "";
          continue;
        }
        cur += ch;
      }
      if (cur.length) cells.push(cur.trim());
      // map to header
      const obj = {};
      for (let j = 0; j < header.length; j++) {
        obj[header[j]] = (cells[j] || "").trim();
      }
      // validation per row
      const rowErrors = [];
      if (!obj.email || !emailRegex.test(obj.email))
        rowErrors.push("Invalid email");
      if (!obj.name) rowErrors.push("Missing name");
      rows.push({ row: obj, valid: rowErrors.length === 0, errors: rowErrors });
    }
    return { header, rows };
  };

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const parsed = parseCSV(text);
      if (parsed.error) {
        toast.error(parsed.error);
        return;
      }
      setCsvPreview({
        filename: file.name,
        header: parsed.header,
        rows: parsed.rows,
      });
    };
    reader.readAsText(file);
  };

  const onPickCsv = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    handleFile(f);
    e.target.value = "";
  };

  // import only valid rows
  const importCsv = async () => {
    if (!csvPreview || !csvPreview.rows?.length) {
      toast.error("No CSV preview available");
      return;
    }
    const validRows = csvPreview.rows.filter((r) => r.valid).map((r) => r.row);
    if (validRows.length === 0) {
      toast.error("No valid rows to import");
      return;
    }
    setImporting(true);
    setProgress(0);
    try {
      // simulate upload progress
      const total = validRows.length;
      const chunk = Math.max(1, Math.floor(total / 10));
      // call bulk API
      console.log("total row starting .. ");
      const res = await fetch("/api/contacts/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON?.stringify({ rows: validRows }),
      });
      const json = await res?.json();
      console.log("uploaded : ..", json);
      if (!json?.ok) throw new Error(json.message || "Bulk import failed");

      // simulate progress visually
      let p = 0;
      while (p < 100) {
        p += Math.random() * 25;
        setProgress(Math.min(100, Math.round(p)));
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 130));
      }
      setProgress(100);
      toast.success(
        `Imported ${json?.data?.inserted?.length} rows, skipped ${json?.data?.skipped?.length}`
      );
      setCsvPreview(null);
      load({ page: 1 });
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Import failed");
    } finally {
      setImporting(false);
      setTimeout(() => setProgress(0), 600);
    }
  };

  // delete contact
  const deleteContact = async (id) => {
    if (!confirm("Delete contact? This cannot be undone in the dummy DB."))
      return;
    try {
      const res = await fetch(`/api/contacts?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "Delete failed");
      toast.success("Deleted");
      load({ page: 1 });
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Delete failed");
    }
  };

  return (
    <div className='min-h-screen p-6 bg-background text-foreground'>
      <Toaster richColors position='top-right' />

      <div className='max-w-7xl mx-auto space-y-6'>
        <div className='flex items-start justify-between gap-4'>
          <div className='flex items-center gap-3 w-[32%] '>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder='Search contacts (mail, name, company, role)...'
            />
          </div>

          <div className='flex items-center gap-2'>
            <label className='inline-flex items-center gap-2 cursor-pointer'>
              <input
                ref={fileRef}
                type='file'
                accept='.csv,text/csv'
                className='hidden'
                onChange={onPickCsv}
              />
              <Button
                onClick={() => fileRef.current?.click()}
                size='sm'
                variant='outline'
              >
                <FiUploadCloud /> Upload CSV
              </Button>
            </label>

            <Button size='sm' onClick={() => setOpenAdd(true)}>
              <FiPlus /> New
            </Button>
          </div>
        </div>
        <Card className={"py-2 rounded-md border-none shadow-none"}>
          <CardContent className='p-0'>
            <Table>
              <TableHeader>
                <TableRow className={"bg-muted"}>
                  <TableHead>MailID</TableHead>
                  <TableHead>Pronoun</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className='text-center text-muted-foreground'
                    >
                      Loading contacts…
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className='text-center text-muted-foreground'
                    >
                      No contacts. Add one or upload CSV.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <a
                          href={`mailto:${c.email}`}
                          className='text-blue-500 hover:underline break-words'
                        >
                          {c.email}
                        </a>
                      </TableCell>
                      <TableCell>{c.pronoun}</TableCell>
                      <TableCell>{c.name}</TableCell>
                      <TableCell>{c.company}</TableCell>
                      <TableCell>{c.roles}</TableCell>
                      <TableCell className='max-w-[200px] truncate'>
                        {c.notes}
                      </TableCell>
                      <TableCell>{c.phone}</TableCell>
                      <TableCell>{c.status}</TableCell>
                      <TableCell className='text-right space-x-2'>
                        <Button
                          size='icon'
                          variant='ghost'
                          className='hover:bg-muted'
                          title='Edit'
                          onClick={() => console.log("edit", c.id)}
                        >
                          <FiEdit2 className='w-4 h-4' />
                        </Button>
                        <Button
                          size='icon'
                          variant='ghost'
                          className='hover:bg-destructive/10'
                          title='Delete'
                          onClick={() => deleteContact(c.id)}
                        >
                          <FiTrash2 className='w-4 h-4 text-red-500' />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* pagination */}

            <div className='px-4 py-3 border-t flex items-center justify-between'>
              <div className='text-sm text-muted-foreground'>
                Page {page} of {pageCount}
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  size='sm'
                  disabled={page <= 1}
                  onClick={() => {
                    if (page > 1) setPage((p) => p - 1);
                  }}
                >
                  Prev
                </Button>
                <Button
                  size='sm'
                  disabled={page >= pageCount}
                  onClick={() => {
                    if (page < pageCount) setPage((p) => p + 1);
                  }}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* CSV preview panel */}
        {/* <AnimatePresence>
          {csvPreview && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className='bg-muted p-4 rounded'
            >
              <div className='flex items-center justify-between mb-2'>
                <div className='text-sm font-medium'>
                  CSV Preview — {csvPreview.filename}
                </div>
                <div className='flex items-center gap-2'>
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() => setCsvPreview(null)}
                  >
                    Cancel
                  </Button>
                  <Button size='sm' onClick={importCsv} disabled={importing}>
                    {importing
                      ? `Importing (${progress}%)`
                      : "Import valid rows"}
                  </Button>
                </div>
              </div>

              <div className='overflow-auto max-h-60 border rounded p-2'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='text-left border-b'>
                      {csvPreview.header.map((h) => (
                        <th key={h} className='py-2 pr-4'>
                          {h}
                        </th>
                      ))}
                      <th className='py-2 pr-4'>valid</th>
                      <th className='py-2 pr-4'>issues</th>
                    </tr>
                  </thead>
                  <tbody>
                    // {csvPreview.rows.map((r, idx) => (
                    //   <tr
                    //     key={idx}
                    //     className={`border-b ${r.valid ? "" : "bg-red-50"}`}
                    //   >
                    //     {/* {csvPreview.header.map((h) => (
                    //       <td
                    //         key={h}
                    //         className='py-2 pr-4 max-w-[18ch] truncate'
                    //       >
                    //         {r.row[h] ?? ""}
                    //       </td>
                    //     ))} *
                        {csvPreview.header.map((h) => (
                          <td
                            key={h}
                            className='py-2 pr-4 max-w-[18ch] truncate'
                          >
                            {editingRow === idx ? (
                              <Input
                                className='h-7 text-xs'
                                value={r.row[h] || ""}
                                onChange={(e) => {
                                  const newRows = [...csvPreview.rows];
                                  newRows[idx].row[h] = e.target.value;
                                  // revalidate this row
                                  const errs = [];
                                  if (
                                    !newRows[idx].row.email ||
                                    !emailRegex.test(newRows[idx].row.email)
                                  )
                                    errs.push("Invalid email");
                                  if (!newRows[idx].row.name)
                                    errs.push("Missing name");
                                  newRows[idx].valid = errs.length === 0;
                                  newRows[idx].errors = errs;
                                  setCsvPreview({
                                    ...csvPreview,
                                    rows: newRows,
                                  });
                                }}
                              />
                            ) : (
                              r.row[h] ?? ""
                            )}
                          </td>
                        ))}
                       
                        <td className='py-2 pr-4 text-right'>
                          {editingRow === idx ? (
                            <Button
                              size='sm'
                              variant='ghost'
                              onClick={() => setEditingRow(null)}
                            >
                              Done
                            </Button>
                          ) : (
                            <Button
                              size='sm'
                              variant='ghost'
                              onClick={() => setEditingRow(idx)}
                            >
                              <ClipboardEdit />
                            </Button>
                          )}
                        </td>
                        <td className='py-2 pr-4 text-xs text-red-600'>
                          {r.errors.join("; ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {importing && (
                <div className='mt-2'>
                  <div className='w-full bg-muted rounded h-2 overflow-hidden'>
                    <div
                      style={{ width: `${progress}%` }}
                      className='h-full bg-primary transition-all'
                    />
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence> */}
      </div>
      <Dialog
        open={!!csvPreview}
        onOpenChange={(open) => !open && setCsvPreview(null)}
      >
        <DialogContent className='max-w-screen min-w-[80vw] h-[80vh]  p-0 flex flex-col'>
          <DialogHeader className='px-6 py-4 border-b'>
            <DialogTitle>CSV Preview — {csvPreview?.filename}</DialogTitle>
            <DialogDescription>
              Review, edit, or remove invalid rows before importing.
            </DialogDescription>
          </DialogHeader>

          <div className='flex-1 overflow-auto px-4'>
            <table className='w-full text-sm border'>
              <thead className='bg-muted/50'>
                <tr className='text-left border-b overflow-auto'>
                  {csvPreview?.header.map((h) => (
                    <th key={h} className='py-2 px-3'>
                      {h}
                    </th>
                  ))}
                  <th className='py-2 px-3'>Valid</th>
                  <th className='py-2 px-3'>Issues</th>
                  <th className='py-2 px-3 text-right'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {csvPreview?.rows.map((r, idx) => (
                  <tr
                    key={idx}
                    className={`border-b ${r.valid ? "" : "bg-red-50"}`}
                  >
                    {csvPreview.header.map((h) => (
                      <td key={h} className='py-2 px-3 max-w-[20ch] truncate'>
                        {editingRow === idx ? (
                          <Input
                            className='h-7 text-xs'
                            value={r.row[h] || ""}
                            onChange={(e) => {
                              const newRows = [...csvPreview.rows];
                              newRows[idx].row[h] = e.target.value;

                              // simple revalidate
                              const errs = [];
                              if (
                                !newRows[idx].row.email ||
                                !emailRegex.test(newRows[idx].row.email)
                              )
                                errs.push("Invalid email");
                              if (!newRows[idx].row.name)
                                errs.push("Missing name");

                              newRows[idx].valid = errs.length === 0;
                              newRows[idx].errors = errs;

                              setCsvPreview({ ...csvPreview, rows: newRows });
                            }}
                          />
                        ) : (
                          r.row[h] ?? ""
                        )}
                      </td>
                    ))}
                    <td className='py-2 px-3'>{r.valid ? "✅" : "❌"}</td>
                    <td className='py-2 px-3 text-xs text-red-600'>
                      {r.errors.join("; ")}
                    </td>
                    <td className='py-2 px-3 text-right'>
                      {editingRow === idx ? (
                        <Button
                          size='sm'
                          variant='ghost'
                          onClick={() => setEditingRow(null)}
                        >
                          Done
                        </Button>
                      ) : (
                        <Button
                          size='sm'
                          variant='ghost'
                          onClick={() => setEditingRow(idx)}
                        >
                          <ClipboardEdit className='w-4 h-4' />
                        </Button>
                      )}
                      <Button
                        variant='ghost'
                        size='sm'
                        className={"text-destructive"}
                        onClick={() =>
                          setCsvPreview((prev) => ({
                            ...prev,
                            rows: prev.rows.filter((_, i) => i !== idx),
                          }))
                        }
                      >
                        <Trash className='w-4 h-4' />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className='px-6 py-3 border-t flex justify-end gap-2'>
            <Button variant='outline' onClick={() => setCsvPreview(null)}>
              Cancel
            </Button>
            <Button onClick={importCsv} disabled={importing}>
              {importing ? `Importing (${progress}%)` : "Import valid rows"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Contact Dialog */}
      <Dialog open={openAdd} onOpenChange={setOpenAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Contact</DialogTitle>
          </DialogHeader>

          <div className='space-y-3'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
              <div>
                <label className='text-xs'>Email</label>
                <Input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder='email@example.com'
                />
                {formErrors.email && (
                  <div className='text-xs text-red-600'>{formErrors.email}</div>
                )}
              </div>
              <div>
                <label className='text-xs'>Name</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder='Full name'
                />
                {formErrors.name && (
                  <div className='text-xs text-red-600'>{formErrors.name}</div>
                )}
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-2'>
              <Input
                placeholder='Pronoun (Sir / Mam)'
                value={form.pronoun}
                onChange={(e) => setForm({ ...form, pronoun: e.target.value })}
              />
              <Input
                placeholder='Company'
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
              <Input
                placeholder='Role(s)'
                value={form.roles}
                onChange={(e) => setForm({ ...form, roles: e.target.value })}
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
              <Input
                placeholder='Phone'
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <Input
                placeholder='Status'
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              />
            </div>

            <div>
              <label className='text-xs'>Notes</label>
              <textarea
                className='w-full border rounded px-2 py-1 min-h-[80px]'
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              ></textarea>
            </div>

            <div className='flex justify-end gap-2'>
              <Button variant='outline' onClick={() => setOpenAdd(false)}>
                Cancel
              </Button>
              <Button onClick={submitAdd}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
