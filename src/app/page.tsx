
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { RecyclingPoint, RecyclingCategoryEnum, Category, ProblemReport } from '@/types';
import { AppHeader } from '@/components/AppHeader';
import { RecyclingMap } from '@/components/RecyclingMap';
import { CategoryFilter } from '@/components/CategoryFilter';
import { PointDetailsDialog } from '@/components/PointDetailsDialog';
import { INITIAL_CATEGORIES, SimpleGlassBottleIcon } from '@/lib/data.tsx';
import { getRecyclingPointsFromDB, addRecyclingPointToDB, updateRecyclingPointInDB, deleteRecyclingPointFromDB } from '@/services/recyclingPointsService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { PlusCircle, Loader2, AlertTriangle, LocateFixed } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';


/**
 * Main HomePage component for the Thessaloniki RecycleFinder application.
 * Manages the state for recycling points, categories, filters, and user interactions.
 * It allows users to add new points, edit existing points (name, category, location, description),
 * delete points, filter points by category, and report problems.
 * Data is fetched from and saved to Firestore.
 */
export default function HomePage() {
  const { toast } = useToast();

  // State for all recycling points, fetched from Firestore
  const [allPoints, setAllPoints] = useState<RecyclingPoint[]>([]);
  // State for the available recycling categories, initialized with default categories.
  // This list is now fixed and not user-modifiable for category *types*.
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  // State for the currently selected category IDs for filtering
  const [selectedCategories, setSelectedCategories] = useState<RecyclingCategoryEnum[]>([]);
  // State for the currently selected recycling point to show details or edit
  const [selectedPoint, setSelectedPoint] = useState<RecyclingPoint | null>(null);
  // State to track if the component has mounted on the client-side to avoid hydration issues
  const [isClient, setIsClient] = useState(false);

  // State to track the ID of the point currently being edited
  const [editingPointId, setEditingPointId] = useState<string | null>(null);
  // State to track if the user is currently selecting a new location on the map for an existing point
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);

  // State to track if the user is in the mode of adding a new recycling point
  const [isAddingNewPointMode, setIsAddingNewPointMode] = useState(false);
  // State to store the category selected for a new point before it's placed on the map
  const [categoryForNewPoint, setCategoryForNewPoint] = useState<RecyclingCategoryEnum>('');

  // State to manage loading status, primarily for fetching initial data from Firestore
  const [isLoading, setIsLoading] = useState(true);
  // State to store any error messages, primarily for data fetching errors
  const [error, setError] = useState<string | null>(null);

  // State for displaying a temporary marker for the user's current location
  const [currentUserLocationMarker, setCurrentUserLocationMarker] = useState<{ x: number; y: number } | null>(null);


  /**
   * Callback function to close the PointDetailsDialog.
   * Resets selection and editing states.
   */
  const handleCloseDialog = useCallback(() => {
    setSelectedPoint(null);
    setEditingPointId(null); // Ensure editing mode is exited when dialog closes
    setIsSelectingLocation(false); // Ensure location selection mode is exited
  }, []);

  /**
   * useEffect hook to initialize the component on the client side.
   * Fetches initial recycling points from Firestore and sets default category filters.
   */
  useEffect(() => {
    setIsClient(true);
    setIsLoading(true);
    setError(null); // Reset error state on mount

    const fetchPoints = async () => {
      try {
        console.log("HomePage: Attempting to fetch points from DB...");
        const pointsFromDB = await getRecyclingPointsFromDB();
        setAllPoints(pointsFromDB);
        console.log("HomePage: Successfully fetched points:", pointsFromDB.length);
      } catch (err: any) {
        const originalError = err.cause || err; // Get the original error if it's wrapped
        let userFriendlyMessage = `Failed to load recycling points: ${err.message}. `;

        // Check for Firebase-specific error properties
        if (originalError.code && originalError.message) {
          userFriendlyMessage += `(Firebase Error: ${originalError.code} - ${originalError.message}) `;
          if (originalError.code === 'permission-denied' || originalError.code === 'unauthenticated') {
            userFriendlyMessage += "This often means your Firestore Security Rules are too restrictive or you're not authenticated correctly. ";
          }
        } else if (err.message.includes("Firestore database (db) is not initialized")) {
           userFriendlyMessage += "This indicates a problem with the Firebase setup. Please check your `src/lib/firebase.ts` file and ensure all Firebase config variables are correct and that Firebase was initialized successfully (check SERVER terminal logs for 'Firebase app initialized' messages). Also verify Firestore is enabled in your Firebase project console. ";
        } else if (err.message.includes("Missing or insufficient permissions")) {
            userFriendlyMessage += "This is a Firebase permissions error. Please check your Firestore Security Rules in the Firebase console. For development, ensure `recyclingPoints` collection allows read access. ";
        }


        userFriendlyMessage += "Verify your Firebase configuration (especially the `projectId` in `src/lib/firebase.ts` and that it matches your Firebase project console) and ensure your Firestore security rules allow read access to the 'recyclingPoints' collection. ";
        userFriendlyMessage += "See browser developer console AND SERVER terminal for more specific Firebase errors.";


        console.error("HomePage: Error fetching recycling points:", userFriendlyMessage, originalError);
        setError(userFriendlyMessage);
        toast({
          title: "Error Loading Recycling Points",
          description: userFriendlyMessage,
          variant: "destructive",
          duration: 30000, // Increased duration for critical errors
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPoints();
    // Set initial category filters to include all categories
    setSelectedCategories(INITIAL_CATEGORIES.map(cat => cat.id));
  }, [toast]);

  /**
   * Handles changes to the selected category filters.
   * Updates the `selectedCategories` state based on checkbox interactions.
   * @param {RecyclingCategoryEnum} categoryId - The ID of the category that was toggled.
   * @param {boolean} checked - The new checked state of the category checkbox.
   */
  const handleCategoryChange = (categoryId: RecyclingCategoryEnum, checked: boolean) => {
    setSelectedCategories(prevSelectedCategories =>
      checked
        ? [...prevSelectedCategories, categoryId]
        : prevSelectedCategories.filter(id => id !== categoryId)
    );
  };

  /**
   * Handles the selection of a recycling point on the map.
   * Sets the `selectedPoint` state to display its details.
   * Prevents selection if in "add new point" or "select location" mode and provides feedback.
   * @param {RecyclingPoint} point - The recycling point that was clicked on the map.
   */
  const handlePointSelect = (point: RecyclingPoint) => {
    if (isAddingNewPointMode) {
        toast({
            title: "Adding New Point",
            description: "Please click on an empty map area to place the new point, or cancel.",
            variant: "default",
        });
        return;
    }
    if (isSelectingLocation) {
      toast({
        title: "Location Selection Active",
        description: "Please click on an empty map area to place the point, or cancel editing.",
        variant: "default",
      });
      return;
    }
    // If editing another point (and not currently selecting a new location for it), warn user.
    if (editingPointId && editingPointId !== point.id && !isSelectingLocation) {
       toast({
        title: "Edit Mode Active",
        description: `Please finish editing "${allPoints.find(p=>p.id === editingPointId)?.name || 'the current point'}" or click its 'Change Location' button.`,
        variant: "default",
      });
      return;
    }
    // Default behavior: select the point to show its details.
    setSelectedPoint(point);
  };

  /**
   * Memoized array of filtered recycling points based on `selectedCategories`.
   * Returns an empty array if no categories are selected.
   */
  const filteredPoints = useMemo(() => {
    if (selectedCategories.length === 0) {
      return [];
    }
    return allPoints.filter(point => selectedCategories.includes(point.category));
  }, [allPoints, selectedCategories]);

  /**
   * Resets the category filters to show all categories.
   */
  const resetFilters = () => {
    setSelectedCategories(categories.map(cat => cat.id));
  };

  /**
   * Toggles the edit mode for a specific recycling point.
   * If the point is already being edited, it exits edit mode.
   * If a new point ID is provided, it enters edit mode for that point.
   * Ensures the dialog stays open and focused on the point being edited.
   * @param {string | null} pointIdToToggle - The ID of the point to toggle edit mode for, or null to exit edit mode.
   */
  const handleToggleEditMode = (pointIdToToggle: string | null) => {
    setIsAddingNewPointMode(false); // Ensure not in "add new point" mode

    if (editingPointId === pointIdToToggle && !isSelectingLocation) {
      // If clicking "Edit" again on the same point (and not selecting location), or "Finish Editing"
      setEditingPointId(null); // Exit edit mode
    } else if (pointIdToToggle === null) {
      // Explicitly exiting edit mode for any point (e.g., "Finish Editing")
      setEditingPointId(null);
      setIsSelectingLocation(false); // Also cancel location selection if it was active
    } else {
      // Entering edit mode for a specific point
      setEditingPointId(pointIdToToggle);
      setIsSelectingLocation(false); // Ensure not in location selection mode initially

      // Ensure the dialog is open and shows the point being edited
      const pointToEnsureIsSelected = allPoints.find(p => p.id === pointIdToToggle);
      setSelectedPoint(pointToEnsureIsSelected || null);
    }
  };


  /**
   * Initiates the process of changing a point's location on the map.
   * Sets `isSelectingLocation` to true, prompting the user to click on the map.
   * The dialog will close when `isSelectingLocation` becomes true.
   */
  const handleChangeLocationStart = () => {
    if (editingPointId) {
      setIsSelectingLocation(true); // This will cause the dialog to close (see dialogOpen logic)
      toast({
        title: "Select New Location",
        description: `Click on the map to move ${selectedPoint?.name || 'the point'}. Press 'Esc' to cancel.`,
        duration: 7000,
      });
    }
  };

  /**
   * Updates the coordinates of a recycling point in Firestore and local state.
   * Called when the user clicks on the map while `isSelectingLocation` is true.
   * After update, it re-opens the dialog for the edited point.
   * @param {string} pointId - The ID of the point to update.
   * @param {number} newX - The new X-coordinate (percentage).
   * @param {number} newY - The new Y-coordinate (percentage).
   */
  const handlePointCoordinateChange = async (pointId: string, newX: number, newY: number) => {
    const pointToUpdate = allPoints.find(p => p.id === pointId);
    if (!pointToUpdate) return;

    const updatedPointData = { ...pointToUpdate, x: newX, y: newY };
    try {
      await updateRecyclingPointInDB(pointId, { x: newX, y: newY });
      setAllPoints(prevPoints =>
        prevPoints.map(p => (p.id === pointId ? updatedPointData : p))
      );
      setSelectedPoint(updatedPointData); // Re-select the point to open dialog
      setEditingPointId(pointId); // Ensure still in edit mode for this point
      setIsSelectingLocation(false); // Exit location selection mode
      toast({
        title: "Point Moved",
        description: `"${updatedPointData.name}" location updated.`,
      });
    } catch (err: any) {
      const originalError = err.cause || err;
      let userFriendlyMessage = `Failed to move "${updatedPointData.name}": ${err.message}. `;
      if (originalError.code) {
        userFriendlyMessage += `(Firebase Error: ${originalError.code}) `;
      }
      userFriendlyMessage += "Check Firestore rules and server/browser console for details.";
      console.error("HomePage: Error updating point coordinates in DB:", userFriendlyMessage, err, originalError);
      toast({
        title: "Error Moving Point",
        description: userFriendlyMessage,
        variant: "destructive",
        duration: 15000,
      });
      // Revert UI changes or refetch (optional for robustness)
      // For now, we keep the optimistic UI update but show error.
      setIsSelectingLocation(false); // Ensure location selection mode is exited even on error
      setSelectedPoint(pointToUpdate); // Re-select original point data if update failed
      setEditingPointId(pointId);
    }
  };

  /**
   * Updates the category of a recycling point in Firestore and local state.
   * @param {string} pointId - The ID of the point to update.
   * @param {RecyclingCategoryEnum} newCategoryId - The new category ID for the point.
   */
  const handlePointCategoryChange = async (pointId: string, newCategoryId: RecyclingCategoryEnum) => {
    const pointToUpdate = allPoints.find(p => p.id === pointId);
    if (!pointToUpdate) return;

    const updatedPointData = { ...pointToUpdate, category: newCategoryId };
    try {
      await updateRecyclingPointInDB(pointId, { category: newCategoryId });
      setAllPoints(prevPoints =>
        prevPoints.map(p => (p.id === pointId ? updatedPointData : p))
      );
      // If this point is currently selected, update its details in the dialog
      if (selectedPoint && selectedPoint.id === pointId) {
        setSelectedPoint(updatedPointData);
      }
      toast({
        title: "Category Updated",
        description: `"${updatedPointData.name}" category changed.`,
      });
    } catch (err: any)      {
      const originalError = err.cause || err;
      let userFriendlyMessage = `Failed to change category for "${updatedPointData.name}": ${err.message}. `;
      if (originalError.code) {
        userFriendlyMessage += `(Firebase Error: ${originalError.code}) `;
      }
      userFriendlyMessage += "Check Firestore rules and server/browser console for details.";
      console.error("HomePage: Error updating point category in DB:", userFriendlyMessage, err, originalError);
      toast({
        title: "Error Updating Category",
        description: userFriendlyMessage,
        variant: "destructive",
        duration: 15000,
      });
    }
  };

  /**
   * Updates the name of a recycling point in Firestore and local state.
   * @param {string} pointId - The ID of the point to update.
   * @param {string} newName - The new name for the point.
   */
  const handlePointNameChange = async (pointId: string, newName: string) => {
    const pointToUpdate = allPoints.find(p => p.id === pointId);
    if (!pointToUpdate) return;

    const updatedNameData = { ...pointToUpdate, name: newName };
    try {
      await updateRecyclingPointInDB(pointId, { name: newName });
      setAllPoints(prevPoints =>
        prevPoints.map(p => (p.id === pointId ? updatedNameData : p))
      );
      // If this point is currently selected, update its details in the dialog
      if (selectedPoint && selectedPoint.id === pointId) {
        setSelectedPoint(updatedNameData);
      }
      // Toast for name change typically shown when "Finish Editing" is clicked, or as part of a save action.
    } catch (err: any) {
      const originalError = err.cause || err;
      let userFriendlyMessage = `Failed to rename "${pointToUpdate.name}": ${err.message}. `;
      if (originalError.code) {
        userFriendlyMessage += `(Firebase Error: ${originalError.code}) `;
      }
      userFriendlyMessage += "Check Firestore rules and server/browser console for details.";
      console.error("HomePage: Error updating point name in DB:", userFriendlyMessage, err, originalError);
      toast({
        title: "Error Renaming Point",
        description: userFriendlyMessage,
        variant: "destructive",
        duration: 15000,
      });
    }
  };

  /**
   * Updates the description of a recycling point in Firestore and local state.
   * @param {string} pointId - The ID of the point to update.
   * @param {string} newDescription - The new description for the point.
   */
  const handlePointDescriptionChange = async (pointId: string, newDescription: string) => {
    const pointToUpdate = allPoints.find(p => p.id === pointId);
    if (!pointToUpdate) return;

    const updatedDescriptionData = { ...pointToUpdate, description: newDescription };
    try {
      await updateRecyclingPointInDB(pointId, { description: newDescription });
      setAllPoints(prevPoints =>
          prevPoints.map(p => (p.id === pointId ? updatedDescriptionData : p))
      );
      if (selectedPoint && selectedPoint.id === pointId) {
          setSelectedPoint(updatedDescriptionData);
      }
      // Toast for description change often shown when "Finish Editing" is clicked.
    } catch (err: any) {
      const originalError = err.cause || err;
      let userFriendlyMessage = `Failed to update description for "${pointToUpdate.name}": ${err.message}. `;
      if (originalError.code) {
        userFriendlyMessage += `(Firebase Error: ${originalError.code}) `;
      }
      userFriendlyMessage += "Check Firestore rules and server/browser console for details.";
      console.error("HomePage: Error updating point description in DB:", userFriendlyMessage, err, originalError);
      toast({
        title: "Error Updating Description",
        description: userFriendlyMessage,
        variant: "destructive",
        duration: 15000,
      });
    }
  };


  /**
   * Initiates the process of adding a new recycling point.
   * Sets `isAddingNewPointMode` to true, prompting the user to select a category and click on the map.
   */
  const handleInitiateAddPoint = () => {
    if (!categoryForNewPoint) {
      toast({
        title: "No Category Selected",
        description: "Please select a category for the new recycling point.",
        variant: "destructive",
      });
      return;
    }
    setIsAddingNewPointMode(true);
    // Clear other modes/selections
    setIsSelectingLocation(false);
    setEditingPointId(null);
    setSelectedPoint(null);
    toast({
      title: "Add New Point",
      description: "Click on the map to place the new recycling point. Press 'Esc' to cancel.",
    });
  };

  /**
   * Handles the placement of a new recycling point on the map.
   * Adds the new point to Firestore and the local state.
   * Opens the details dialog for the new point in edit mode.
   * @param {number} newX - The X-coordinate (percentage) where the new point was clicked.
   * @param {number} newY - The Y-coordinate (percentage) where the new point was clicked.
   */
  const handlePlaceNewPoint = async (newX: number, newY: number) => {
    if (!isAddingNewPointMode || !categoryForNewPoint) {
        console.warn("HomePage: handlePlaceNewPoint called but not in adding mode or no category selected.");
        return;
    }

    const newPointData: Omit<RecyclingPoint, 'id'> = {
      name: "New Recycling Point", // Default name, user can edit immediately
      category: categoryForNewPoint,
      x: newX,
      y: newY,
      description: "", // Default empty description
    };

    try {
      const addedPointWithId = await addRecyclingPointToDB(newPointData);
      setAllPoints(prev => [...prev, addedPointWithId]);
      setSelectedPoint(addedPointWithId); // Select the new point to open its dialog
      setEditingPointId(addedPointWithId.id); // Enter edit mode for the new point
      setIsAddingNewPointMode(false); // Exit "add new point" mode
      setCategoryForNewPoint(''); // Reset category for next new point
      toast({
        title: "Point Added",
        description: `New point "${addedPointWithId.name}" added. You can now edit its details.`,
      });
    } catch (err: any) {
      const originalError = err.cause || err;
      let userFriendlyMessage = `Failed to add new point: ${err.message}. The point was not saved. `;
      if (originalError.code) {
        userFriendlyMessage += `(Firebase Error: ${originalError.code}) `;
      }
      userFriendlyMessage += "Confirm Firestore setup (`projectId` in `src/lib/firebase.ts` and Firestore security rules in Firebase console allow writes). Check SERVER/browser console for details.";
      console.error("HomePage: Error adding new point to DB:", userFriendlyMessage, err, originalError);
      toast({
        title: "Error Adding Point",
        description: userFriendlyMessage,
        variant: "destructive",
        duration: 20000,
      });
      // Reset modes if add fails
      setIsAddingNewPointMode(false);
      setCategoryForNewPoint('');
    }
  };

  /**
   * Handles the submission of a problem report for a recycling point.
   * Displays a toast notification with the report details.
   * @param {string} pointId - The ID of the point for which the report is submitted.
   * @param {ProblemReport} report - The problem report details.
   */
  const handleProblemReportSubmit = (pointId: string, report: ProblemReport) => {
    const point = allPoints.find(p => p.id === pointId);
    if (point) {
      console.log(`Problem report for point "${point.name}" (ID: ${pointId}):`, report);
      let toastDescription = `Thank you for reporting: "${report.title}".`;
      if (report.imageDataUri) {
        toastDescription += " Image attached.";
      }
      toast({
        title: "Report Submitted",
        description: toastDescription,
        variant: "default",
        duration: 7000,
      });
    }
  };

  /**
   * Handles the deletion of a recycling point from Firestore and local state.
   * @param {string} pointId - The ID of the point to delete.
   */
  const handleDeletePoint = async (pointId: string) => {
    const pointToDelete = allPoints.find(p => p.id === pointId);
    if (!pointToDelete) return;

    try {
      await deleteRecyclingPointFromDB(pointId);
      setAllPoints(prevPoints => prevPoints.filter(p => p.id !== pointId));
      handleCloseDialog(); // Close the dialog as the point is gone
      toast({
        title: "Point Deleted",
        description: `Recycling point "${pointToDelete.name}" has been deleted.`,
      });
    } catch (err: any) {
      const originalError = err.cause || err;
      let userFriendlyMessage = `Failed to delete "${pointToDelete.name}": ${err.message}. `;
      if (originalError.code) {
        userFriendlyMessage += `(Firebase Error: ${originalError.code}) `;
      }
      userFriendlyMessage += "Check Firestore rules and server/browser console for details.";
      console.error("HomePage: Error deleting point from DB:", userFriendlyMessage, err, originalError);
      toast({
        title: "Error Deleting Point",
        description: userFriendlyMessage,
        variant: "destructive",
        duration: 15000,
      });
    }
  };

  /**
   * Attempts to get the user's current geolocation.
   * Displays coordinates in a toast and places a temporary marker on the map
   * (at a fixed location for this demo map for simplicity).
   */
  const handleTrackMe = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Not Supported",
        description: "Your browser does not support geolocation.",
        variant: "destructive",
      });
      return;
    }

    setCurrentUserLocationMarker(null); // Clear previous marker

    // Get current position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        toast({
          title: "Location Found",
          description: `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}. A marker has been placed on the map (note: this is a fixed representation for this demo map).`,
        });
        // For this demo, place marker in a predefined spot.
        // A real app would convert lat/lon to map percentages based on map bounds.
        setCurrentUserLocationMarker({ x: 50, y: 50 }); // Example: Center of the map
      },
      (geoError) => { // Renamed error to geoError to avoid conflict with other 'error' states
        console.error("Error getting geolocation:", geoError);
        let description = "Could not retrieve your location.";
        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            description = "You denied permission to access your location.";
            break;
          case geoError.POSITION_UNAVAILABLE:
            description = "Location information is unavailable.";
            break;
          case geoError.TIMEOUT:
            description = "The request to get user location timed out.";
            break;
        }
        toast({
          title: "Geolocation Error",
          description,
          variant: "destructive",
        });
      }
    );
  };


  /**
   * useEffect hook to handle keyboard events, specifically the 'Escape' key.
   * Used to cancel "add new point" mode, "select location" mode, or close the dialog.
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isAddingNewPointMode) {
          setIsAddingNewPointMode(false);
          setCategoryForNewPoint(''); // Reset category selection
          toast({ title: 'Add Point Cancelled', variant: 'default' });
        } else if (isSelectingLocation) {
          setIsSelectingLocation(false);
          // If editing a point, re-select it to ensure dialog shows correct (non-location-selection) state
          if (editingPointId) {
            const point = allPoints.find(p => p.id === editingPointId);
            setSelectedPoint(point || null); // Re-open dialog with the point
          }
          toast({ title: 'Location Change Cancelled', variant: 'default' });
        } else if (selectedPoint && !editingPointId) { // If just viewing details (not editing) and dialog is open
          handleCloseDialog();
        }
      }
    };
    // Add event listener when component mounts
    window.addEventListener('keydown', handleKeyDown);
    // Remove event listener when component unmounts
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAddingNewPointMode, isSelectingLocation, editingPointId, allPoints, selectedPoint, handleCloseDialog, toast]);


  // Fallback for server-side rendering or before client-side hydration
  if (!isClient) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AppHeader />
        <main className="container mx-auto p-4 flex-grow">
          <div className="text-center py-10 text-muted-foreground">
            Initializing RecycleFinder...
          </div>
        </main>
        <footer className="text-center p-4 text-sm text-muted-foreground border-t">
          © {new Date().getFullYear()} Thessaloniki RecycleFinder
        </footer>
      </div>
    );
  }

  // Loading state display while fetching initial data
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AppHeader />
        <main className="container mx-auto p-4 flex-grow flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading recycling points from database...</p>
        </main>
         <footer className="text-center p-4 text-sm text-muted-foreground border-t">
          © {new Date().getFullYear()} Thessaloniki RecycleFinder
        </footer>
      </div>
    );
  }

  // Error state display (e.g., if Firestore fetching fails critically)
  if (error) {
     return (
      <div className="min-h-screen flex flex-col bg-background">
        <AppHeader />
        <main className="container mx-auto p-4 flex-grow flex flex-col items-center justify-center text-center">
          <AlertTriangle className="h-16 w-16 text-destructive mb-6 mx-auto" />
          <h2 className="text-2xl font-semibold text-destructive mb-3">Error Loading Application Data</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-2">{error}</p>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Please confirm your Firebase setup:
            1. The `projectId` in `src/lib/firebase.ts` matches your Firebase project.
            2. Firestore security rules in the Firebase console allow read access to the 'recyclingPoints' collection.
            For detailed Firebase error messages, check your browser's developer console AND your server terminal logs.
          </p>
           <Button onClick={() => window.location.reload()} variant="outline" className="mt-8">
            Try Reloading
          </Button>
        </main>
         <footer className="text-center p-4 text-sm text-muted-foreground border-t">
          © {new Date().getFullYear()} Thessaloniki RecycleFinder
        </footer>
      </div>
    );
  }

  // Determine if the PointDetailsDialog should be open based on current state.
  // Dialog should be open if a point is selected AND user is NOT currently selecting a location for it AND NOT adding a new point.
  const dialogOpen = !!selectedPoint && !isSelectingLocation && !isAddingNewPointMode;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <main className="container mx-auto p-4 flex-grow grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Panel: Filters, Add Point, Track Me */}
        <div className="md:col-span-1 space-y-6">
          {/* Category filter component */}
          <CategoryFilter
            categories={categories} // Pass fixed categories
            selectedCategories={selectedCategories}
            onCategoryChange={handleCategoryChange}
          />
          {/* Button to reset all category filters */}
          <Button onClick={resetFilters} variant="outline" className="w-full">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Reset Filters
          </Button>

          {/* Button to track user's current location */}
           <Button onClick={handleTrackMe} variant="outline" className="w-full">
            <LocateFixed className="mr-2 h-5 w-5" />
            Track me
          </Button>

          {/* Card for adding a new recycling point */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <PlusCircle className="h-5 w-5 mr-2 text-primary" />
                Add New Recycling Point
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="newPointCategory">Select Category</Label>
                <Select value={categoryForNewPoint} onValueChange={(value) => setCategoryForNewPoint(value as RecyclingCategoryEnum)}>
                  <SelectTrigger id="newPointCategory">
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => ( // Use fixed categories
                      <SelectItem key={cat.id} value={cat.id}>
                         <div className="flex items-center">
                           {cat.icon && React.createElement(cat.icon, { className: `h-4 w-4 mr-2 ${cat.color || 'text-foreground'}`, strokeWidth:2.5 })}
                           {cat.label}
                         </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleInitiateAddPoint} className="w-full" disabled={!categoryForNewPoint}>
                Add Point & Select Location
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Right Panel: Map and Messages */}
        <div className="md:col-span-2">
          {/* Interactive map component */}
          <RecyclingMap
            points={filteredPoints}
            onPointSelect={handlePointSelect}
            categories={categories} // Pass fixed categories
            editingPointId={editingPointId}
            onPointCoordinateChange={handlePointCoordinateChange}
            isSelectingLocation={isSelectingLocation}
            currentEditingPointName={editingPointId ? allPoints.find(p=>p.id === editingPointId)?.name : undefined}
            isAddingNewPointMode={isAddingNewPointMode}
            onPlaceNewPoint={handlePlaceNewPoint}
            scale={1} // Initial scale, RecyclingMap manages its internal scale
            currentUserLocationMarker={currentUserLocationMarker}
          />
          {/* Message if no points match filters */}
          {filteredPoints.length === 0 && selectedCategories.length > 0 && allPoints.length > 0 && !isLoading && !error && (
            <div className="mt-4 p-4 text-center text-muted-foreground bg-card border rounded-md">
              No recycling points match the selected filters. Try adjusting your filter or resetting.
            </div>
          )}
          {/* Message if no points are loaded from DB and no error/loading state */}
           {allPoints.length === 0 && !isLoading && !error && (
             <div className="mt-4 p-4 text-center text-muted-foreground bg-card border rounded-md">
              No recycling points found in the database. Try adding some!
            </div>
           )}
           {/* Instructional message when adding a new point */}
           {isAddingNewPointMode && (
            <div className="mt-4 p-3 text-center text-primary-foreground bg-primary border border-primary rounded-md shadow-md">
              Click on the map to place the new recycling point for the selected category. Press 'Esc' to cancel.
            </div>
          )}
        </div>
      </main>

      {/* Dialog for displaying and editing point details */}
      <PointDetailsDialog
        point={selectedPoint}
        isOpen={dialogOpen}
        onClose={handleCloseDialog}
        categories={categories} // Pass fixed categories
        editingPointId={editingPointId}
        onToggleEditMode={handleToggleEditMode}
        onPointCategoryChange={handlePointCategoryChange}
        onChangeLocationStart={handleChangeLocationStart}
        onPointNameChange={handlePointNameChange}
        onPointDescriptionChange={handlePointDescriptionChange}
        onProblemReportSubmit={handleProblemReportSubmit}
        onDeletePoint={handleDeletePoint}
      />

      {/* Application footer */}
      <footer className="text-center p-4 text-sm text-muted-foreground border-t">
        © {new Date().getFullYear()} Thessaloniki RecycleFinder
      </footer>
    </div>
  );
}
