import { useState } from 'react';
import { X, Users } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface ResponsiveDrawerProps {
  children: React.ReactNode;
  title?: string;
}

/**
 * ResponsiveDrawer provides a sliding panel for mobile views.
 * On desktop, content is visible inline.
 * On mobile, content slides in from the left via a toggle button.
 */
const ResponsiveDrawer = ({ children, title = 'Experts' }: ResponsiveDrawerProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile drawer trigger - visible only on small screens */}
      <div className="md:hidden fixed top-20 left-4 z-40">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg shadow-lg hover:bg-primary/90 transition-colors"
              aria-label={`Open ${title}`}
            >
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">{title}</span>
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="p-4 border-b border-border">
              <SheetTitle>{title}</SheetTitle>
            </SheetHeader>
            <div className="overflow-y-auto h-[calc(100vh-4rem)]">
              {children}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop inline view - visible only on larger screens */}
      <div className="hidden md:block">
        {children}
      </div>
    </>
  );
};

export default ResponsiveDrawer;