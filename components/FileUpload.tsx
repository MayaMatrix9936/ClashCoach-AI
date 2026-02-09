import React, { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface FileUploadProps {
  label: string;
  onFileSelect: (file: File | null) => void;
  accept?: string;
  id: string;
  sampleUrl?: string;
  sampleFilename?: string;
  sampleLabel?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  label,
  onFileSelect,
  accept = "image/*",
  id,
  sampleUrl,
  sampleFilename,
  sampleLabel = "Use sample photo",
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    processFile(file);
  };

  const processFile = (file: File | undefined) => {
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      onFileSelect(file);
    } else {
      setPreview(null);
      onFileSelect(null);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    processFile(file);
  }, [onFileSelect]); // eslint-disable-line react-hooks/exhaustive-deps

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setPreview(null);
    onFileSelect(null);
    // Reset input value to allow re-selecting same file
    const input = document.getElementById(id) as HTMLInputElement;
    if (input) input.value = '';
  };

  const handleUseSample = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!sampleUrl) return;
    try {
      const response = await fetch(sampleUrl);
      if (!response.ok) throw new Error(`Failed to load sample image: ${response.status}`);
      const blob = await response.blob();
      const filename = sampleFilename || 'sample-image.png';
      const file = new File([blob], filename, { type: blob.type || 'image/png' });
      processFile(file);
    } catch (error) {
      console.error("Sample image load failed:", error);
      window.alert("Couldn't load the sample image. Please refresh or upload your own.");
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-semibold text-gray-300 mb-2 font-display uppercase tracking-wider">
        {label}
      </label>
      
      <div
        className={`relative group w-full h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-300 cursor-pointer overflow-hidden
          ${isDragging 
            ? 'border-gaming-accent bg-gaming-800/50 scale-[1.02]' 
            : 'border-gaming-700 bg-gaming-800 hover:border-gaming-600'
          }
          ${preview ? 'border-solid border-gaming-accent/50' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById(id)?.click()}
      >
        <input
          id={id}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleFileChange}
        />

        {preview ? (
          <>
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
            />
            <button
              onClick={clearFile}
              className="absolute top-2 right-2 p-1.5 bg-gaming-900/80 hover:bg-red-500 rounded-full text-white transition-colors backdrop-blur-sm border border-white/10"
            >
              <X size={16} />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gaming-900 to-transparent p-4">
               <span className="text-xs font-medium text-white bg-gaming-900/60 px-2 py-1 rounded backdrop-blur-md border border-white/10">Image Loaded</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400 p-4 text-center">
            <div className={`p-3 rounded-full mb-3 transition-colors ${isDragging ? 'bg-gaming-accent/20 text-gaming-accent' : 'bg-gaming-700 text-gray-400 group-hover:bg-gaming-700/80 group-hover:text-gray-300'}`}>
              <ImageIcon size={32} />
            </div>
            <p className="text-sm font-medium">
              <span className="text-gaming-accent">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
          </div>
        )}
      </div>
      {sampleUrl && (
        <button
          type="button"
          onClick={handleUseSample}
          className="mt-3 text-xs text-gaming-accent hover:text-white transition-colors underline underline-offset-4"
        >
          {sampleLabel}
        </button>
      )}
    </div>
  );
};

export default FileUpload;
