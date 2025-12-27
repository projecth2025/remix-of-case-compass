import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChevronDown, Square, Circle, Pencil, Check, Eraser, CheckCircle, Undo2, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import ConfirmModal from '@/components/ConfirmModal';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';

type Tool = 'rectangle' | 'ellipse' | 'freehand' | 'erase' | null;

interface RedactionShape {
  id: string;
  type: 'rectangle' | 'ellipse' | 'freehand' | 'erase';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  points?: { x: number; y: number }[];
  strokeSize?: number;
  thickness?: number;
}

/**
 * Anonymize page - allows users to redact sensitive information from documents
 * before digitization. Users can draw rectangles, ellipses, or freehand strokes.
 * Supports image and PDF anonymization with redaction tools.
 */
const Anonymize = () => {
  const { fileIndex } = useParams();
  const navigate = useNavigate();
  const { 
    uploadedFiles,
    currentPatient,
    isEditMode,
    updateAnonymizedImage, 
    updateAnonymizedPDFPages, 
    markFileAsEdited,
    markAnonymizedVisited,
    getMissingAnonymization,
  } = useApp();
  const mode = isEditMode ? 'MODIFY' : 'CREATE';
  
  const currentIndex = parseInt(fileIndex || '0', 10);
  const currentFile = uploadedFiles[currentIndex];
  const totalFiles = uploadedFiles.length;
  const isLastFile = currentIndex === totalFiles - 1;
  const isFirstFile = currentIndex === 0;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedTool, setSelectedTool] = useState<Tool>(null);
  const [brushRadius, setBrushRadius] = useState(16); // Default medium size
  const [shapeThickness, setShapeThickness] = useState(2); // Default thickness
  const [shapes, setShapes] = useState<RedactionShape[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentShape, setCurrentShape] = useState<RedactionShape | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isFileLoading, setIsFileLoading] = useState(true); // Track file transitions
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  
  // PDF support
  const [isPDF, setIsPDF] = useState(false);
  const [pdfPages, setPdfPages] = useState<string[]>([]);
  const [currentPdfPageIndex, setCurrentPdfPageIndex] = useState(0);
  const [totalPdfPages, setTotalPdfPages] = useState(0);
  const [isLoadingPDF, setIsLoadingPDF] = useState(false);

  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [triggerShake, setTriggerShake] = useState(false);

  const strokeSizeValues = { small: 8, medium: 16, large: 24 };

  // Debug logging (dev-only)
  const logVisitedState = (reason: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[Anonymize] visited-state', reason, {
        currentIndex,
        currentFile: currentFile?.name,
        files: uploadedFiles.map(f => ({
          name: f.name,
          anonymizedVisited: f.anonymizedVisited,
          dirty: f.dirty,
          lastVisitedAt: f.lastVisitedAt,
        })),
      });
    }
  };

  // Mark file as visited immediately when user views it (via navigation, dropdown, etc.)
  // Also reset loading state when file changes
  useEffect(() => {
    if (currentFile) {
      // Reset loading state immediately when file changes
      setIsFileLoading(true);
      setImageLoaded(false);
      markAnonymizedVisited(currentFile.id);
      logVisitedState(`file viewed: ${currentFile.name}`);
    }
  }, [currentIndex, currentFile?.id]);

  // Set up PDF.js worker with proper path
  useEffect(() => {
    // Use CDN for the PDF.js worker for better compatibility
    GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;
  }, []);

  // Load PDF pages with ArrayBuffer
  const loadPDFPages = useCallback(async (file: typeof currentFile) => {
    if (!file || file.type !== 'application/pdf') {
      setIsPDF(false);
      setPdfPages([]);
      setIsLoadingPDF(false);
      return;
    }

    // Reset state before loading
    setImageLoaded(false);
    setPdfPages([]);
    setCurrentPdfPageIndex(0);
    setIsLoadingPDF(true);

    try {
      // Convert data URL to ArrayBuffer
      const response = await fetch(file.dataURL);
      const buffer = await response.arrayBuffer();
      
      // Load PDF with ArrayBuffer instead of data URL
      const pdf = await getDocument({ data: buffer }).promise;
      setTotalPdfPages(pdf.numPages);
      
      const pages: string[] = [];
      // Load all pages (up to 50 for reasonable limit)
      for (let i = 1; i <= Math.min(pdf.numPages, 50); i++) {
        try {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            await page.render({
              canvasContext: ctx,
              viewport,
            }).promise;
            pages.push(canvas.toDataURL('image/png'));
          }
        } catch (pageError) {
          console.error(`Error loading PDF page ${i}:`, pageError);
          // Continue with next page instead of failing
        }
      }
      
      if (pages.length === 0) {
        toast.error('Failed to render any PDF pages');
        setIsPDF(false);
        setIsLoadingPDF(false);
        return;
      }
      
      setPdfPages(pages);
      setCurrentPdfPageIndex(0);
      setIsPDF(true);
      setImageLoaded(true);
      setIsFileLoading(false);
      setIsLoadingPDF(false);
    } catch (error) {
      console.error('Error loading PDF:', error);
      toast.error('Failed to load PDF file');
      setIsPDF(false);
      setIsLoadingPDF(false);
    }
  }, []);

  // Get the image to display (anonymized if available, otherwise original)
  const getDisplayImage = useCallback((): string | undefined => {
    if (isPDF && pdfPages.length > 0) {
      // Check if we have anonymized pages for this PDF
      if (currentFile?.anonymizedPages && currentFile.anonymizedPages.length > currentPdfPageIndex) {
        return currentFile.anonymizedPages[currentPdfPageIndex];
      }
      return pdfPages[currentPdfPageIndex];
    }
    return currentFile?.anonymizedDataURL || currentFile?.dataURL;
  }, [currentFile?.anonymizedDataURL, currentFile?.dataURL, currentFile?.anonymizedPages, isPDF, pdfPages, currentPdfPageIndex]);

  // Load and draw image on canvas (or load PDF pages)
  useEffect(() => {
    if (!currentFile || !canvasRef.current) return;

    // Reset shapes when file changes
    setShapes([]);

    // Check if this is a PDF
    if (currentFile.type === 'application/pdf') {
      loadPDFPages(currentFile);
      return;
    }

    // Handle regular images
    setIsPDF(false);
    setPdfPages([]);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Set canvas size to match image
      canvas.width = img.width;
      canvas.height = img.height;
      setImageDimensions({ width: img.width, height: img.height });
      
      // Draw image
      ctx.drawImage(img, 0, 0);
      setImageLoaded(true);
      setIsFileLoading(false);
    };
    img.onerror = () => {
      console.error('Failed to load image');
      toast.error('Failed to load image');
    };
    img.src = currentFile.anonymizedDataURL || currentFile.dataURL;
  }, [currentFile?.id, loadPDFPages]);

  // Redraw canvas with shapes
  const redrawCanvas = useCallback(() => {
    if (!canvasRef.current) return;

    // For PDFs, don't redraw here - it's handled by the displayImage effect
    if (isPDF && pdfPages.length > 0) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw PDF page as image
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        // Draw all shapes on top
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';

        [...shapes, currentShape].filter(Boolean).forEach(shape => {
          if (!shape) return;
          
          if (shape.type === 'rectangle') {
            const x = Math.min(shape.startX, shape.endX);
            const y = Math.min(shape.startY, shape.endY);
            const width = Math.abs(shape.endX - shape.startX);
            const height = Math.abs(shape.endY - shape.startY);
            ctx.lineWidth = shape.thickness || shapeThickness;
            ctx.fillRect(x, y, width, height);
            ctx.strokeRect(x, y, width, height);
          } else if (shape.type === 'ellipse') {
            const centerX = (shape.startX + shape.endX) / 2;
            const centerY = (shape.startY + shape.endY) / 2;
            const radiusX = Math.abs(shape.endX - shape.startX) / 2;
            const radiusY = Math.abs(shape.endY - shape.startY) / 2;
            ctx.lineWidth = shape.thickness || shapeThickness;
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          } else if (shape.type === 'freehand' && shape.points) {
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = shape.strokeSize || brushRadius;
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
            ctx.beginPath();
            shape.points.forEach((point, idx) => {
              if (idx === 0) {
                ctx.moveTo(point.x, point.y);
              } else {
                ctx.lineTo(point.x, point.y);
              }
            });
            ctx.stroke();
          }
        });
      };
      img.src = getDisplayImage() || '';
      return;
    }

    if (!imageLoaded) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Redraw image
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      // Draw all shapes
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';

      [...shapes, currentShape].filter(Boolean).forEach(shape => {
        if (!shape) return;

        if (shape.type === 'rectangle') {
          const x = Math.min(shape.startX, shape.endX);
          const y = Math.min(shape.startY, shape.endY);
          const width = Math.abs(shape.endX - shape.startX);
          const height = Math.abs(shape.endY - shape.startY);
          ctx.lineWidth = shape.thickness || shapeThickness;
          ctx.fillRect(x, y, width, height);
          ctx.strokeRect(x, y, width, height);
        } else if (shape.type === 'ellipse') {
          const centerX = (shape.startX + shape.endX) / 2;
          const centerY = (shape.startY + shape.endY) / 2;
          const radiusX = Math.abs(shape.endX - shape.startX) / 2;
          const radiusY = Math.abs(shape.endY - shape.startY) / 2;
          ctx.lineWidth = shape.thickness || shapeThickness;
          ctx.beginPath();
          ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else if (shape.type === 'freehand' && shape.points) {
          ctx.save();
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.lineWidth = shape.strokeSize || brushRadius;
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
          // Apply vertical scaling to make brush strokes vertical
          ctx.scale(1, 2);
          ctx.beginPath();
          shape.points.forEach((point, idx) => {
            if (idx === 0) {
              ctx.moveTo(point.x, point.y / 2);
            } else {
              ctx.lineTo(point.x, point.y / 2);
            }
          });
          ctx.stroke();
          ctx.restore();
        }
      });
    };
    img.src = getDisplayImage() || '';
  }, [shapes, currentShape, imageLoaded, getDisplayImage, brushRadius, shapeThickness, isPDF, pdfPages]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Set canvas dimensions when PDF pages are loaded and draw the PDF page
  useEffect(() => {
    if (!isPDF || pdfPages.length === 0 || !canvasRef.current) return;

    const displaySrc = getDisplayImage();
    if (!displaySrc) return;

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Set canvas size to match the PDF page image
      canvas.width = img.width;
      canvas.height = img.height;
      setImageDimensions({ width: img.width, height: img.height });
      
      // Draw the PDF page
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setImageLoaded(true);
      setIsFileLoading(false);
      
      // Reset shapes when changing PDF pages
      setShapes([]);
    };
    img.onerror = () => {
      console.error('Failed to load PDF page image');
    };
    img.src = displaySrc;
  }, [isPDF, pdfPages, currentPdfPageIndex, getDisplayImage]);

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedTool) return;

    const { x, y } = getCanvasCoordinates(e);
    setIsDrawing(true);

    if (selectedTool === 'erase') {
      // For erase tool, we'll start tracking points to check for intersections
      const newShape: RedactionShape = {
        id: Date.now().toString(),
        type: 'erase',
        startX: x,
        startY: y,
        endX: x,
        endY: y,
        points: [{ x, y }],
        strokeSize: brushRadius,
      };
      setCurrentShape(newShape);
      return;
    }

    const newShape: RedactionShape = {
      id: Date.now().toString(),
      type: selectedTool as 'rectangle' | 'ellipse' | 'freehand',
      startX: x,
      startY: y,
      endX: x,
      endY: y,
      points: selectedTool === 'freehand' ? [{ x, y }] : undefined,
      strokeSize: selectedTool === 'freehand' ? brushRadius : undefined,
      thickness: (selectedTool === 'rectangle' || selectedTool === 'ellipse') ? shapeThickness : undefined,
    };

    setCurrentShape(newShape);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentShape) return;

    const { x, y } = getCanvasCoordinates(e);

    if (currentShape.type === 'freehand' || currentShape.type === 'erase') {
      setCurrentShape(prev => prev ? {
        ...prev,
        points: [...(prev.points || []), { x, y }],
        endX: x,
        endY: y,
      } : null);
    } else {
      setCurrentShape(prev => prev ? { ...prev, endX: x, endY: y } : null);
    }
  };

  // Check if a point is inside a rectangle
  const isPointInRectangle = (px: number, py: number, x: number, y: number, w: number, h: number): boolean => {
    return px >= x && px <= x + w && py >= y && py <= y + h;
  };

  // Check if a point is inside an ellipse
  const isPointInEllipse = (px: number, py: number, centerX: number, centerY: number, radiusX: number, radiusY: number): boolean => {
    const dx = px - centerX;
    const dy = py - centerY;
    return (dx * dx) / (radiusX * radiusX) + (dy * dy) / (radiusY * radiusY) <= 1;
  };

  // Check if a point is near a line segment (for freehand)
  const isPointNearLine = (px: number, py: number, x1: number, y1: number, x2: number, y2: number, threshold: number): boolean => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    const distance = Math.hypot(px - projX, py - projY);
    return distance <= threshold;
  };

  const handleMouseUp = () => {
    if (currentShape) {
      if (currentShape.type === 'erase' && currentShape.points) {
        // Erase: remove shapes that intersect with the erase stroke
        const erasePoints = currentShape.points;
        const threshold = (currentShape.strokeSize || brushRadius) * 1.5;

        setShapes(prevShapes => {
          return prevShapes.filter(shape => {
            // Check if this shape intersects with any erase stroke point
            for (const erasePt of erasePoints) {
              if (shape.type === 'rectangle') {
                const x = Math.min(shape.startX, shape.endX);
                const y = Math.min(shape.startY, shape.endY);
                const w = Math.abs(shape.endX - shape.startX);
                const h = Math.abs(shape.endY - shape.startY);
                if (isPointInRectangle(erasePt.x, erasePt.y, x - threshold, y - threshold, w + threshold * 2, h + threshold * 2)) {
                  return false; // Remove this shape
                }
              } else if (shape.type === 'ellipse') {
                const centerX = (shape.startX + shape.endX) / 2;
                const centerY = (shape.startY + shape.endY) / 2;
                const radiusX = Math.abs(shape.endX - shape.startX) / 2 + threshold;
                const radiusY = Math.abs(shape.endY - shape.startY) / 2 + threshold;
                if (isPointInEllipse(erasePt.x, erasePt.y, centerX, centerY, radiusX, radiusY)) {
                  return false; // Remove this shape
                }
              } else if (shape.type === 'freehand' && shape.points) {
                // Check if erase stroke intersects with freehand strokes
                for (let i = 0; i < shape.points.length - 1; i++) {
                  if (isPointNearLine(erasePt.x, erasePt.y, shape.points[i].x, shape.points[i].y, shape.points[i + 1].x, shape.points[i + 1].y, threshold)) {
                    return false; // Remove this shape
                  }
                }
              }
            }
            return true; // Keep this shape
          });
        });
      } else {
        // Regular shape drawing
        setShapes(prev => [...prev, currentShape]);
      }
      setCurrentShape(null);
    }
    setIsDrawing(false);
  };

  const handleAnonymize = () => {
    if (!canvasRef.current || shapes.length === 0) {
      toast.error('Please draw at least one redaction region');
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw all shapes as solid black (permanent)
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#000000';

    shapes.forEach(shape => {
      if (shape.type === 'rectangle') {
        const x = Math.min(shape.startX, shape.endX);
        const y = Math.min(shape.startY, shape.endY);
        const width = Math.abs(shape.endX - shape.startX);
        const height = Math.abs(shape.endY - shape.startY);
        ctx.lineWidth = shape.thickness || shapeThickness;
        ctx.fillRect(x, y, width, height);
      } else if (shape.type === 'ellipse') {
        const centerX = (shape.startX + shape.endX) / 2;
        const centerY = (shape.startY + shape.endY) / 2;
        const radiusX = Math.abs(shape.endX - shape.startX) / 2;
        const radiusY = Math.abs(shape.endY - shape.startY) / 2;
        ctx.lineWidth = shape.thickness || shapeThickness;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (shape.type === 'freehand' && shape.points) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = shape.strokeSize || brushRadius;
        ctx.beginPath();
        shape.points.forEach((point, idx) => {
          if (idx === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.stroke();
      }
    });

    // Save the anonymized image
    const anonymizedDataURL = canvas.toDataURL('image/png');
    
    if (isPDF) {
      // For PDFs, update the current page in the anonymized pages array
      const updatedPages = [...(currentFile?.anonymizedPages || pdfPages)];
      updatedPages[currentPdfPageIndex] = anonymizedDataURL;
      updateAnonymizedPDFPages(currentFile.id, updatedPages);
    } else {
      // For regular images
      updateAnonymizedImage(currentFile.id, anonymizedDataURL);
    }

    // Note: updateAnonymizedImage/updateAnonymizedPDFPages now handle the visited flags:
    // - In edit mode: keeps anonymizedVisited=true, sets digitizedVisited=false
    // - In create mode: sets anonymizedVisited=false, sets digitizedVisited=false
    logVisitedState(`file edited (anonymized): ${currentFile.name}`);

    // Mark file as edited in edit mode
    if (mode === 'MODIFY') {
      markFileAsEdited(currentFile.id);
    }

    // Clear shapes after anonymization
    setShapes([]);
    toast.success('Document anonymized successfully');
  };

  const handleNext = () => {
    if (isLastFile) {
      // On last file, "Next" should go to digitization
      handleGoToDigitization();
    } else {
      navigate(`/upload/anonymize/${currentIndex + 1}`);
    }
  };

  const handleGoToDigitization = () => {
    // Use functional update to mark current file as visited and validate atomically
    // This ensures we validate against the latest state, not a stale closure
    const updatedFiles = uploadedFiles.map((f, i) =>
      i === currentIndex 
        ? { ...f, anonymizedVisited: true, dirty: false, lastVisitedAt: Date.now() }
        : f
    );
    
    logVisitedState('before final validation (Go to Digitization)');
    
    // Validate using the updated files array
    const missingFiles = getMissingAnonymization(updatedFiles);
    if (missingFiles.length > 0) {
      setTriggerShake(true);
      setTimeout(() => setTriggerShake(false), 300);
      setShowIncompleteModal(true);
      logVisitedState(`validation failed: missing ${missingFiles.length} files`);
      return;
    }
    
    // Update state with visited flag
    markAnonymizedVisited(currentFile.id);
    logVisitedState('validation passed, proceeding to digitization');
    
    // Navigate to digitization
    navigate('/upload/preview/0');
  };

  const handleGoBackToIncomplete = () => {
    setShowIncompleteModal(false);
    const missingFiles = getMissingAnonymization();
    if (missingFiles.length > 0) {
      const firstMissing = uploadedFiles.find(f => missingFiles.includes(f.name));
      if (firstMissing) {
        const index = uploadedFiles.findIndex(f => f.id === firstMissing.id);
        if (index >= 0) {
          navigate(`/upload/anonymize/${index}`);
        }
      }
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      navigate(`/upload/anonymize/${currentIndex - 1}`);
    }
  };

  const handleFileSelect = (index: number) => {
    // Navigation will trigger useEffect which marks file as visited
    navigate(`/upload/anonymize/${index}`);
  };

  const handleBackToUpload = () => {
    navigate('/upload/review');
  };

  if (!currentPatient || !currentFile) {
    navigate('/home');
    return null;
  }

  // Show canvas for images and PDFs
  const isImage = currentFile.type.startsWith('image/') || currentFile.type === 'application/pdf';

  return (
    <div className={`h-screen bg-muted flex flex-col overflow-hidden overscroll-y-none ${triggerShake ? 'shake' : ''}`}>
      <Header />
      
      {/* Compact Navigation Header */}
      <div className="bg-background border-b border-border px-3 py-1.5 flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          {/* Left: Back to Upload */}
          <button
            onClick={handleBackToUpload}
            className="vmtb-btn-outline flex items-center gap-1 px-2.5 py-1 text-xs flex-shrink-0"
            aria-label="Back to uploads"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Upload
          </button>

          {/* Center: File Name with Dropdown + File Type */}
          <div className="flex items-center gap-2 min-w-0 flex-1 justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary truncate max-w-[180px] md:max-w-[280px]">
                  <span className="truncate">{currentFile.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="max-h-60 overflow-y-auto">
                {uploadedFiles.map((file, index) => (
                  <DropdownMenuItem
                    key={file.id}
                    onClick={() => handleFileSelect(index)}
                    className={index === currentIndex ? 'bg-primary/10' : ''}
                  >
                    <div className="flex items-center justify-between gap-3 w-full group">
                      <span className={file.name.length > 100 ? 'truncate max-w-[200px]' : ''}>
                        {file.name.length > 100 ? file.name.substring(0, 97) + '...' : file.name}
                      </span>
                      {file.anonymizedVisited && (
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 file-row-tick" />
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* File Type Tag */}
            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium flex-shrink-0">
              {currentFile.fileCategory}
            </span>
          </div>
          {/* Right: Buttons based on CREATE vs MODIFY mode */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevious}
              disabled={isFirstFile}
              className="vmtb-btn-outline flex items-center gap-1 px-2.5 py-1 text-xs disabled:opacity-50 flex-shrink-0"
              aria-label="Previous file"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Previous
            </button>
            {mode === 'CREATE' ? (
              // CREATE mode: Next on non-last, Go to Digitization on last
              <>
                {!isLastFile && (
                  <button 
                    onClick={handleNext} 
                    className="vmtb-btn-primary flex items-center gap-1 px-2.5 py-1 text-xs flex-shrink-0"
                    aria-label="Next file"
                  >
                    Next
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                {isLastFile && (
                  <button
                    onClick={handleGoToDigitization}
                    className="vmtb-btn-primary flex items-center gap-1 px-2.5 py-1 text-xs flex-shrink-0"
                    aria-label="Go to digitization"
                  >
                    Go to Digitization
                  </button>
                )}
              </>
            ) : (
              // MODIFY mode: Next on non-last, Go to Digitization always visible
              <>
                {!isLastFile && (
                  <button 
                    onClick={handleNext} 
                    className="vmtb-btn-primary flex items-center gap-1 px-2.5 py-1 text-xs flex-shrink-0"
                    aria-label="Next file"
                  >
                    Next
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={handleGoToDigitization}
                  className="vmtb-btn-primary flex items-center gap-1 px-2.5 py-1 text-xs flex-shrink-0"
                  aria-label="Go to digitization"
                >
                  Go to Digitization
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <main className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Sidebar - Tools Panel (Vertical, Full Height, No Scroll) */}
        <div className="w-24 bg-background border-r border-border p-3 flex flex-col gap-3 flex-shrink-0 h-full overflow-hidden">
          <p className="text-[10px] text-muted-foreground text-center font-medium">Tools</p>
          
          {/* Rectangle Tool */}
          <button
            onClick={() => setSelectedTool(selectedTool === 'rectangle' ? null : 'rectangle')}
            className={`w-full py-2 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors text-center ${
              selectedTool === 'rectangle' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted hover:bg-muted/80 text-foreground'
            }`}
            title="Rectangle redaction"
          >
            <Square className="w-4 h-4" />
            <span className="text-[8px] font-medium">Rectangle</span>
          </button>

          {/* Ellipse Tool */}
          <button
            onClick={() => setSelectedTool(selectedTool === 'ellipse' ? null : 'ellipse')}
            className={`w-full py-2 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors text-center ${
              selectedTool === 'ellipse' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted hover:bg-muted/80 text-foreground'
            }`}
            title="Ellipse redaction"
          >
            <Circle className="w-4 h-4" />
            <span className="text-[8px] font-medium">Ellipse</span>
          </button>

          {/* Freehand Tool */}
          <button
            onClick={() => setSelectedTool(selectedTool === 'freehand' ? null : 'freehand')}
            className={`w-full py-2 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors text-center ${
              selectedTool === 'freehand' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted hover:bg-muted/80 text-foreground'
            }`}
            title="Freehand redaction"
          >
            <Pencil className="w-4 h-4" />
            <span className="text-[8px] font-medium">Freehand</span>
          </button>

          {/* Erase Tool */}
          <button
            onClick={() => setSelectedTool(selectedTool === 'erase' ? null : 'erase')}
            className={`w-full py-2 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors text-center ${
              selectedTool === 'erase' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted hover:bg-muted/80 text-foreground'
            }`}
            title="Erase marks"
          >
            <Eraser className="w-4 h-4" />
            <span className="text-[8px] font-medium">Erase</span>
          </button>

          {/* Divider */}
          <div className="border-t border-border my-1" />

          {/* Stroke Size Slider (only for freehand or erase) */}
          {(selectedTool === 'freehand' || selectedTool === 'erase') && (
            <div className="space-y-2">
              <p className="text-[8px] text-muted-foreground font-medium text-center">Brush Size</p>
              <input
                type="range"
                min="2"
                max="50"
                value={brushRadius}
                onChange={e => setBrushRadius(parseInt(e.target.value, 10))}
                className="w-full cursor-pointer h-1"
              />
              <p className="text-[8px] text-muted-foreground text-center font-medium">{brushRadius}px</p>
            </div>
          )}

          {/* Thickness Slider (for rectangle and ellipse) */}
          {(selectedTool === 'rectangle' || selectedTool === 'ellipse') && (
            <div className="space-y-2">
              <p className="text-[8px] text-muted-foreground font-medium text-center">Thickness</p>
              <input
                type="range"
                min="1"
                max="20"
                value={shapeThickness}
                onChange={e => setShapeThickness(parseInt(e.target.value, 10))}
                className="w-full cursor-pointer h-1"
              />
              <p className="text-[8px] text-muted-foreground text-center font-medium">{shapeThickness}px</p>
            </div>
          )}

          {/* Undo Tool - Always visible */}
          <button
            onClick={() => setShapes(prev => prev.slice(0, -1))}
            disabled={shapes.length === 0}
            className={`w-full py-2 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors text-center ${
              shapes.length > 0 
                ? 'bg-muted hover:bg-muted/80 text-foreground' 
                : 'bg-muted/50 text-muted-foreground cursor-not-allowed'
            }`}
            title="Undo last action"
          >
            <Undo2 className="w-4 h-4" />
            <span className="text-[8px] font-medium">Undo</span>
          </button>
        </div>

        {/* Right: Canvas Area with Zoom */}
        <div className="flex-1 p-3 overflow-hidden flex flex-col" ref={containerRef}>
          <div className="flex-1 rounded-lg overflow-hidden bg-background relative border border-border">
            {/* File Loading Overlay - shows when switching between files */}
            {(isFileLoading || isLoadingPDF) && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                <p className="text-sm text-muted-foreground">
                  {isLoadingPDF ? 'Loading PDF...' : 'Loading document...'}
                </p>
              </div>
            )}
            
            {isImage ? (
              <TransformWrapper
                initialScale={1}
                minScale={0.5}
                maxScale={4}
                wheel={{ step: 0.1 }}
                pinch={{ step: 5 }}
                doubleClick={{ mode: 'reset' }}
                disabled={!!selectedTool}
              >
                {({ zoomIn, zoomOut, resetTransform }) => (
                  <>
                    {/* Zoom Controls + Anonymize Button + PDF Info */}
                    <div className="absolute top-3 right-3 z-10 flex gap-2 items-center">
                      {isPDF && totalPdfPages > 0 && (
                        <div className="px-3 py-1.5 bg-background/90 border border-border rounded-lg text-xs text-foreground">
                          Page {currentPdfPageIndex + 1} of {totalPdfPages}
                        </div>
                      )}
                      
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
                      
                      {/* Anonymize Button */}
                      <button
                        onClick={handleAnonymize}
                        disabled={shapes.length === 0}
                        className="h-8 px-3 bg-primary text-primary-foreground rounded-lg flex items-center gap-1.5 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium"
                        aria-label="Anonymize"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Anonymize
                      </button>
                    </div>

                    {/* Canvas */}
                    <TransformComponent
                      wrapperClass="!w-full !h-full"
                      contentClass="!w-full !h-full flex items-center justify-center"
                    >
                      <canvas
                        ref={canvasRef}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        className={`max-w-full max-h-full object-contain ${
                          selectedTool ? 'cursor-crosshair' : 'cursor-grab'
                        }`}
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '100%',
                          width: imageDimensions.width > 0 ? 'auto' : '100%',
                          height: imageDimensions.height > 0 ? 'auto' : '100%',
                        }}
                      />
                    </TransformComponent>
                  </>
                )}
              </TransformWrapper>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4">
                <p className="text-sm mb-2">Anonymization is not available for this file type.</p>
                <p className="text-xs">This file type ({currentFile.type}) will be processed as-is.</p>
                <button
                  onClick={handleNext}
                  className="vmtb-btn-primary mt-4 text-sm px-4 py-2"
                >
                  Continue to Next File
                </button>
              </div>
            )}
          </div>

          {/* PDF Page Navigation */}
          {isPDF && pdfPages.length > 1 && (
            <div className="mt-3 flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPdfPageIndex(prev => Math.max(0, prev - 1))}
                disabled={currentPdfPageIndex === 0}
                className="vmtb-btn-outline flex items-center gap-1 px-3 py-1.5 text-xs disabled:opacity-50"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Previous Page
              </button>
              <span className="text-xs text-muted-foreground px-3">
                Page {currentPdfPageIndex + 1} of {pdfPages.length}
              </span>
              <button
                onClick={() => setCurrentPdfPageIndex(prev => Math.min(pdfPages.length - 1, prev + 1))}
                disabled={currentPdfPageIndex === pdfPages.length - 1}
                className="vmtb-btn-outline flex items-center gap-1 px-3 py-1.5 text-xs disabled:opacity-50"
              >
                Next Page
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Incomplete Documents Warning Modal */}
      <ConfirmModal
        open={showIncompleteModal}
        onOpenChange={setShowIncompleteModal}
        title="Some documents are incomplete"
        description={`Please complete the following documents before proceeding: ${getMissingAnonymization().join(', ')}`}
        confirmLabel="Go Back & Complete"
        cancelLabel=""
        onConfirm={handleGoBackToIncomplete}
        onCancel={() => setShowIncompleteModal(false)}
      />
    </div>
  );
};

export default Anonymize;
