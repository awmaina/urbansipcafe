import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/_core/hooks/useAuth';

export function GalleryDisplay() {
  const { user } = useAuth();
  const [offset, setOffset] = useState(0);
  const limit = 12;

  const { data: galleryItems, isLoading, refetch } = trpc.gallery.list.useQuery({
    limit,
    offset,
  });

  const deleteMutation = trpc.gallery.delete.useMutation({
    onSuccess: () => {
      toast.success('Photo deleted successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(`Delete failed: ${error.message}`);
    },
  });

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this photo?')) {
      deleteMutation.mutate({ id });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!galleryItems || galleryItems.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No photos in gallery yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {galleryItems.map((item) => (
          <div key={item.id} className="group relative overflow-hidden rounded-lg shadow-lg">
            <img
              src={item.fileUrl}
              alt={item.title}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-end">
              <div className="w-full p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <h3 className="font-bold text-lg">{item.title}</h3>
                {item.description && (
                  <p className="text-sm text-gray-200 line-clamp-2">{item.description}</p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs bg-accent/80 text-primary px-2 py-1 rounded">
                    {item.category}
                  </span>
                  {user?.id === item.uploadedBy && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(item.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {galleryItems.length >= limit && (
        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={offset === 0}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => setOffset(offset + limit)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
