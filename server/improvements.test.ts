import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): { ctx: TrpcContext; clearedCookies: any[] } {
  const clearedCookies: any[] = [];

  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: userId === 1 ? "admin" : "user",
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
      clearCookie: (name: string, options: any) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

describe("Menu Management", () => {
  it("should list menu items", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const items = await caller.menu.list({ category: undefined });
    expect(Array.isArray(items)).toBe(true);
  });

  it("should create a menu item", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const item = await caller.menu.create({
      name: "Test Coffee",
      category: "coffee",
      price: 350,
      description: "A delicious test coffee",
    });

    expect(item).toBeDefined();
    expect(item?.name).toBe("Test Coffee");
    expect(item?.price).toBe(350);
  });
});

describe("Orders Management", () => {
  it("should create an order", async () => {
    const { ctx } = createAuthContext(2);
    const caller = appRouter.createCaller(ctx);

    const order = await caller.orders.create({
      items: JSON.stringify([{ id: 1, name: "Coffee", price: 350, quantity: 1 }]),
      totalPrice: 350,
      pickupTime: "14:30",
    });

    expect(order).toBeDefined();
    expect(order?.status).toBe("pending");
    expect(order?.totalPrice).toBe(350);
  });

  it("should get user orders", async () => {
    const { ctx } = createAuthContext(2);
    const caller = appRouter.createCaller(ctx);

    const orders = await caller.orders.userOrders();
    expect(Array.isArray(orders)).toBe(true);
  });

  it("should list all orders (admin only)", async () => {
    const { ctx } = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const orders = await caller.orders.list({ limit: 10, offset: 0 });
    expect(Array.isArray(orders)).toBe(true);
  });
});

describe("Reviews Management", () => {
  it("should create a review", async () => {
    const { ctx } = createAuthContext(2);
    const caller = appRouter.createCaller(ctx);

    const review = await caller.reviews.create({
      rating: 5,
      title: "Amazing Coffee!",
      comment: "Best coffee in town",
    });

    expect(review).toBeDefined();
    expect(review?.rating).toBe(5);
    expect(review?.title).toBe("Amazing Coffee!");
    expect(review?.status).toBe("pending");
  });

  it("should get approved reviews", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const reviews = await caller.reviews.list({ limit: 10 });
    expect(Array.isArray(reviews)).toBe(true);
  });

  it("should get pending reviews (admin only)", async () => {
    const { ctx } = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const reviews = await caller.reviews.pending();
    expect(Array.isArray(reviews)).toBe(true);
  });
});

describe("Loyalty Program", () => {
  it("should get or create loyalty card", async () => {
    const { ctx } = createAuthContext(3);
    const caller = appRouter.createCaller(ctx);

    const card = await caller.loyalty.get();
    expect(card).toBeDefined();
    expect(card?.stamps).toBeGreaterThanOrEqual(0);
    expect(card?.tier).toBe("bronze");
  });

  it("should add stamp to loyalty card", async () => {
    const { ctx } = createAuthContext(4);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.loyalty.addStamp();
    expect(result.success).toBe(true);
  });
});

describe("Newsletter Subscription", () => {
  it("should subscribe to newsletter", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const subscriber = await caller.newsletter.subscribe({
      email: "subscriber@example.com",
      name: "Test Subscriber",
    });

    expect(subscriber).toBeDefined();
    expect(subscriber?.email).toBe("subscriber@example.com");
    expect(subscriber?.subscribed).toBe(1);
  });
});

describe("Blog Management", () => {
  it("should list blog posts", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const posts = await caller.blog.list({ limit: 10, offset: 0 });
    expect(Array.isArray(posts)).toBe(true);
  });

  it("should create a blog post", async () => {
    const { ctx } = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const post = await caller.blog.create({
      title: "Coffee Brewing Tips",
      slug: "coffee-brewing-tips",
      content: "Here are some tips for brewing the perfect coffee...",
      excerpt: "Learn how to brew the perfect cup",
      category: "tips",
      tags: "coffee,brewing",
      published: 1,
    });

    expect(post).toBeDefined();
    expect(post?.title).toBe("Coffee Brewing Tips");
  });
});
