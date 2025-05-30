
"use client";

import React, { useState } from 'react';
import type { RecyclingPoint, Category, RecyclingCategoryEnum, ProblemReport } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Edit3, CheckCircle, MapPin, AlertTriangle, Trash2 } from 'lucide-react';
import { ProblemReportForm } from './ProblemReportForm';

/**
 * Interface for the props of the PointDetailsDialog component.
 */
interface PointDetailsDialogProps {
  point: RecyclingPoint | null; 
  isOpen: boolean;
  onClose: () => void; 
  categories: Category[]; 
  editingPointId: string | null; 
  onToggleEditMode: (pointId: string | null) => void; 
  onPointCategoryChange: (pointId: string, newCategoryId: RecyclingCategoryEnum) => void; 
  onChangeLocationStart: () => void; 
  onPointNameChange: (pointId: string, newName: string) => void; 
  onPointDescriptionChange: (pointId: string, newDescription: string) => void; 
  onProblemReportSubmit: (pointId: string, report: ProblemReport) => void; 
  onDeletePoint: (pointId: string) => Promise<void>; 
}


export function PointDetailsDialog({
  point,
  isOpen,
  onClose,
  categories,
  editingPointId,
  onToggleEditMode,
  onPointCategoryChange,
  onChangeLocationStart,
  onPointNameChange,
  onPointDescriptionChange,
  onProblemReportSubmit,
  onDeletePoint,
}: PointDetailsDialogProps) {
  const { toast } = useToast();
  
  const [showProblemReportForm, setShowProblemReportForm] = useState(false);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  
  if (!point) return null;

  
  const isCurrentlyEditingThisPoint = editingPointId === point.id;
  
  const categoryInfo = categories.find(cat => cat.id === point.category);
  
  const IconComponent = categoryInfo?.icon;

  
  const handleDialogClose = () => {
    setShowProblemReportForm(false);
    setShowDeleteConfirm(false);
    onClose(); 
  };

  const handleEditButtonClick = () => {
    if (point) {
      setShowProblemReportForm(false); 
      onToggleEditMode(point.id);
    }
  };

  
  const handleFinishEditing = () => {
    onToggleEditMode(null); // Pass null to exit edit mode for any point.
     toast({
      title: "Edits Saved",
      description: `Changes to "${point.name}" have been saved.`, 
    });
  }

  
  const handleToggleProblemReportForm = () => {
    setShowProblemReportForm(prev => !prev);
     // If currently editing this point and about to show problem form, exit edit mode.
     if (isCurrentlyEditingThisPoint && !showProblemReportForm) {
        onToggleEditMode(null);
     }
  };

  
  const handleLocalProblemReportSubmit = (report: ProblemReport) => {
    if (point) {
      onProblemReportSubmit(point.id, report);
      setShowProblemReportForm(false); // Close the problem report form after submission.
    }
  };

 
  const handleDeleteConfirmed = async () => {
    if (point) {
      await onDeletePoint(point.id);
      setShowDeleteConfirm(false); 
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { handleDialogClose(); } }}>
      <DialogContent className="sm:max-w-lg md:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center">
            {IconComponent && categoryInfo && React.createElement(IconComponent, { className: `h-6 w-6 mr-2 ${categoryInfo.color}`, strokeWidth: 2.5 })}
            {isCurrentlyEditingThisPoint ? (
              <Input
                id="pointNameInlineEdit"
                value={point.name}
                onChange={(e) => onPointNameChange(point.id, e.target.value)}
                placeholder="Enter point name"
                className="text-2xl font-semibold leading-none tracking-tight ml-0 p-0 border-0 shadow-none focus-visible:ring-0 h-auto"
              />
            ) : (
              point.name
            )}
          </DialogTitle>
          {categoryInfo && (
            <DialogDescription>
              <Badge variant="secondary" className="mt-1">{categoryInfo.label}</Badge>
            </DialogDescription>
          )}
        </DialogHeader>

        {isCurrentlyEditingThisPoint ? (
           <Textarea
              id="pointDescriptionInput"
              value={point.description}
              onChange={(e) => onPointDescriptionChange(point.id, e.target.value)}
              placeholder="Enter a brief description for this point"
              rows={3}
              className="mt-2" // Add some margin top
            />
        ) : (
          point.description ? (
            <p className="mt-2 text-sm text-muted-foreground">{point.description}</p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground italic">No description provided for this point.</p>
          )
        )}

        {isCurrentlyEditingThisPoint && !showProblemReportForm && (
          <>
            <Separator className="my-4" />
            <div className="my-4 p-4 border rounded-md bg-card space-y-4">
              <h3 className="text-lg font-semibold mb-3">Editing Controls</h3>

              <div>
                <Label htmlFor="pointNameInput" className="sr-only">Point Name (already editable in title)</Label>
              </div>
              <div>
                <Label htmlFor="categorySelect">Change Category</Label>
                <Select
                  value={point.category}
                  onValueChange={(newCategoryId) => onPointCategoryChange(point.id, newCategoryId as RecyclingCategoryEnum)}
                >
                  <SelectTrigger id="categorySelect" className="mt-1">
                    <SelectValue placeholder="Select new category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center">
                          {cat.icon && React.createElement(cat.icon, { className: `h-4 w-4 mr-2 ${cat.color}`, strokeWidth: 2.5 })}
                          {cat.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={onChangeLocationStart} variant="outline" className="w-full">
                <MapPin className="mr-2 h-4 w-4" />
                Change Location on Map
              </Button>

              <div className="flex space-x-2">
                <Button onClick={handleFinishEditing} variant="default" className="flex-1">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Finish Editing
                </Button>
                <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="flex-1" onClick={() => setShowDeleteConfirm(true)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Point
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the
                        recycling point "{point.name}" from the database.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)}>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteConfirmed} className={buttonVariants({ variant: "destructive" })}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </>
        )}

        {!isCurrentlyEditingThisPoint && !showProblemReportForm && (
           <div className="flex flex-col sm:flex-row gap-2 my-4">
            <Button onClick={handleEditButtonClick} variant="secondary" className="flex-1">
              <Edit3 className="mr-2 h-4 w-4" />
              Edit Point Details
            </Button>
            <Button onClick={handleToggleProblemReportForm} variant="destructive" className="flex-1">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Report a Problem
            </Button>
          </div>
        )}

        {showProblemReportForm && point && (
            <ProblemReportForm
                pointName={point.name}
                onSubmit={handleLocalProblemReportSubmit}
                onCancel={handleToggleProblemReportForm}
            />
        )}

        <DialogFooter className="mt-6">
          <Button onClick={handleDialogClose} variant="outline">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
    
