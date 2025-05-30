
import { Recycle } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center">
        <Recycle className="h-8 w-8 mr-3" />
        <h1 className="text-2xl font-bold">Thessaloniki RecycleFinder</h1>
        <div className="ml-auto text-sm text-primary-foreground/70">
          E.Tsiardaklis 2019216
        </div>
      </div>
    </header>
  );
}
