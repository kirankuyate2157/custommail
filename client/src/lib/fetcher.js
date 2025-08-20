export async function fetcher(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    cache: "no-store", // adjust per needs
  });
  if (!res.ok) throw new Error("Fetch error");
  return res.json();
}
