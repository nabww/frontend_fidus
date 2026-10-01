import { imageUrl } from "../api/client";

// Square product images for an order's items — faster to scan than names.
// Shows up to `max` tiles, then a "+N" tile for the rest.
export default function ItemTiles({ items = [], max = 6 }) {
  const shown = items.slice(0, max);
  const extra = items.length - shown.length;
  return (
    <div className="item-tiles">
      {shown.map((i) => {
        const name = i.product?.name || "Item";
        return (
          <div key={i.id} className="item-tile" title={`${i.quantity}× ${name}`}>
            {i.product?.image_url
              ? <img src={imageUrl(i.product.image_url)} alt={name} loading="lazy" />
              : <span aria-hidden="true">◆</span>}
            {i.quantity > 1 && <span className="item-tile__qty">×{i.quantity}</span>}
          </div>
        );
      })}
      {extra > 0 && <div className="item-tile item-tile--more">+{extra}</div>}
    </div>
  );
}
