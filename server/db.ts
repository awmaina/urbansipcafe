import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, gallery, Gallery, InsertGallery, reservations, Reservation, InsertReservation, menuItems, MenuItem, InsertMenuItem, orders, Order, InsertOrder, reviews, Review, InsertReview, loyaltyCards, LoyaltyCard, InsertLoyaltyCard, blogPosts, BlogPost, InsertBlogPost, emailSubscribers, EmailSubscriber, InsertEmailSubscriber } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Gallery queries
export async function addGalleryItem(item: InsertGallery): Promise<Gallery | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot add gallery item: database not available");
    return null;
  }

  try {
    const result = await db.insert(gallery).values(item);
    const insertedId = (result as any).insertId;
    const inserted = await db.select().from(gallery).where(eq(gallery.id, insertedId)).limit(1);
    return inserted.length > 0 ? inserted[0] : null;
  } catch (error) {
    console.error("[Database] Failed to add gallery item:", error);
    throw error;
  }
}

export async function getGalleryItems(limit: number = 20, offset: number = 0): Promise<Gallery[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get gallery items: database not available");
    return [];
  }

  try {
    const items = await db
      .select()
      .from(gallery)
      .where(eq(gallery.isPublished, 1))
      .orderBy(desc(gallery.createdAt))
      .limit(limit)
      .offset(offset);
    return items;
  } catch (error) {
    console.error("[Database] Failed to get gallery items:", error);
    throw error;
  }
}

export async function deleteGalleryItem(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete gallery item: database not available");
    return false;
  }

  try {
    await db.delete(gallery).where(eq(gallery.id, id));
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete gallery item:", error);
    throw error;
  }
}

// Reservation queries
export async function createReservation(reservation: InsertReservation): Promise<Reservation | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create reservation: database not available");
    return null;
  }

  try {
    const result = await db.insert(reservations).values(reservation);
    const insertedId = (result as any).insertId;
    const inserted = await db.select().from(reservations).where(eq(reservations.id, insertedId)).limit(1);
    return inserted.length > 0 ? inserted[0] : null;
  } catch (error) {
    console.error("[Database] Failed to create reservation:", error);
    throw error;
  }
}

export async function getReservations(limit: number = 50, offset: number = 0): Promise<Reservation[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get reservations: database not available");
    return [];
  }

  try {
    const items = await db
      .select()
      .from(reservations)
      .orderBy(desc(reservations.createdAt))
      .limit(limit)
      .offset(offset);
    return items;
  } catch (error) {
    console.error("[Database] Failed to get reservations:", error);
    throw error;
  }
}

export async function updateReservationStatus(id: number, status: string): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update reservation: database not available");
    return false;
  }

  try {
    await db.update(reservations).set({ status: status as any }).where(eq(reservations.id, id));
    return true;
  } catch (error) {
    console.error("[Database] Failed to update reservation:", error);
    throw error;
  }
}


// Menu Items queries
export async function getMenuItems(category?: string): Promise<MenuItem[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get menu items: database not available");
    return [];
  }

  try {
    let query: any = db.select().from(menuItems).where(eq(menuItems.available, 1));
    if (category) {
      query = query.where(eq(menuItems.category, category as any));
    }
    const items = await query.orderBy(menuItems.name);
    return items;
  } catch (error) {
    console.error("[Database] Failed to get menu items:", error);
    throw error;
  }
}

export async function createMenuItem(item: InsertMenuItem): Promise<MenuItem | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create menu item: database not available");
    return null;
  }

  try {
    const result = await db.insert(menuItems).values(item);
    const insertedId = (result as any).insertId;
    const inserted = await db.select().from(menuItems).where(eq(menuItems.id, insertedId)).limit(1);
    return inserted.length > 0 ? inserted[0] : null;
  } catch (error) {
    console.error("[Database] Failed to create menu item:", error);
    throw error;
  }
}

export async function updateMenuItem(id: number, item: Partial<InsertMenuItem>): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update menu item: database not available");
    return false;
  }

  try {
    await db.update(menuItems).set(item).where(eq(menuItems.id, id));
    return true;
  } catch (error) {
    console.error("[Database] Failed to update menu item:", error);
    throw error;
  }
}

export async function deleteMenuItem(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete menu item: database not available");
    return false;
  }

  try {
    await db.delete(menuItems).where(eq(menuItems.id, id));
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete menu item:", error);
    throw error;
  }
}

// Orders queries
export async function createOrder(order: InsertOrder): Promise<Order | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create order: database not available");
    return null;
  }

  try {
    const result = await db.insert(orders).values(order);
    const insertedId = (result as any).insertId;
    const inserted = await db.select().from(orders).where(eq(orders.id, insertedId)).limit(1);
    return inserted.length > 0 ? inserted[0] : null;
  } catch (error) {
    console.error("[Database] Failed to create order:", error);
    throw error;
  }
}

export async function getOrders(limit: number = 50, offset: number = 0): Promise<Order[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get orders: database not available");
    return [];
  }

  try {
    const items = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);
    return items;
  } catch (error) {
    console.error("[Database] Failed to get orders:", error);
    throw error;
  }
}

