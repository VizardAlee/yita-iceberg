import { formatNairaFromKobo, formatQuantity } from "@/lib/format/number";
import type { OrderItemDocument } from "@/lib/types/operational";

export function OrderItemTable({
  items,
  compact = false,
}: {
  items: OrderItemDocument[];
  compact?: boolean;
}) {
  return (
    <div className="responsive-table-deck overflow-x-auto rounded-lg border">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-muted text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-3 py-2">Item</th>
            <th className="px-3 py-2">Qty</th>
            {!compact ? <th className="px-3 py-2">Unit price</th> : null}
            {!compact ? <th className="px-3 py-2">Discount</th> : null}
            <th className="px-3 py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map((item) => (
            <tr key={item.productId}>
              <td className="px-3 py-2" data-deck-primary data-label="Item">
                <p className="font-medium">{item.productName}</p>
                <p className="text-xs text-muted-foreground">{item.sku}</p>
              </td>
              <td className="px-3 py-2" data-label="Quantity">{formatQuantity(item.quantity, item.unit)}</td>
              {!compact ? (
                <td className="px-3 py-2" data-label="Unit price">
                  {formatNairaFromKobo(item.originalUnitPriceKobo)}
                </td>
              ) : null}
              {!compact ? (
                <td className="px-3 py-2" data-label="Discount">
                  {item.discountPercent > 0
                    ? `${item.discountPercent}%`
                    : "None"}
                </td>
              ) : null}
              <td className="px-3 py-2 text-right font-medium" data-label="Total">
                {formatNairaFromKobo(item.lineTotalKobo)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
