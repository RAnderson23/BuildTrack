import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Package } from "lucide-react";
import type { Product } from "@shared/schema";

interface ProductSuggestionsProps {
  productName: string;
  onSelectProduct: (product: Product) => void;
  onCreateNew: () => void;
  className?: string;
}

export function ProductSuggestions({ 
  productName, 
  onSelectProduct, 
  onCreateNew, 
  className = "" 
}: ProductSuggestionsProps) {
  const [shouldSearch, setShouldSearch] = useState(false);

  // Only search when we have a meaningful product name
  useEffect(() => {
    setShouldSearch(productName.length > 2);
  }, [productName]);

  const { data: similarProducts, isLoading } = useQuery({
    queryKey: ['/api/products/similar', productName],
    enabled: shouldSearch,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (!shouldSearch || (!isLoading && (!similarProducts || similarProducts.length === 0))) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className={`mt-2 ${className}`}>
        <CardContent className="p-3">
          <div className="flex items-center space-x-2 text-sm text-slate-600">
            <Search className="w-4 h-4 animate-spin" />
            <span>Searching for similar products...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`mt-2 border-slate-200 ${className}`}>
      <CardContent className="p-3">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Package className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-slate-700">
                Similar products found
              </span>
            </div>
            <Badge variant="outline" className="text-xs">
              {similarProducts.length} matches
            </Badge>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {similarProducts.map((product: Product) => (
              <div 
                key={product.id}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-xs font-mono">
                      {product.sku}
                    </Badge>
                    <span className="text-sm font-medium text-slate-900 truncate">
                      {product.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    {product.category && (
                      <span className="text-xs text-slate-600 bg-white px-2 py-1 rounded">
                        {product.category}
                      </span>
                    )}
                    {product.unitPrice && (
                      <span className="text-xs text-green-700 font-medium">
                        ${parseFloat(product.unitPrice).toFixed(2)} / {product.unit}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSelectProduct(product)}
                  className="ml-2 text-xs"
                >
                  Use This
                </Button>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 pt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={onCreateNew}
              className="w-full text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Create "{productName}" as New Product
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}