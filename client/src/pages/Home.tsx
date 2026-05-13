import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Menu, X, Coffee, Leaf, Heart, Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import OrderCart from '@/components/OrderCart';
import ReviewsSection from '@/components/ReviewsSection';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatKES = (amount: number) =>
  `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

// ─── Types ────────────────────────────────────────────────────────────────────

type MenuCategory = 'coffee' | 'food' | 'specials';
type MenuFilter = 'all' | MenuCategory;

interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  price: number;
  description: string;
  image: string;
}

interface LoyaltyCard {
  stamps: number;
  rewardEarned: boolean;
}

interface ReservationForm {
  name: string;
  email: string;
  date: string;
  time: string;
  guests: string;
  notes: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LOYALTY_STAMPS_REQUIRED = 5;

const NAV_LINKS = ['Menu', 'Loyalty', 'Gallery', 'About', 'Contact'] as const;

const MENU_FILTERS: { label: string; value: MenuFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Coffee', value: 'coffee' },
  { label: 'Food', value: 'food' },
  { label: 'Specials', value: 'specials' },
];

const MENU_ITEMS: MenuItem[] = [
  {
    id: '1',
    name: 'Espresso',
    category: 'coffee',
    price: 450,
    description: 'Rich, bold shot of single-origin espresso',
    image: '/images/Espresso.jpg',
  },
  {
    id: '2',
    name: 'Cappuccino',
    category: 'coffee',
    price: 580,
    description: 'Silky microfoam cappuccino with latte art',
    image: '/images/Cappuccino.jpg',
  },
  {
    id: '3',
    name: 'Cortado',
    category: 'coffee',
    price: 520,
    description: 'Perfect 1:1 espresso and steamed milk balance',
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop',
  },
  {
    id: '4',
    name: 'Croissant',
    category: 'food',
    price: 580,
    description: 'Butter-laminated French croissant, flaky and golden',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop',
  },
  {
    id: '5',
    name: 'Blueberry Muffin',
    category: 'food',
    price: 650,
    description: 'Fresh blueberry muffin with streusel topping',
    image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&h=300&fit=crop',
  },
  {
    id: '6',
    name: 'Avocado Toast',
    category: 'food',
    price: 1100,
    description: 'Smashed avocado on sourdough with sea salt and olive oil',
    image: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=400&h=300&fit=crop',
  },
  {
    id: '7',
    name: 'Seasonal Latte',
    category: 'specials',
    price: 720,
    description: 'Limited edition seasonal flavor with house-made syrup',
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop',
  },
  {
    id: '8',
    name: 'Affogato',
    category: 'specials',
    price: 780,
    description: 'Vanilla gelato topped with hot espresso shot',
    image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop',
  },
];

const DEFAULT_RESERVATION: ReservationForm = {
  name: '',
  email: '',
  date: '',
  time: '',
  guests: '',
  notes: '',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [menuFilter, setMenuFilter] = useState<MenuFilter>('all');
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [loyaltyCard, setLoyaltyCard] = useState<LoyaltyCard>({ stamps: 0, rewardEarned: false });
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [reservation, setReservation] = useState<ReservationForm>(DEFAULT_RESERVATION);
  const [scrollReveals, setScrollReveals] = useState<Set<string>>(new Set());

  const revealRefs = useRef(new Map<string, HTMLElement>());

  // ─── Scroll reveal observer ────────────────────────────────────────────────

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-reveal-id');
            if (id) {
              setScrollReveals((prev) => new Set(prev).add(id));
              observer.unobserve(entry.target);
            }
          }
        });
      },
      { threshold: 0.1 },
    );

    revealRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const setRevealRef = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      if (el) revealRefs.current.set(id, el);
      else revealRefs.current.delete(id);
    },
    [],
  );

  const isRevealed = (id: string) => scrollReveals.has(id);

  // ─── Derived state ─────────────────────────────────────────────────────────

  const filteredMenuItems = useMemo(
    () =>
      menuFilter === 'all'
        ? MENU_ITEMS
        : MENU_ITEMS.filter((item) => item.category === menuFilter),
    [menuFilter],
  );

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const openReservationForm = useCallback(() => {
    setShowReservationForm(true);
    setMobileMenuOpen(false);
  }, []);

  const closeReservationForm = useCallback(() => {
    setShowReservationForm(false);
    setReservation(DEFAULT_RESERVATION);
  }, []);

  const handleScanVisit = useCallback(() => {
    setLoyaltyCard((prev) => {
      const newStamps = prev.stamps + 1;
      if (newStamps >= LOYALTY_STAMPS_REQUIRED) {
        toast.success('🎉 You earned a free coffee! Enjoy your reward!');
        return { stamps: 0, rewardEarned: true };
      }
      toast.success(
        `Stamp collected! ${LOYALTY_STAMPS_REQUIRED - newStamps} more for a free coffee.`,
      );
      return { stamps: newStamps, rewardEarned: false };
    });
  }, []);

  const handleDismissReward = useCallback(() => {
    setLoyaltyCard((prev) => ({ ...prev, rewardEarned: false }));
  }, []);

  const reservationMutation = trpc.reservations.create.useMutation();

  const handleReservationSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const { name, email, date, time, guests } = reservation;
      if (!name || !email || !date || !time || !guests) {
        toast.error('Please fill in all required fields');
        return;
      }

      try {
        await reservationMutation.mutateAsync({
          name,
          email,
          reservationDate: date,
          reservationTime: time,
          guestCount: parseInt(guests, 10),
        });
        toast.success(
          `Reservation confirmed for ${name} on ${date} at ${time}`,
        );
        closeReservationForm();
      } catch {
        toast.error('Failed to create reservation. Please try again.');
      }
    },
    [reservation, reservationMutation, closeReservationForm],
  );

  const handleOrderNow = useCallback(() => {
    if (selectedMenuItem) {
      toast.success(`${selectedMenuItem.name} added to cart!`);
      setSelectedMenuItem(null);
    }
  }, [selectedMenuItem]);

  const updateReservation = useCallback(
    (field: keyof ReservationForm) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setReservation((prev) => ({ ...prev, [field]: e.target.value })),
    [],
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Navigation ─────────────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md"
        aria-label="Main navigation"
      >
        <div className="container flex items-center justify-between py-4">
          <a href="#" className="text-2xl font-bold text-primary tracking-tight" aria-label="Urban Sip home">
            Urban Sip
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8 font-medium text-xs uppercase tracking-widest text-foreground">
            {NAV_LINKS.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="hover:text-accent transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
              >
                {item}
              </a>
            ))}

            {user?.role === 'admin' && (
              <a
                href="/admin"
                className="text-accent hover:text-accent/80 transition-all font-bold"
                aria-label="Admin dashboard"
              >
                Admin
              </a>
            )}

            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-accent/10 transition-all focus-visible:ring-2 focus-visible:ring-accent"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
            </button>

            <Button
              onClick={openReservationForm}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 transition-transform hover:scale-105"
            >
              Reserve
            </Button>
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            className="md:hidden p-2 rounded-lg hover:bg-accent/10 focus-visible:ring-2 focus-visible:ring-accent"
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? <X size={24} aria-hidden /> : <Menu size={24} aria-hidden />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div
            id="mobile-menu"
            className="md:hidden border-t border-border bg-background p-4 animate-in slide-in-from-top-5"
          >
            <nav aria-label="Mobile navigation" className="flex flex-col gap-4 text-center">
              {NAV_LINKS.map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="py-2 hover:text-accent transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item}
                </a>
              ))}

              <div className="flex items-center justify-center gap-4 py-2 border-t border-border">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex items-center gap-2"
                  aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                  {theme === 'dark' ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
                  <span className="text-sm uppercase">{theme === 'dark' ? 'Light' : 'Dark'}</span>
                </button>
              </div>

              <Button onClick={openReservationForm} className="w-full rounded-full bg-primary text-primary-foreground">
                Reserve Table
              </Button>
            </nav>
          </div>
        )}
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section aria-label="Hero" className="relative h-auto md:h-[600px] overflow-hidden">
        <div className="flex flex-col md:flex-row w-full h-auto md:h-full gap-1 bg-background">
          {[
            { src: '/images/life-begines-after-coffee.jpg', alt: 'Life begins after coffee' },
            { src: '/images/coffee.jpg', alt: 'Freshly brewed coffee' },
            { src: '/images/coffee-time.jpg', alt: 'Coffee time at Urban Sip' },
          ].map(({ src, alt }) => (
            <div key={src} className="flex-1 overflow-hidden relative h-64 md:h-full">
              <img src={src} alt={alt} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>

        <div
          className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/60 flex items-center justify-center"
          aria-hidden="true"
        >
          <div className="text-center text-white animate-fade-in-up pointer-events-none">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">Urban Sip</h1>
            <p className="text-xl md:text-2xl">Specialty Coffee &amp; Artisanal Pastries</p>
          </div>
        </div>
      </section>

      {/* ── Menu ───────────────────────────────────────────────────────────── */}
      <section id="menu" className="py-16 md:py-24 bg-background" aria-labelledby="menu-heading">
        <div className="container">
          <div
            ref={setRevealRef('menu-title')}
            data-reveal-id="menu-title"
            className={`scroll-reveal ${isRevealed('menu-title') ? 'visible' : ''}`}
          >
            <h2 id="menu-heading" className="text-4xl md:text-5xl font-bold mb-4 text-primary">
              Our Menu
            </h2>
            <p className="text-lg text-muted-foreground mb-12 max-w-2xl">
              Carefully crafted beverages and pastries made with premium ingredients and passion.
            </p>
          </div>

          {/* Filter buttons */}
          <div className="flex flex-wrap gap-3 mb-12" role="group" aria-label="Filter menu by category">
            {MENU_FILTERS.map(({ label, value }) => (
              <button
                key={value}
                type="button"
                onClick={() => setMenuFilter(value)}
                aria-pressed={menuFilter === value}
                className={`px-6 py-2 rounded-full transition-smooth ${
                  menuFilter === value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-foreground border border-border hover:border-accent'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Menu grid */}
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            aria-label="Menu items"
          >
            {filteredMenuItems.map((item) => {
              const revealId = `menu-item-${item.id}`;
              return (
                <div
                  key={item.id}
                  ref={setRevealRef(revealId)}
                  data-reveal-id={revealId}
                  className={`scroll-reveal ${isRevealed(revealId) ? 'visible' : ''} hover-lift`}
                >
                  <div
                    className="bg-card rounded-lg overflow-hidden border border-border cursor-pointer focus-visible:ring-2 focus-visible:ring-accent outline-none"
                    role="button"
                    tabIndex={0}
                    aria-label={`View details for ${item.name}, ${formatKES(item.price)}`}
                    onClick={() => setSelectedMenuItem(item)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedMenuItem(item);
                      }
                    }}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-48 object-cover"
                      loading="lazy"
                    />
                    <div className="p-4">
                      <h3 className="text-xl font-bold text-primary mb-2">{item.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-accent">
                          {formatKES(item.price)}
                        </span>
                        <Button size="sm" variant="outline" tabIndex={-1} aria-hidden>
                          Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Menu Item Modal ─────────────────────────────────────────────────── */}
      <Dialog open={!!selectedMenuItem} onOpenChange={() => setSelectedMenuItem(null)}>
        <DialogContent className="max-w-md">
          {selectedMenuItem && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl text-primary">
                  {selectedMenuItem.name}
                </DialogTitle>
                <DialogDescription>{selectedMenuItem.description}</DialogDescription>
              </DialogHeader>
              <img
                src={selectedMenuItem.image}
                alt={selectedMenuItem.name}
                className="w-full h-48 object-cover rounded-lg mb-4"
                loading="lazy"
              />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-foreground">Price:</span>
                  <span className="text-2xl font-bold text-accent">
                    {formatKES(selectedMenuItem.price)}
                  </span>
                </div>
                <Button
                  onClick={handleOrderNow}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Order Now
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Loyalty Program ─────────────────────────────────────────────────── */}
      <section
        id="loyalty"
        className="py-16 md:py-24 bg-card"
        aria-labelledby="loyalty-heading"
      >
        <div className="container">
          <div
            ref={setRevealRef('loyalty-title')}
            data-reveal-id="loyalty-title"
            className={`scroll-reveal ${isRevealed('loyalty-title') ? 'visible' : ''} text-center mb-12`}
          >
            <h2 id="loyalty-heading" className="text-4xl md:text-5xl font-bold mb-4 text-primary">
              Loyalty Program
            </h2>
            <p className="text-lg text-muted-foreground">
              Collect {LOYALTY_STAMPS_REQUIRED} stamps and earn a free coffee!
            </p>
          </div>

          <div
            ref={setRevealRef('loyalty-card')}
            data-reveal-id="loyalty-card"
            className={`scroll-reveal ${isRevealed('loyalty-card') ? 'visible' : ''} max-w-md mx-auto`}
          >
            <div
              className="bg-gradient-to-br from-primary to-primary/80 rounded-lg p-8 text-primary-foreground shadow-lg"
              role="region"
              aria-label="Loyalty card"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold">Urban Sip Card</h3>
                <Heart size={32} fill="currentColor" aria-hidden />
              </div>

              {/* Stamps */}
              <div
                className="grid grid-cols-5 gap-2 mb-8"
                role="list"
                aria-label={`${loyaltyCard.stamps} of ${LOYALTY_STAMPS_REQUIRED} stamps collected`}
              >
                {Array.from({ length: LOYALTY_STAMPS_REQUIRED }, (_, i) => {
                  const stampNumber = i + 1;
                  const filled = loyaltyCard.stamps >= stampNumber;
                  return (
                    <div
                      key={stampNumber}
                      role="listitem"
                      aria-label={filled ? `Stamp ${stampNumber} collected` : `Stamp ${stampNumber} empty`}
                      className={`aspect-square rounded-full border-2 border-primary-foreground flex items-center justify-center text-sm font-bold ${
                        filled ? 'bg-accent text-primary' : 'bg-transparent'
                      } ${loyaltyCard.stamps === stampNumber ? 'animate-stamp-bounce' : ''}`}
                    >
                      {stampNumber}
                    </div>
                  );
                })}
              </div>

              {loyaltyCard.rewardEarned && (
                <div className="bg-accent text-primary rounded-lg p-4 mb-6 text-center">
                  <p className="font-bold">🎉 Free Coffee Earned! 🎉</p>
                  <button
                    type="button"
                    onClick={handleDismissReward}
                    className="mt-2 text-sm underline hover:no-underline"
                    aria-label="Dismiss reward notification"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              <Button
                type="button"
                onClick={handleScanVisit}
                className="w-full bg-accent text-primary hover:bg-accent/90 font-bold"
                aria-label="Scan your visit to collect a stamp"
              >
                Scan Visit
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── About ───────────────────────────────────────────────────────────── */}
      <section
        id="about"
        className="py-16 md:py-24 bg-background"
        aria-labelledby="about-heading"
      >
        <div className="container grid md:grid-cols-2 gap-12 items-center">
          <div
            ref={setRevealRef('about-image')}
            data-reveal-id="about-image"
            className={`scroll-reveal ${isRevealed('about-image') ? 'visible' : ''}`}
          >
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310419663032456245/k3wFunGXzmYLmdmEy4jP9Z/urban-sip-about-hero-GyudtwdJtRDstmDYjTAzdH.webp"
              alt="Barista preparing coffee at Urban Sip Café"
              className="rounded-lg shadow-lg"
              loading="lazy"
            />
          </div>

          <div
            ref={setRevealRef('about-content')}
            data-reveal-id="about-content"
            className={`scroll-reveal ${isRevealed('about-content') ? 'visible' : ''}`}
          >
            <h2 id="about-heading" className="text-4xl md:text-5xl font-bold mb-6 text-primary">
              About Urban Sip
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Founded in 2020, Urban Sip Café is dedicated to bringing specialty coffee culture to
              the heart of the city. We source single-origin beans from ethical farmers and pair
              them with freshly baked pastries from local artisans.
            </p>
            <p className="text-lg text-muted-foreground mb-6">
              Our mission is to create a welcoming space where coffee enthusiasts and casual
              visitors alike can enjoy exceptional beverages and build community.
            </p>
            <div className="flex gap-6">
              <div className="flex items-start gap-3">
                <Coffee className="text-accent mt-1 shrink-0" size={24} aria-hidden />
                <div>
                  <h3 className="font-bold text-primary">Premium Beans</h3>
                  <p className="text-sm text-muted-foreground">
                    Ethically sourced from around the world
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Leaf className="text-accent mt-1 shrink-0" size={24} aria-hidden />
                <div>
                  <h3 className="font-bold text-primary">Sustainable</h3>
                  <p className="text-sm text-muted-foreground">
                    Eco-friendly practices throughout
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Contact ─────────────────────────────────────────────────────────── */}
      <section
        id="contact"
        className="py-16 md:py-24 bg-card"
        aria-labelledby="contact-heading"
      >
        <div className="container max-w-2xl">
          <div
            ref={setRevealRef('contact-title')}
            data-reveal-id="contact-title"
            className={`scroll-reveal ${isRevealed('contact-title') ? 'visible' : ''} text-center mb-12`}
          >
            <h2 id="contact-heading" className="text-4xl md:text-5xl font-bold mb-4 text-primary">
              Get in Touch
            </h2>
            <p className="text-lg text-muted-foreground">Visit us or make a reservation</p>
          </div>

          <div
            ref={setRevealRef('contact-info')}
            data-reveal-id="contact-info"
            className={`scroll-reveal ${isRevealed('contact-info') ? 'visible' : ''} grid md:grid-cols-2 gap-8 mb-12`}
          >
            <address className="not-italic">
              <h3 className="font-bold text-primary mb-2">Address</h3>
              <p className="text-muted-foreground">
                23 Main Street
                <br />
                Ruaraka, Nairobi
              </p>
            </address>
            <div>
              <h3 className="font-bold text-primary mb-2">Hours</h3>
              <p className="text-muted-foreground">
                Mon–Fri: 7am – 8pm
                <br />
                Sat–Sun: 8am – 9pm
              </p>
            </div>
            <div>
              <h3 className="font-bold text-primary mb-2">Phone</h3>
              <p className="text-muted-foreground">
                <a href="tel:+254745306185" className="hover:text-accent transition-smooth">
                  (+254) 0745-306-185
                </a>
              </p>
            </div>
            <div>
              <h3 className="font-bold text-primary mb-2">Email</h3>
              <p className="text-muted-foreground">
                <a
                  href="mailto:hello@urbansip.com"
                  className="hover:text-accent transition-smooth"
                >
                  blacklink@urbansip.com
                </a>
              </p>
            </div>
          </div>

          <Button
            onClick={openReservationForm}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-6 text-lg"
          >
            Make a Reservation
          </Button>
        </div>
      </section>

      {/* ── Reservation Modal ───────────────────────────────────────────────── */}
      <Dialog open={showReservationForm} onOpenChange={closeReservationForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-primary">Make a Reservation</DialogTitle>
            <DialogDescription>Book your table at Urban Sip Café</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleReservationSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="res-name" className="text-sm font-medium text-foreground">
                Name <span aria-hidden>*</span>
                <span className="sr-only">(required)</span>
              </label>
              <Input
                id="res-name"
                value={reservation.name}
                onChange={updateReservation('name')}
                placeholder="Your name"
                className="mt-1"
                required
                aria-required="true"
                autoComplete="name"
              />
            </div>

            <div>
              <label htmlFor="res-email" className="text-sm font-medium text-foreground">
                Email <span aria-hidden>*</span>
                <span className="sr-only">(required)</span>
              </label>
              <Input
                id="res-email"
                type="email"
                value={reservation.email}
                onChange={updateReservation('email')}
                placeholder="your@email.com"
                className="mt-1"
                required
                aria-required="true"
                autoComplete="email"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="res-date" className="text-sm font-medium text-foreground">
                  Date <span aria-hidden>*</span>
                  <span className="sr-only">(required)</span>
                </label>
                <Input
                  id="res-date"
                  type="date"
                  value={reservation.date}
                  onChange={updateReservation('date')}
                  className="mt-1"
                  required
                  aria-required="true"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label htmlFor="res-time" className="text-sm font-medium text-foreground">
                  Time <span aria-hidden>*</span>
                  <span className="sr-only">(required)</span>
                </label>
                <Input
                  id="res-time"
                  type="time"
                  value={reservation.time}
                  onChange={updateReservation('time')}
                  className="mt-1"
                  required
                  aria-required="true"
                />
              </div>
            </div>

            <div>
              <label htmlFor="res-guests" className="text-sm font-medium text-foreground">
                Number of Guests <span aria-hidden>*</span>
                <span className="sr-only">(required)</span>
              </label>
              <Input
                id="res-guests"
                type="number"
                min="1"
                max="10"
                value={reservation.guests}
                onChange={updateReservation('guests')}
                placeholder="2"
                className="mt-1"
                required
                aria-required="true"
              />
            </div>

            <div>
              <label htmlFor="res-notes" className="text-sm font-medium text-foreground">
                Special Requests
              </label>
              <Textarea
                id="res-notes"
                value={reservation.notes}
                onChange={updateReservation('notes')}
                placeholder="Any special requests or dietary restrictions?"
                className="mt-1"
              />
            </div>

           <Button
  type="submit"
  disabled={reservationMutation.isPending} // Changed from isLoading
  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
>
  {reservationMutation.isPending ? 'Confirming...' : 'Confirm Reservation'}
</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Order Cart & Reviews ─────────────────────────────────────────────── */}
      <OrderCart />
      <ReviewsSection />

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="bg-primary text-primary-foreground py-12" aria-label="Site footer">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Urban Sip Café</h3>
              <p className="text-primary-foreground/80">
                Specialty coffee and artisanal pastries in the heart of the city.
              </p>
            </div>
            <nav aria-label="Footer quick links">
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-primary-foreground/80">
                <li>
                  <a href="#menu" className="hover:text-accent transition-smooth">
                    Menu
                  </a>
                </li>
                <li>
                  <a href="#loyalty" className="hover:text-accent transition-smooth">
                    Loyalty Program
                  </a>
                </li>
                <li>
                  <a href="#about" className="hover:text-accent transition-smooth">
                    About Us
                  </a>
                </li>
              </ul>
            </nav>
            <nav aria-label="Social media links">
              <h4 className="font-bold mb-4">Follow Us</h4>
              <ul className="space-y-2 text-primary-foreground/80">
                <li>
                  <a
                    href="https://instagram.com/urbansip"
                    className="hover:text-accent transition-smooth"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Urban Sip on Instagram (opens in new tab)"
                  >
                    Instagram
                  </a>
                </li>
                <li>
                  <a
                    href="https://facebook.com/urbansip"
                    className="hover:text-accent transition-smooth"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Urban Sip on Facebook (opens in new tab)"
                  >
                    Facebook
                  </a>
                </li>
                <li>
                  <a
                    href="https://twitter.com/urbansip"
                    className="hover:text-accent transition-smooth"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Urban Sip on X / Twitter (opens in new tab)"
                  >
                    Twitter
                  </a>
                </li>
              </ul>
            </nav>
          </div>

          <div className="border-t border-primary-foreground/20 pt-8 text-center text-primary-foreground/60">
            <p>
              <small>© 2026 Urban Sip Café. All rights reserved.</small>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}