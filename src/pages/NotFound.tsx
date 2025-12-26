import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center animate-fade-in">
        {/* Logo */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-t from-primary to-primary/60 relative">
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-primary/80 to-transparent rounded-b-full" />
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-sky-300 rounded-full opacity-80" />
          </div>
        </div>

        <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Oops! The page you're looking for doesn't exist.
        </p>
        <Link
          to="/"
          className="vmtb-btn-primary inline-flex items-center gap-2"
        >
          <Home className="w-5 h-5" />
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
