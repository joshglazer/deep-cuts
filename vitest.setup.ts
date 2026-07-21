import "@testing-library/jest-dom/vitest";

// Several modules format/compare dates without an explicit timezone
// (formatDate, statsData's day-key math); pin the test runner to UTC so
// those assertions don't depend on the machine running them.
process.env.TZ = "UTC";
