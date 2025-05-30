import type { Category, RecyclingCategoryEnum } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CategoryFilterProps {
  categories: Category[]; 
  selectedCategories: RecyclingCategoryEnum[]; 
  onCategoryChange: (categoryId: RecyclingCategoryEnum, checked: boolean) => void; 
}

export function CategoryFilter({ categories, selectedCategories, onCategoryChange }: CategoryFilterProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">Filter by Category</CardTitle>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <p className="text-muted-foreground text-sm">No categories available. Add some!</p>
        ) : (
          <div className="space-y-3">
            {categories.map(category => (
              <div key={category.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted transition-colors">
                <Checkbox
                  id={`category-${category.id}`}
                  checked={selectedCategories.includes(category.id)}
                  onCheckedChange={(checked) => onCategoryChange(category.id, !!checked)}
                  className="form-checkbox h-5 w-5 text-primary focus:ring-primary border-primary"
                />
                <Label htmlFor={`category-${category.id}`} className="flex items-center text-sm font-medium cursor-pointer">
                  <category.icon className={`h-5 w-5 mr-2 ${category.color}`} />
                  {category.label}
                </Label>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