export async function getUserOrders(userId: number): Promise<Order[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user orders: database not available");
    return [];
  }

  try {
    const items = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
    return items;
  } catch (error) {
    console.error("[Database] Failed to get user orders:", error);
    throw error;
  }
}

export async function updateOrderStatus(id: number, status: string): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update order: database not available");
    return false;
  }

  try {
    await db.update(orders).set({ status: status as any }).where(eq(orders.id, id));
    return true;
  } catch (error) {
    console.error("[Database] Failed to update order:", error);
    throw error;
  }
}

// Reviews queries
export async function createReview(review: InsertReview): Promise<Review | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create review: database not available");
    return null;
  }

  try {
    const result = await db.insert(reviews).values(review);
    const insertedId = (result as any).insertId;
    const inserted = await db.select().from(reviews).where(eq(reviews.id, insertedId)).limit(1);
    return inserted.length > 0 ? inserted[0] : null;
  } catch (error) {
    console.error("[Database] Failed to create review:", error);
    throw error;
  }
}

export async function getApprovedReviews(limit: number = 10): Promise<Review[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get reviews: database not available");
    return [];
  }

  try {
    const items = await db
      .select()
      .from(reviews)
      .where(eq(reviews.status, "approved"))
      .orderBy(desc(reviews.createdAt))
      .limit(limit);
    return items;
  } catch (error) {
    console.error("[Database] Failed to get reviews:", error);
    throw error;
  }
}

export async function getPendingReviews(): Promise<Review[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get pending reviews: database not available");
    return [];
  }

  try {
    const items = await db
      .select()
      .from(reviews)
      .where(eq(reviews.status, "pending"))
      .orderBy(desc(reviews.createdAt));
    return items;
  } catch (error) {
    console.error("[Database] Failed to get pending reviews:", error);
    throw error;
  }
}

export async function updateReviewStatus(id: number, status: string): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update review: database not available");
    return false;
  }

  try {
    await db.update(reviews).set({ status: status as any }).where(eq(reviews.id, id));
    return true;
  } catch (error) {
    console.error("[Database] Failed to update review:", error);
    throw error;
  }
}

// Loyalty Cards queries
export async function getLoyaltyCard(userId: number): Promise<LoyaltyCard | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get loyalty card: database not available");
    return null;
  }

  try {
    const result = await db.select().from(loyaltyCards).where(eq(loyaltyCards.userId, userId)).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get loyalty card:", error);
    throw error;
  }
}

export async function createLoyaltyCard(card: InsertLoyaltyCard): Promise<LoyaltyCard | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create loyalty card: database not available");
    return null;
  }

  try {
    const result = await db.insert(loyaltyCards).values(card);
    const insertedId = (result as any).insertId;
    const inserted = await db.select().from(loyaltyCards).where(eq(loyaltyCards.id, insertedId)).limit(1);
    return inserted.length > 0 ? inserted[0] : null;
  } catch (error) {
    console.error("[Database] Failed to create loyalty card:", error);
    throw error;
  }
}

export async function addStamp(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot add stamp: database not available");
    return false;
  }

  try {
    await db.update(loyaltyCards).set({ stamps: (db as any).raw(`stamps + 1`) }).where(eq(loyaltyCards.userId, userId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to add stamp:", error);
    throw error;
  }
}

// Blog Posts queries
export async function getBlogPosts(limit: number = 10, offset: number = 0): Promise<BlogPost[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get blog posts: database not available");
    return [];
  }

  try {
    const items = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.published, 1))
      .orderBy(desc(blogPosts.publishedAt))
      .limit(limit)
      .offset(offset);
    return items;
  } catch (error) {
    console.error("[Database] Failed to get blog posts:", error);
    throw error;
  }
}

export async function createBlogPost(post: InsertBlogPost): Promise<BlogPost | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create blog post: database not available");
    return null;
  }

  try {
    const result = await db.insert(blogPosts).values(post);
    const insertedId = (result as any).insertId;
    const inserted = await db.select().from(blogPosts).where(eq(blogPosts.id, insertedId)).limit(1);
    return inserted.length > 0 ? inserted[0] : null;
  } catch (error) {
    console.error("[Database] Failed to create blog post:", error);
    throw error;
  }
}

// Email Subscribers queries
export async function subscribeEmail(email: string, name?: string): Promise<EmailSubscriber | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot subscribe email: database not available");
    return null;
  }

  try {
    const result = await db.insert(emailSubscribers).values({ email, name, subscribed: 1 }).onDuplicateKeyUpdate({ set: { subscribed: 1 } });
    const inserted = await db.select().from(emailSubscribers).where(eq(emailSubscribers.email, email)).limit(1);
    return inserted.length > 0 ? inserted[0] : null;
  } catch (error) {
    console.error("[Database] Failed to subscribe email:", error);
    throw error;
  }
}

export async function getEmailSubscribers(): Promise<EmailSubscriber[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get email subscribers: database not available");
    return [];
  }

  try {
    const items = await db.select().from(emailSubscribers).where(eq(emailSubscribers.subscribed, 1));
    return items;
  } catch (error) {
    console.error("[Database] Failed to get email subscribers:", error);
    throw error;
  }
}
