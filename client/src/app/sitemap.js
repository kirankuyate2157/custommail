export default async function sitemap() {
  return [
    {
      url: "https://custommail.vercel.app/",
      lastModified: new Date(),
      changefreq: "weekly",
      priority: 1,
    },
    {
      url: "https://custommail.vercel.app/templates",
      lastModified: new Date(),
      changefreq: "monthly",
      priority: 0.8,
    },
    {
      url: "https://custommail.vercel.app/contacts",
      lastModified: new Date(),
      changefreq: "monthly",
      priority: 0.6,
    },
  ];
}
