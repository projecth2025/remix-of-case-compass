import { useState, useCallback, useRef } from 'react';
import { Upload } from 'lucide-react';
import { generateId } from '@/lib/storage';
import { UploadedFile } from '@/lib/storage';

interface FileUploadDropzoneProps {
  onFilesAdded: (files: UploadedFile[]) => void;
  compact?: boolean;
}

const FileUploadDropzone = ({ onFilesAdded, compact = false }: FileUploadDropzoneProps) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes = [
    'application/pdf',
    'text/plain',
    'image/png',
    'image/jpeg',
    'image/jpg',
  ];

  const processFiles = useCallback(async (fileList: FileList) => {
    const validFiles: UploadedFile[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (acceptedTypes.includes(file.type)) {
        const dataURL = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        validFiles.push({
          id: generateId(),
          name: file.name,
          size: file.size,
          type: file.type,
          dataURL,
          fileCategory: 'Clinical Notes',
        });
      }
    }

    if (validFiles.length > 0) {
      onFilesAdded(validFiles);
    }
  }, [onFilesAdded]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  // Compact version for inline use
  if (compact) {
    return (
      <div
        className={`vmtb-dropzone p-6 ${isDragActive ? 'vmtb-dropzone-active' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.txt,.png,.jpeg,.jpg"
          onChange={handleInputChange}
          className="hidden"
        />
        <div className="flex items-center justify-center gap-3">
          <Upload className="w-6 h-6 text-muted-foreground" />
          <div className="text-left">
            <p className="text-sm font-medium text-foreground">Drop files here or click to upload</p>
            <p className="text-xs text-muted-foreground">Supports PDF, PNG, JPG, TXT</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`vmtb-dropzone ${isDragActive ? 'vmtb-dropzone-active' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.txt,.png,.jpeg,.jpg"
        onChange={handleInputChange}
        className="hidden"
      />
      
      <div className="flex flex-col items-center gap-4">
        <Upload className="w-12 h-12 text-foreground" strokeWidth={1.5} />
        <div>
          <p className="text-lg font-semibold text-foreground">Upload patient Documents</p>
          <p className="text-muted-foreground mt-1">
            Drag & drop or{' '}
            <span className="vmtb-link">choose file</span>{' '}
            to upload
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Supported file types: PDF, .txt, .png, .jpeg, .jpg
        </p>
      </div>
    </div>
  );
};

export default FileUploadDropzone;
