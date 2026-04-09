import { db } from "@/lib/db";
import { sessions, users, reports } from "@/lib/db/schema";
import { beforeEach, afterAll } from "vitest";

// Clean up test database before each test suite
beforeEach(async () => {
  await db.delete(reports);
  await db.delete(sessions);
  await db.delete(users);
});

afterAll(async () => {
  await db.delete(reports);
  await db.delete(sessions);
  await db.delete(users);
});
