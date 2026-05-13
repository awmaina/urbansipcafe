import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { GalleryUpload } from '@/components/GalleryUpload';
import { GalleryDisplay } from '@/components/GalleryDisplay';
import { useAuth } from '@/_core/hooks/useAuth';
import { Plus } from 'lucide-react';

export default function Gallery() {
  const { user, isAuthenticated } = useAuth();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="container flex items-center justify-between py-4">
          <div className="text-2xl font-bold text-primary">Urban Sip</div>
          <div className="flex items-center gap-4">
            <a href="/" className="hover:text-accent transition-smooth">Home</a>
            <a href="#gallery" className="hover:text-accent transition-smooth">Gallery</a>
            {isAuthenticated && (
              <Button
                onClick={() => setUploadOpen(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus size={18} className="mr-2" />
                Upload Photo
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-12 md:py-20 bg-card">
        <div className="container text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-primary">Gallery</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore our café's atmosphere, events, and culinary creations
          </p>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-16 md:py-24 bg-background">
        <div className="container">
          <GalleryDisplay key={refreshKey} />
        </div>
      </section>

      {/* Upload Dialog */}
      <GalleryUpload
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSuccess={handleUploadSuccess}
      />

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-12">
        <div className="container text-center">
          <p>&copy; 2026 Urban Sip Café. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
