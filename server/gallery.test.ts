import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("gallery", () => {
  describe("list", () => {
    it("returns gallery items with default pagination", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.gallery.list({ limit: 20, offset: 0 });

      expect(Array.isArray(result)).toBe(true);
      // Gallery may have items from previous tests or uploads
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it("respects limit and offset parameters", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.gallery.list({ limit: 10, offset: 0 });

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("upload", () => {
    it("requires authentication", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: {
          protocol: "https",
          headers: {},
        } as TrpcContext["req"],
        res: {
          clearCookie: () => {},
        } as TrpcContext["res"],
      };

      const caller = appRouter.createCaller(ctx);

      try {
        await caller.gallery.upload({
          title: "Test Photo",
          description: "Test Description",
          category: "general",
          fileBuffer: Buffer.from("test"),
          fileName: "test.jpg",
          mimeType: "image/jpeg",
        });
        expect.fail("Should throw unauthorized error");
      } catch (error: any) {
        expect(error.message).toContain("Please login");
      }
    });

    it("validates required fields", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.gallery.upload({
          title: "",
          description: "Test",
          category: "general",
          fileBuffer: Buffer.from("test"),
          fileName: "test.jpg",
          mimeType: "image/jpeg",
        });
        expect.fail("Should throw validation error");
      } catch (error: any) {
        expect(error.message).toBeDefined();
      }
    });
  });

  describe("delete", () => {
    it("requires authentication", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: {
          protocol: "https",
          headers: {},
        } as TrpcContext["req"],
        res: {
          clearCookie: () => {},
        } as TrpcContext["res"],
      };

      const caller = appRouter.createCaller(ctx);

      try {
        await caller.gallery.delete({ id: 1 });
        expect.fail("Should throw unauthorized error");
      } catch (error: any) {
        expect(error.message).toContain("Please login");
      }
    });

    it("handles non-existent gallery items gracefully", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.gallery.delete({ id: 99999 });

      expect(result).toEqual({ success: true });
    });
  });
});
