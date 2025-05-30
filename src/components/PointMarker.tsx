
import type { RecyclingPoint, Category } from '@/types';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { AlertTriangle } from 'lucide-react'; 


interface PointMarkerProps {
  point: RecyclingPoint; 
  onClick: (point: RecyclingPoint) => void; 
  categories: Category[]; 
  scale: number; 
}


export function PointMarker({ point, onClick, categories, scale }: PointMarkerProps) {
  
  const categoryInfo = categories.find(cat => cat.id === point.category);
  
  
  const baseTargetScreenSize = 18; 
  let intrinsicIconSize = baseTargetScreenSize / scale; 
  intrinsicIconSize = Math.max(10, Math.min(60, intrinsicIconSize)); 

  const iconStyle = {
    width: `${intrinsicIconSize}px`,
    height: `${intrinsicIconSize}px`,
  };
  
  if (!categoryInfo) {
    console.warn(`PointMarker: Category info not found for point category: ${point.category}`);
    
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className={cn(
                "absolute -translate-x-1/2 -translate-y-1/2 p-2 rounded-full shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                "bg-yellow-100 hover:bg-yellow-200" // Default marker background for unknown category
              )}
              style={{ left: `${point.x}%`, top: `${point.y}%` }} // Position based on point coordinates
              onClick={() => onClick(point)}
              aria-label={`Recycling point: ${point.name} (Unknown Category)`}
            >
              <AlertTriangle 
                className="text-black" 
                style={iconStyle} 
                strokeWidth={2.5} 
              />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-semibold">{point.name}</p>
            <p className="text-sm text-muted-foreground">Unknown Category</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const IconComponent = categoryInfo.icon;

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "absolute -translate-x-1/2 -translate-y-1/2 p-2 rounded-full shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              categoryInfo.markerBgColor 
            )}
            style={{ left: `${point.x}%`, top: `${point.y}%` }} 
            onClick={() => onClick(point)}
            aria-label={`Recycling point: ${point.name}`}
          >
            <IconComponent 
              className={cn(categoryInfo.color)} 
              style={iconStyle} 
              strokeWidth={2.5} 
            /> 
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-semibold">{point.name}</p>
          <p className="text-sm text-muted-foreground">{categoryInfo.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

    