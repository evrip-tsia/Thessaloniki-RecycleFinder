
import type { Category } from '@/types';
import { Package, Newspaper, Smartphone, Coins, Leaf } from 'lucide-react';
import type { SVGProps } from 'react';


export const SimpleGlassBottleIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M8 2h8v2a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V2Z" />
    <path d="M7 6v12c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V6H7Z" />
  </svg>
);


export const INITIAL_CATEGORIES: Category[] = [
  { id: 'plastic', label: 'Plastic', icon: Package, color: 'text-black', markerBgColor: 'bg-yellow-100 hover:bg-yellow-200' },
  { id: 'paper', label: 'Paper', icon: Newspaper, color: 'text-black', markerBgColor: 'bg-yellow-100 hover:bg-yellow-200' },
  { id: 'electronics', label: 'Electronics', icon: Smartphone, color: 'text-black', markerBgColor: 'bg-yellow-100 hover:bg-yellow-200' },
  { id: 'glass', label: 'Glass', icon: SimpleGlassBottleIcon, color: 'text-black', markerBgColor: 'bg-yellow-100 hover:bg-yellow-200' },
  { id: 'metal', label: 'Metal', icon: Coins, color: 'text-black', markerBgColor: 'bg-yellow-100 hover:bg-yellow-200' },
  { id: 'organic', label: 'Organic', icon: Leaf, color: 'text-black', markerBgColor: 'bg-yellow-100 hover:bg-yellow-200' },
];
