import { useState, useEffect } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ZoomIn, ZoomOut, Maximize, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { UploadedFile } from '@/lib/storage';

interface ZoomablePreviewProps {
  file: UploadedFile | null;
}

/**
 * ZoomablePreview component provides zoom and pan functionality for file previews.
 * Uses react-zoom-pan-pinch for smooth interactions.
 * Supports pinch-to-zoom on mobile and mouse wheel + drag on desktop.
 * For PDFs: displays anonymized pages if available, with page navigation.
 * Clears previous content and shows loader when switching files/pages.
 */
const ZoomablePreview = ({ file }: ZoomablePreviewProps) => {
  const [currentPdfPageIndex, setCurrentPdfPageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadedImageSrc, setLoadedImageSrc] = useState<string | null>(null);

  // Reset page index and loading state when file changes
  useEffect(() => {
    setCurrentPdfPageIndex(0);
    setLoadedImageSrc(null);
    
    if (file) {
      setIsLoading(true);
    }
  }, [file?.id]);

  // Handle image loading for current file/page
  useEffect(() => {
    if (!file) {
      setIsLoading(false);
      setLoadedImageSrc(null);
      return;
    }

    const hasAnonymizedPages = file.type === 'application/pdf' && 
      file.anonymizedPages && 
      file.anonymizedPages.length > 0;

    let imageSrc: string | null = null;

    if (file.type.startsWith('image/')) {
      imageSrc = file.anonymizedDataURL || file.dataURL;
    } else if (hasAnonymizedPages) {
      imageSrc = file.anonymizedPages![currentPdfPageIndex];
    }

    if (imageSrc) {
      setIsLoading(true);
      const img = new Image();
      img.onload = () => {
        setLoadedImageSrc(imageSrc);
        setIsLoading(false);
      };
      img.onerror = () => {
        setLoadedImageSrc(null);
        setIsLoading(false);
      };
      img.src = imageSrc;
    } else {
      setIsLoading(false);
    }
  }, [file?.id, file?.dataURL, file?.anonymizedDataURL, file?.anonymizedPages, currentPdfPageIndex]);

  // Handle PDF page navigation with immediate clear
  const handlePreviousPage = () => {
    setLoadedImageSrc(null);
    setIsLoading(true);
    setCurrentPdfPageIndex(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = (totalPages: number) => {
    setLoadedImageSrc(null);
    setIsLoading(true);
    setCurrentPdfPageIndex(prev => Math.min(totalPages - 1, prev + 1));
  };

  const renderLoadingState = () => (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  );

  if (!file) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
        Select a file to preview
      </div>
    );
  }

  // Check if this PDF has anonymized pages
  const hasAnonymizedPages = file.type === 'application/pdf' && 
    file.anonymizedPages && 
    file.anonymizedPages.length > 0;

  const renderPreview = () => {
    // For images
    if (file.type.startsWith('image/')) {
      if (isLoading || !loadedImageSrc) {
        return renderLoadingState();
      }
      return (
        <img
          src={loadedImageSrc}
          alt={file.name}
          className="max-w-full max-h-full object-contain"
          draggable={false}
        />
      );
    }

    // For PDFs with anonymized pages, render as images with page navigation
    if (hasAnonymizedPages) {
      const totalPages = file.anonymizedPages!.length;
      
      return (
        <div className="flex flex-col items-center w-full h-full">
          {/* Page navigation for multi-page PDFs */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2 py-2 bg-background/80 backdrop-blur-sm sticky top-0 z-10 w-full justify-center border-b border-border">
              <button
                onClick={handlePreviousPage}
                disabled={currentPdfPageIndex === 0 || isLoading}
                className="p-1 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-muted-foreground">
                Page {currentPdfPageIndex + 1} of {totalPages}
              </span>
              <button
                onClick={() => handleNextPage(totalPages)}
                disabled={currentPdfPageIndex === totalPages - 1 || isLoading}
                className="p-1 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
          <div className="flex-1 flex items-center justify-center p-2 overflow-auto w-full">
            {isLoading || !loadedImageSrc ? (
              renderLoadingState()
            ) : (
              <img
                src={loadedImageSrc}
                alt={`${file.name} - Page ${currentPdfPageIndex + 1}`}
                className="max-w-full max-h-full object-contain"
                draggable={false}
              />
            )}
          </div>
        </div>
      );
    }

    // For non-anonymized PDFs, use iframe (original behavior)
    if (file.type === 'application/pdf') {
      return (
        <iframe
          src={file.dataURL}
          title={file.name}
          className="w-full h-full"
        />
      );
    }

    if (file.type === 'text/plain') {
      const base64Content = file.dataURL.split(',')[1];
      const textContent = atob(base64Content);
      return (
        <pre className="p-4 text-sm text-foreground whitespace-pre-wrap font-mono">
          {textContent}
        </pre>
      );
    }

    return (
      <div className="text-center text-muted-foreground">
        Preview not available for this file type
      </div>
    );
  };

  // For non-anonymized PDFs and text files, use simple scroll
  if ((file.type === 'application/pdf' && !hasAnonymizedPages) || file.type === 'text/plain') {
    return (
      <div className="w-full h-full overflow-auto bg-background hide-scrollbar">
        {renderPreview()}
      </div>
    );
  }

  // For anonymized PDFs, use zoomable view with page navigation
  if (hasAnonymizedPages) {
    return (
      <div className="w-full h-full bg-background relative overflow-hidden">
        <TransformWrapper
          initialScale={1}
          minScale={0.5}
          maxScale={4}
          wheel={{ step: 0.1 }}
          pinch={{ step: 5 }}
          doubleClick={{ mode: 'reset' }}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              {/* Zoom Controls */}
              <div className="absolute top-3 right-3 z-10 flex gap-2">
                <button
                  onClick={() => zoomIn()}
                  className="w-8 h-8 bg-background/90 border border-border rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
                  aria-label="Zoom in"
                >
                  <ZoomIn className="w-4 h-4 text-foreground" />
                </button>
                <button
                  onClick={() => zoomOut()}
                  className="w-8 h-8 bg-background/90 border border-border rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
                  aria-label="Zoom out"
                >
                  <ZoomOut className="w-4 h-4 text-foreground" />
                </button>
                <button
                  onClick={() => resetTransform()}
                  className="w-8 h-8 bg-background/90 border border-border rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
                  aria-label="Fit to view"
                >
                  <Maximize className="w-4 h-4 text-foreground" />
                </button>
              </div>

              {/* Zoomable Content */}
              <TransformComponent
                wrapperClass="!w-full !h-full"
                contentClass="!w-full !h-full flex items-center justify-center"
              >
                {renderPreview()}
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-background relative overflow-hidden">
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={4}
        wheel={{ step: 0.1 }}
        pinch={{ step: 5 }}
        doubleClick={{ mode: 'reset' }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {/* Zoom Controls */}
            <div className="absolute top-3 right-3 z-10 flex gap-2">
              <button
                onClick={() => zoomIn()}
                className="w-8 h-8 bg-background/90 border border-border rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-4 h-4 text-foreground" />
              </button>
              <button
                onClick={() => zoomOut()}
                className="w-8 h-8 bg-background/90 border border-border rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-4 h-4 text-foreground" />
              </button>
              <button
                onClick={() => resetTransform()}
                className="w-8 h-8 bg-background/90 border border-border rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
                aria-label="Fit to view"
              >
                <Maximize className="w-4 h-4 text-foreground" />
              </button>
            </div>

            {/* Zoomable Content */}
            <TransformComponent
              wrapperClass="!w-full !h-full"
              contentClass="!w-full !h-full flex items-center justify-center"
            >
              {renderPreview()}
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
};

export default ZoomablePreview;