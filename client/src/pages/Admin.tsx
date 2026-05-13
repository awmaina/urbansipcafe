import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';
import MenuManager from '@/components/MenuManager';
import ReviewsSection from '@/components/ReviewsSection';

export default function Admin() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<'reservations' | 'gallery' | 'menu' | 'reviews' | 'orders'>('reservations');
  const [reservationPage, setReservationPage] = useState(0);
  const [galleryPage, setGalleryPage] = useState(0);
  const [ordersPage, setOrdersPage] = useState(0);

  // Fetch data - hooks must be called unconditionally
  const reservationsQuery = trpc.reservations.list.useQuery({
    limit: 10,
    offset: reservationPage * 10,
  });

  const galleryQuery = trpc.gallery.list.useQuery({
    limit: 12,
    offset: galleryPage * 12,
  });

  const ordersQuery = trpc.orders.list.useQuery({
    limit: 10,
    offset: ordersPage * 10,
  });

  const deleteGalleryMutation = trpc.gallery.delete.useMutation({
    onSuccess: () => {
      toast.success('Gallery item deleted');
      galleryQuery.refetch();
    },
    onError: () => {
      toast.error('Failed to delete gallery item');
    },
  });

  const handleDeleteGallery = (id: number) => {
    if (confirm('Are you sure you want to delete this image?')) {
      deleteGalleryMutation.mutate({ id });
    }
  };

  // Check admin access after hooks
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">You do not have permission to access the admin dashboard.</p>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-amber-900">Admin Dashboard</h1>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 border-b overflow-x-auto">
          {['reservations', 'gallery', 'menu', 'orders', 'reviews'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 font-medium whitespace-nowrap capitalize ${
                activeTab === tab ? 'border-b-2 border-amber-600 text-amber-600' : 'text-gray-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Reservations Tab */}
        {activeTab === 'reservations' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Reservations</h2>
            {reservationsQuery.data?.map((reservation) => (
              <Card key={reservation.id}>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-semibold">{reservation.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold">{reservation.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Date & Time</p>
                      <p className="font-semibold">{reservation.reservationDate} at {reservation.reservationTime}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Guests</p>
                      <p className="font-semibold">{reservation.guestCount}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600">Status</p>
                      <p className="font-semibold capitalize">{reservation.status}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                onClick={() => setReservationPage(Math.max(0, reservationPage - 1))}
                disabled={reservationPage === 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-4 py-2">{reservationPage + 1}</span>
              <Button
                variant="outline"
                onClick={() => setReservationPage(reservationPage + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Gallery Tab */}
        {activeTab === 'gallery' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Gallery</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {galleryQuery.data?.map((item) => (
                <Card key={item.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-sm text-gray-600">{item.category}</p>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteGallery(item.id)}
                        className="w-full gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                onClick={() => setGalleryPage(Math.max(0, galleryPage - 1))}
                disabled={galleryPage === 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-4 py-2">{galleryPage + 1}</span>
              <Button
                variant="outline"
                onClick={() => setGalleryPage(galleryPage + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Menu Tab */}
        {activeTab === 'menu' && <MenuManager />}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Orders</h2>
            {ordersQuery.data?.map((order) => (
              <Card key={order.id}>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Order Number</p>
                      <p className="font-semibold">{order.orderNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="font-semibold">${(order.totalPrice / 100).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Pickup Time</p>
                      <p className="font-semibold">{order.pickupTime}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <p className="font-semibold capitalize">{order.status}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                onClick={() => setOrdersPage(Math.max(0, ordersPage - 1))}
                disabled={ordersPage === 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-4 py-2">{ordersPage + 1}</span>
              <Button
                variant="outline"
                onClick={() => setOrdersPage(ordersPage + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && <ReviewsSection />}
      </div>
    </div>
  );
}
