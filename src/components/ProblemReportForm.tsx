
"use client";

import React, { useState, type ChangeEvent } from 'react';
import type { ProblemReport } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, X, AlertTriangle, Paperclip, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image'; 

interface ProblemReportFormProps {
  pointName: string;
  onSubmit: (report: ProblemReport) => void;
  onCancel: () => void;
}

const PREDEFINED_PROBLEM_TYPES = [
  "Bin Overflowing",
  "Damaged Bin",
  "Incorrect Location",
  "Vandalism",
  "Needs Cleaning",
  "Other Issue (Specify in Description)"
];

export function ProblemReportForm({ pointName, onSubmit, onCancel }: ProblemReportFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setPreviewImage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      return;
    }

    let imageDataUri: string | undefined = undefined;
    if (selectedFile) {
      imageDataUri = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(selectedFile);
      });
    }

    onSubmit({ title, description, imageDataUri });
  };

  return (
    <Card className="mt-4 border-destructive shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 text-destructive" />
          Report a Problem for: {pointName}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="problemType">Problem Type</Label>
            <Select value={title} onValueChange={setTitle} required>
              <SelectTrigger id="problemType" className="border-destructive focus:ring-destructive">
                <SelectValue placeholder="Select problem type" />
              </SelectTrigger>
              <SelectContent>
                {PREDEFINED_PROBLEM_TYPES.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="problemDescription">Detailed Description</Label>
            <Textarea
              id="problemDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide as much detail as possible."
              rows={4}
              required
              className="border-destructive focus:ring-destructive"
            />
          </div>
          <div>
            <Label htmlFor="problemImage">Attach Image (Optional)</Label>
            <Input
              id="problemImage"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="border-input focus:ring-ring file:text-sm file:font-medium file:text-foreground file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border file:border-input file:bg-background hover:file:bg-accent hover:file:text-accent-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">
              <Paperclip className="inline h-3 w-3 mr-1" />
              Attach a photo of the issue if possible.
            </p>
          </div>

          {previewImage && (
            <div className="mt-2 border border-dashed border-border/50 p-2 rounded-md">
              <Label className="text-sm font-medium text-muted-foreground">Image Preview:</Label>
              <div className="relative w-full h-40 mt-1">
                <Image
                  src={previewImage}
                  alt="Problem report preview"
                  fill
                  style={{ objectFit: 'contain' }}
                  className="rounded-md"
                  data-ai-hint="problem report"
                />
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="mr-2 h-4 w-4" /> Cancel
          </Button>
          <Button type="submit" variant="destructive" disabled={!title || !description}>
            <Send className="mr-2 h-4 w-4" /> Submit Report
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
