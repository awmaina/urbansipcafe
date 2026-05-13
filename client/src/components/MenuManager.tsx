import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Trash2, Plus } from 'lucide-react';

export default function MenuManager() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'coffee' as const,
    price: '',
    description: '',
  });

  const { data: menuItems, refetch } = trpc.menu.list.useQuery({ category: undefined });
  const createMutation = trpc.menu.create.useMutation();
  const deleteMutation = trpc.menu.delete.useMutation();

  const handleAddItem = async () => {
    if (!formData.name || !formData.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: formData.name,
        category: formData.category,
        price: Math.round(parseFloat(formData.price) * 100),
        description: formData.description,
      });
      toast.success('Menu item added successfully');
      setFormData({ name: '', category: 'coffee', price: '', description: '' });
      setShowAddForm(false);
      refetch();
    } catch (error) {
      toast.error('Failed to add menu item');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success('Menu item deleted');
      refetch();
    } catch (error) {
      toast.error('Failed to delete menu item');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Menu Management</h2>
        <Button onClick={() => setShowAddForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Item
        </Button>
      </div>

      <div className="grid gap-4">
        {menuItems?.map((item) => (
          <div key={item.id} className="border rounded-lg p-4 flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-semibold">{item.name}</h3>
              <p className="text-sm text-gray-600 capitalize">{item.category}</p>
              {item.description && <p className="text-sm mt-2">{item.description}</p>}
              <p className="font-bold mt-2">${(item.price / 100).toFixed(2)}</p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(item.id)}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Menu Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Item name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <select
              className="w-full border rounded px-3 py-2"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
            >
              <option value="coffee">Coffee</option>
              <option value="food">Food</option>
              <option value="specials">Specials</option>
              <option value="drinks">Drinks</option>
              <option value="desserts">Desserts</option>
            </select>
            <Input
              placeholder="Price ($)"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            />
            <Textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <div className="flex gap-2">
              <Button onClick={handleAddItem} className="flex-1">
                Add Item
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
