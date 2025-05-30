
import type { LucideIcon } from 'lucide-react';
import type { SVGProps } from 'react';

/**
 * Represents the type for a recycling category identifier.
 * Typically a string like 'plastic', 'paper', etc.
 */
export type RecyclingCategoryEnum = string;

/**
 * Interface for a single recycling point object.
 */
export interface RecyclingPoint {
  id: string; // Unique identifier for the recycling point.
  name: string; // Name of the recycling point (e.g., "Aristotelous Square Bin").
  category: RecyclingCategoryEnum; // The category of recyclables this point accepts (e.g., 'plastic').
  x: number; // X-coordinate on the map, as a percentage from the left (0-100).
  y: number; // Y-coordinate on the map, as a percentage from the top (0-100).
  description: string; // A short description for the point.
}

/**
 * Interface for a recycling category type.
 * Defines the properties of a category, such as its label, icon, and colors.
 */
export interface Category {
  id: RecyclingCategoryEnum; // Unique identifier for the category (e.g., 'paper').
  label: string; // User-friendly label for the category (e.g., "Paper").
  icon: LucideIcon | React.FC<SVGProps<SVGSVGElement>>; // React component for the category's icon.
  color: string; // Tailwind CSS class for the icon color (e.g., 'text-blue-500').
  markerBgColor: string; // Tailwind CSS class for the background color of map markers for this category (e.g., 'bg-blue-500').
}

/**
 * Interface for a problem report submitted by a user for a recycling point.
 */
export interface ProblemReport {
  title: string; // The title or type of the problem (e.g., "Bin Overflowing").
  description: string; // Detailed description of the problem.
  imageDataUri?: string; // Optional Data URI string for an attached image of the problem.
}

    