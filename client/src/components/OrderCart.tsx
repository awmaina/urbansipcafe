import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Trash2, ShoppingCart, Plus, Minus } from 'lucide-react';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

export default function OrderCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [pickupTime, setPickupTime] = useState('');

  const { data: menuItems } = trpc.menu.list.useQuery({ category: undefined });
  const createOrderMutation = trpc.orders.create.useMutation();

  const addToCart = (item: any) => {
    const existing = cart.find((c) => c.id === item.id);
    if (existing) {
      setCart(cart.map((c) => (c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)));
    } else {
      setCart([...cart, { id: item.id, name: item.name, price: item.price, quantity: 1 }]);
    }
    toast.success(`${item.name} added to cart`);
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
    } else {
      setCart(cart.map((item) => (item.id === id ? { ...item, quantity } : item)));
    }
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (!pickupTime) {
      toast.error('Please select a pickup time');
      return;
    }

    try {
      await createOrderMutation.mutateAsync({
        items: JSON.stringify(cart),
        totalPrice: totalPrice,
        pickupTime,
      });
      toast.success('Order placed successfully!');
      setCart([]);
      setPickupTime('');
      setShowCart(false);
    } catch (error) {
      toast.error('Failed to place order');
    }
  };

  return (
    <>
      <Button
        onClick={() => setShowCart(true)}
        className="fixed bottom-6 right-6 rounded-full w-16 h-16 shadow-lg gap-2 z-40"
      >
        <ShoppingCart className="w-6 h-6" />
        {cart.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
            {cart.length}
          </span>
        )}
      </Button>

      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Your Order</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {cart.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Your cart is empty</p>
            ) : (
              <>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between border rounded p-3">
                      <div className="flex-1">
                        <h4 className="font-semibold">{item.name}</h4>
                        <p className="text-sm text-gray-600">${(item.price / 100).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-3">
                  <p className="text-lg font-bold">Total: ${(totalPrice / 100).toFixed(2)}</p>
                </div>

                <Input
                  type="time"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  placeholder="Pickup time"
                />

                <Button onClick={handleCheckout} className="w-full">
                  Place Order
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Menu Display */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8">Order Online</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {menuItems?.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 hover:shadow-lg transition">
                <h3 className="font-semibold text-lg mb-2">{item.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                <div className="flex justify-between items-center">
                  <p className="font-bold text-lg">${(item.price / 100).toFixed(2)}</p>
                  <Button size="sm" onClick={() => addToCart(item)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
