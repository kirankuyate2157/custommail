// db/
// │── index.js               # Central connection manager (Mongo + SQL)
// │
// ├── mongo/
// │   ├── schemas/           # MongoDB schemas (Mongoose models)
// │   │   └── userSchema.js
// │   │   └── emailSchema.js
// │   │   └── ...
// │   │
// │   ├── queries/           # MongoDB query functions
// │   │   └── userQueries.js
// │   │   └── emailQueries.js
// │   │   └── ...
// │   │
// │   └── index.js           # Loads schemas + queries, exports Mongo interface
// │
// ├── sql/
// │   ├── schemas/           # SQL schema definitions (raw CREATE TABLE scripts or builders)
// │   │   └── userSchema.sql
// │   │   └── emailSchema.sql
// │   │   └── ... 
// │   │
// │   ├── queries/           # SQL query functions (raw SQL strings inside JS)
// │   │   └── userQueries.js
// │   │   └── emailQueries.js
// │   │   └── ...
// │   │
// │   └── index.js           # Loads queries, exports SQL interface
// │
// └── utils/
//     └── format.js          # Common helpers (formatting input/output, mapping, etc.)
