
"use client";

import React, { useState, useRef, type MouseEvent, useEffect, useCallback } from 'react';
import Image from 'next/image';
import type { RecyclingPoint, Category } from '@/types';
import { PointMarker } from './PointMarker';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RefreshCcw, User } from 'lucide-react'; // Added User icon
import { cn } from '@/lib/utils';


interface RecyclingMapProps {
  points: RecyclingPoint[]; 
  onPointSelect: (point: RecyclingPoint) => void; 
  categories: Category[]; 
  editingPointId: string | null; 
  onPointCoordinateChange: (pointId: string, newX: number, newY: number) => void; 
  isSelectingLocation: boolean; 
  currentEditingPointName?: string; // Optional name of the point being edited (for display messages).
  isAddingNewPointMode: boolean; // Boolean indicating if the user is currently adding a new point.
  onPlaceNewPoint: (newX: number, newY: number) => void; // Function to call when a new point is placed on the map.
  scale: number; // Initial map scale (map component manages its own scale internally after this).
  currentUserLocationMarker?: { x: number; y: number } | null; // Optional: coordinates for user's current location marker
}


export function RecyclingMap({
  points,
  onPointSelect,
  categories,
  editingPointId,
  onPointCoordinateChange,
  isSelectingLocation,
  currentEditingPointName,
  isAddingNewPointMode,
  onPlaceNewPoint,
  currentUserLocationMarker,
}: RecyclingMapProps) {
  const mapImageUrl = "https://cdn.vectorstock.com/i/2000v/13/96/thessaloniki-map-administrative-area-vector-48351396.avif";
  const [currentScale, setCurrentScale] = useState(1);
  const viewportRef = useRef<HTMLDivElement>(null);

  const imageWidth = 2000;
  const imageHeight = 1500;

  const [isPanning, setIsPanning] = useState(false); 
  const [panStartX, setPanStartX] = useState(0); 
  const [panStartY, setPanStartY] = useState(0); 
  const [scrollStartX, setScrollStartX] = useState(0); 
  const [scrollStartY, setScrollStartY] = useState(0); 

  const handleZoomIn = () => setCurrentScale(s => Math.min(s + 0.2, 3));
  const handleZoomOut = () => setCurrentScale(s => Math.max(s - 0.2, 0.5));

  const centerMap = useCallback(() => {
    if (viewportRef.current) {
      const viewportWidth = viewportRef.current.offsetWidth;
      const viewportHeight = viewportRef.current.offsetHeight;

      const scaledImageWidth = imageWidth * currentScale;
      const scaledImageHeight = imageHeight * currentScale;

      
      let scrollLeft = (scaledImageWidth - viewportWidth) / 2;
      let scrollTop = (scaledImageHeight - viewportHeight) / 2;
      scrollLeft = Math.max(0, scrollLeft);
      scrollTop = Math.max(0, scrollTop);

      viewportRef.current.scrollLeft = scrollLeft;
      viewportRef.current.scrollTop = scrollTop;
    }
  }, [currentScale]);

  const handleReset = () => {
    setCurrentScale(1);
    setTimeout(centerMap, 0);
  };

  useEffect(() => {
    centerMap();
  }, [currentScale, centerMap]); 


  /**
   * Handles the mouse down event on the map viewport.
   * Initiates panning if not in location selection mode.
   * @param {MouseEvent<HTMLDivElement>} e - The mouse event.
   */
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (!viewportRef.current || isSelectingLocation || isAddingNewPointMode) return; 

     if (e.target === viewportRef.current || (e.target as HTMLElement).closest('.map-image-container')) {
       e.preventDefault();
    }
    setIsPanning(true);
    setPanStartX(e.clientX); 
    setPanStartY(e.clientY);
    setScrollStartX(viewportRef.current.scrollLeft); 
    setScrollStartY(viewportRef.current.scrollTop);
  };

  /**
   * Handles the mouse move event on the map viewport.
   * Updates the scroll position to pan the map if panning is active.
   * @param {MouseEvent<HTMLDivElement>} e - The mouse event.
   */
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isPanning || !viewportRef.current || isSelectingLocation || isAddingNewPointMode) return; 
    e.preventDefault();
    const dx = e.clientX - panStartX; 
    const dy = e.clientY - panStartY; 
    viewportRef.current.scrollLeft = scrollStartX - dx;
    viewportRef.current.scrollTop = scrollStartY - dy;
  };

  const handleMouseUpOrLeave = () => {
    setIsPanning(false);
  };

  /**
   * Handles clicks on the map area itself (not on markers).
   * If in "add new point" mode, calls onPlaceNewPoint.
   * If in "edit and select location" mode, calls onPointCoordinateChange.
   * @param {MouseEvent<HTMLDivElement>} e - The mouse event.
   */
  const handleMapClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!viewportRef.current) return;

    if ((e.target as HTMLElement).closest('button[aria-label^="Recycling point"]') || (e.target as HTMLElement).closest('div[aria-label="Your current location"]')) {
      return;
    }
    const mapContainer = viewportRef.current.firstChild as HTMLDivElement;
    if (!mapContainer) return;

    const rect = mapContainer.getBoundingClientRect();

    let xOnImage = e.clientX - rect.left;
    let yOnImage = e.clientY - rect.top;

    let newXPercent = (xOnImage / (imageWidth * currentScale)) * 100;
    let newYPercent = (yOnImage / (imageHeight * currentScale)) * 100;
    newXPercent = Math.max(0, Math.min(100, newXPercent));
    newYPercent = Math.max(0, Math.min(100, newYPercent));

    if (isAddingNewPointMode) {
      onPlaceNewPoint(newXPercent, newYPercent);
    } else if (editingPointId && isSelectingLocation) { 
      onPointCoordinateChange(editingPointId, newXPercent, newYPercent);
    }
  };

  /**
   * Determines the appropriate CSS cursor style based on the current interaction mode.
   * @returns {string} Tailwind CSS class for the cursor.
   */
  const getCursorStyle = () => {
    if (isAddingNewPointMode || (editingPointId && isSelectingLocation)) {
      return "cursor-crosshair"; 
    }
    if (isPanning) {
      return "cursor-grabbing"; 
    }
    return "cursor-grab"; 
  };

  const baseLocationMarkerSize = 24; 
  let intrinsicLocationMarkerSize = baseLocationMarkerSize / currentScale;
  intrinsicLocationMarkerSize = Math.max(12, Math.min(50, intrinsicLocationMarkerSize));
  const locationMarkerStyle = {
    width: `${intrinsicLocationMarkerSize}px`,
    height: `${intrinsicLocationMarkerSize}px`,
  };


  return (
    <div className="relative w-full rounded-lg shadow-lg border border-border">
      {/* Viewport for the map with overflow hidden for panning and zoom */}
      <div
        ref={viewportRef}
        className={cn(
            "w-full h-[600px] overflow-hidden rounded-lg select-none", // select-none to prevent text selection during drag
            getCursorStyle() // Dynamic cursor style
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onClick={handleMapClick}
      >
        {/* Container for the map image, handles scaling */}
        <div
          className="relative transition-transform duration-200 ease-out map-image-container"
          style={{
            width: `${imageWidth}px`,
            height: `${imageHeight}px`,
            transform: `scale(${currentScale})`,
            transformOrigin: 'top left', // Scale from top-left for consistent scroll behavior
            // Disable smooth transform transition during active panning or point placement for better responsiveness
            transition: (isPanning || isSelectingLocation || isAddingNewPointMode) ? 'none' : 'transform 0.2s ease-out',
          }}
        >
          {/* The map image itself */}
          <Image
            src={mapImageUrl}
            alt="Map of Thessaloniki showing recycling points"
            width={imageWidth}
            height={imageHeight}
            className="block pointer-events-none" // pointer-events-none so clicks pass through to parent for panning/placement
            data-ai-hint="Thessaloniki map"
            draggable={false} // Prevent native browser image dragging
            priority // Prioritize loading of the map image
          />
          {/* Render each recycling point marker */}
          {points.map(point => (
            <PointMarker
              key={point.id}
              point={point}
              scale={currentScale} // Pass current map scale for dynamic marker sizing
              onClick={() => {
                // Logic for handling clicks on point markers
                if (!isSelectingLocation && !isAddingNewPointMode) { // If not in a special placement mode
                    if (!editingPointId || editingPointId === point.id) { // If not editing another point, or editing this one
                        onPointSelect(point);
                    } else { // If editing another point, still allow selecting this one (might show a toast in parent)
                        onPointSelect(point);
                    }
                } else if (isSelectingLocation && !isAddingNewPointMode) { // If selecting location for an existing point
                     onPointSelect(point); // Allow selecting the point itself (e.g., to recenter dialog if it were open)
                }
                // If isAddingNewPointMode is true, clicking an existing marker should ideally do nothing,
                // as the click is meant for placing a NEW point on an empty map area.
              }}
              categories={categories}
            />
          ))}

          {/* Render current user location marker if available */}
          {currentUserLocationMarker && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 p-1 rounded-full bg-blue-500 border-2 border-white shadow-lg flex items-center justify-center"
              style={{
                left: `${currentUserLocationMarker.x}%`,
                top: `${currentUserLocationMarker.y}%`,
                ...locationMarkerStyle,
              }}
              aria-label="Your current location"
            >
              <User className="text-white" style={{width: `${intrinsicLocationMarkerSize * 0.6}px`, height: `${intrinsicLocationMarkerSize * 0.6}px` }} strokeWidth={2.5} />
            </div>
          )}

        </div>
      </div>

      {/* Zoom and Reset controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col space-y-2">
        <Button
          onClick={handleZoomIn}
          variant="outline"
          size="icon"
          className="bg-background/80 hover:bg-background focus:ring-ring shadow-md rounded-full w-10 h-10"
          aria-label="Zoom In"
        >
          <ZoomIn className="h-5 w-5" />
        </Button>
        <Button
          onClick={handleZoomOut}
          variant="outline"
          size="icon"
          className="bg-background/80 hover:bg-background focus:ring-ring shadow-md rounded-full w-10 h-10"
          aria-label="Zoom Out"
        >
          <ZoomOut className="h-5 w-5" />
        </Button>
        <Button
          onClick={handleReset}
          variant="outline"
          size="icon"
          className="bg-background/80 hover:bg-background focus:ring-ring shadow-md rounded-full w-10 h-10"
          aria-label="Reset Zoom"
        >
          <RefreshCcw className="h-5 w-5" />
        </Button>
      </div>
      {/* Instructional message when selecting a new location for an existing point */}
      {(editingPointId && isSelectingLocation) && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 p-2 bg-primary text-primary-foreground rounded-md shadow-lg text-sm">
          Click on the map to move {currentEditingPointName || 'the selected point'}. Press 'Esc' to cancel.
        </div>
      )}
      {/* Message for adding new point mode is now handled in HomePage */}
    </div>
  );
}
    
