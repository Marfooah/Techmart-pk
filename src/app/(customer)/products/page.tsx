import { getCurrentUser } from "@/lib/auth/session";
import { listProducts } from "@/services/product.service";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPKR } from "@/lib/utils";
import { Star } from "lucide-react";

export default async function ProductsPage() {
  await getCurrentUser();
  const products = await listProducts();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Browse our catalog — all prices in Pakistani Rupees (PKR)"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <Card key={product.id} className="overflow-hidden border-0 shadow-md transition-shadow hover:shadow-lg">
            <CardContent className="p-6">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-primary">
                    {product.brand}
                  </p>
                  <h3 className="font-semibold leading-tight">{product.name}</h3>
                </div>
                <Badge variant="outline">{product.category}</Badge>
              </div>
              <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-primary">{formatPKR(product.price)}</p>
                  <p className="text-xs text-muted-foreground">{product.currency}</p>
                </div>
                {product.rating && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    {product.rating}
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>SKU: {product.sku}</span>
                <Badge variant={product.status === "ACTIVE" ? "success" : "secondary"}>
                  {product.status.replace("_", " ")}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
