import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { addGalleryItem, getGalleryItems, deleteGalleryItem, createReservation, getReservations, updateReservationStatus, getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem, createOrder, getOrders, getUserOrders, updateOrderStatus, createReview, getApprovedReviews, getPendingReviews, updateReviewStatus, getLoyaltyCard, createLoyaltyCard, addStamp, getBlogPosts, createBlogPost, subscribeEmail, getEmailSubscribers } from "./db";
import { storagePut } from "./storage";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  gallery: router({
    list: publicProcedure
      .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
      .query(async ({ input }) => {
        return await getGalleryItems(input.limit, input.offset);
      }),
    
    upload: protectedProcedure
      .input(z.object({
        fileUrl: z.string(),
        fileName: z.string(),
        fileSize: z.number(),
        mimeType: z.string(),
        title: z.string(),
        category: z.string().default("general"),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const galleryItem = await addGalleryItem({
            title: input.title,
            description: "",
            fileKey: input.fileName,
            fileUrl: input.fileUrl,
            mimeType: input.mimeType,
            fileSize: input.fileSize,
            uploadedBy: ctx.user.id,
            category: input.category,
            isPublished: 1,
          });
          
          return galleryItem;
        } catch (error) {
          console.error("[Gallery Upload] Failed:", error);
          throw error;
        }
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        try {
          const success = await deleteGalleryItem(input.id);
          return { success };
        } catch (error) {
          console.error("[Gallery Delete] Failed:", error);
          throw error;
        }
      }),
  }),

  reservations: router({
    create: publicProcedure
      .input(z.object({
        name: z.string(),
        email: z.string().email(),
        reservationDate: z.string(),
        reservationTime: z.string(),
        guestCount: z.number(),
      }))
      .mutation(async ({ input }) => {
        try {
          const reservation = await createReservation({
            name: input.name,
            email: input.email,
            reservationDate: input.reservationDate,
            reservationTime: input.reservationTime,
            guestCount: input.guestCount,
            status: "pending",
          });
          return reservation;
        } catch (error) {
          console.error("[Reservation Create] Failed:", error);
          throw error;
        }
      }),
    
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ input }) => {
        return await getReservations(input.limit, input.offset);
      }),
    
    updateStatus: protectedProcedure
      .input(z.object({ id: z.number(), status: z.string() }))
      .mutation(async ({ input }) => {
        try {
          const success = await updateReservationStatus(input.id, input.status);
          return { success };
        } catch (error) {
          console.error("[Reservation Update] Failed:", error);
          throw error;
        }
      }),
  }),

  menu: router({
    list: publicProcedure
      .input(z.object({ category: z.string().optional() }))
      .query(async ({ input }) => {
        return await getMenuItems(input.category);
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        category: z.enum(["coffee", "food", "specials", "drinks", "desserts"]),
        price: z.number(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await createMenuItem(input);
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        price: z.number().optional(),
        description: z.string().optional(),
        available: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const success = await updateMenuItem(id, data);
        return { success };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const success = await deleteMenuItem(input.id);
        return { success };
      }),
  }),

  orders: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ input }) => {
        return await getOrders(input.limit, input.offset);
      }),
    
    userOrders: protectedProcedure
      .query(async ({ ctx }) => {
        return await getUserOrders(ctx.user.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        items: z.string(),
        totalPrice: z.number(),
        pickupTime: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const orderNumber = `ORD-${Date.now()}`;
        return await createOrder({
          userId: ctx.user.id,
          orderNumber,
          items: input.items,
          totalPrice: input.totalPrice,
          pickupTime: input.pickupTime,
          notes: input.notes,
          status: "pending",
        });
      }),
    
    updateStatus: protectedProcedure
      .input(z.object({ id: z.number(), status: z.string() }))
      .mutation(async ({ input }) => {
        const success = await updateOrderStatus(input.id, input.status);
        return { success };
      }),
  }),

  reviews: router({
    list: publicProcedure
      .input(z.object({ limit: z.number().default(10) }))
      .query(async ({ input }) => {
        return await getApprovedReviews(input.limit);
      }),
    
    pending: protectedProcedure
      .query(async () => {
        return await getPendingReviews();
      }),
    
    create: protectedProcedure
      .input(z.object({
        rating: z.number().min(1).max(5),
        title: z.string(),
        comment: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await createReview({
          userId: ctx.user.id,
          rating: input.rating,
          title: input.title,
          comment: input.comment,
          status: "pending",
        });
      }),
    
    updateStatus: protectedProcedure
      .input(z.object({ id: z.number(), status: z.string() }))
      .mutation(async ({ input }) => {
        const success = await updateReviewStatus(input.id, input.status);
        return { success };
      }),
  }),

  loyalty: router({
    get: protectedProcedure
      .query(async ({ ctx }) => {
        let card = await getLoyaltyCard(ctx.user.id);
        if (!card) {
          card = await createLoyaltyCard({ userId: ctx.user.id, stamps: 0, tier: "bronze" });
        }
        return card;
      }),
    
    addStamp: protectedProcedure
      .mutation(async ({ ctx }) => {
        const success = await addStamp(ctx.user.id);
        return { success };
      }),
  }),

  blog: router({
    list: publicProcedure
      .input(z.object({ limit: z.number().default(10), offset: z.number().default(0) }))
      .query(async ({ input }) => {
        return await getBlogPosts(input.limit, input.offset);
      }),
    
    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        slug: z.string(),
        content: z.string(),
        excerpt: z.string().optional(),
        category: z.string().optional(),
        tags: z.string().optional(),
        published: z.number().default(0),
      }))
      .mutation(async ({ input }) => {
        return await createBlogPost({
          ...input,
          author: "Admin",
          publishedAt: input.published ? new Date() : undefined,
        });
      }),
  }),

  newsletter: router({
    subscribe: publicProcedure
      .input(z.object({
        email: z.string().email(),
        name: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await subscribeEmail(input.email, input.name);
      }),
  }),
});

export type AppRouter = typeof appRouter;
