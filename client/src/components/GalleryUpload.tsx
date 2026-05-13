import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';

interface GalleryUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function GalleryUpload({ open, onOpenChange, onSuccess }: GalleryUploadProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const uploadMutation = trpc.gallery.upload.useMutation({
    onSuccess: () => {
      toast.success('Photo uploaded successfully!');
      setTitle('');
      setDescription('');
      setCategory('general');
      setFile(null);
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setIsUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      await uploadMutation.mutateAsync({
        title,
        category,
        fileUrl: URL.createObjectURL(file),
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      });
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary">Upload Photo</DialogTitle>
          <DialogDescription>Add a new photo to the gallery</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Title *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Café Interior"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="general">General</option>
              <option value="interior">Interior</option>
              <option value="menu">Menu Items</option>
              <option value="events">Events</option>
              <option value="staff">Staff</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Photo *</label>
            <div className="mt-1 flex items-center justify-center w-full">
              <label className="w-full flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:border-accent transition-colors">
                <Upload size={24} className="text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">
                  {file ? file.name : 'Click to select photo'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isUploading || !file || !title}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isUploading ? 'Uploading...' : 'Upload Photo'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
