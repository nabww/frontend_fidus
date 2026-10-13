import { act } from "react";
import { render, screen } from "@testing-library/react";
import { CartProvider, useCart } from "../context/CartContext";

// Probe component exposes the context for assertions and actions
let cart;
function Probe() {
  cart = useCart();
  return (
    <div data-testid="probe">{JSON.stringify({ items: cart.items, subtotal: cart.subtotal })}</div>
  );
}

function mount() {
  return render(
    <CartProvider>
      <Probe />
    </CartProvider>
  );
}

const product = (over = {}) => ({
  id: "p1",
  name: "Earbuds",
  price: 5000,
  stock: 3,
  image_url: null,
  ...over,
});

beforeEach(() => localStorage.clear());

describe("CartContext", () => {
  it("adds a product and merges repeat adds into one line", () => {
    mount();
    act(() => cart.addToCart(product()));
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]).toMatchObject({ productId: "p1", price: 5000, quantity: 1 });

    act(() => cart.addToCart(product(), 2));
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(3);
  });

  it("uses the discounted price when a discount is active", () => {
    mount();
    act(() =>
      cart.addToCart(
        product({ discount_active: true, effective_price: 4000, discount_percent: 20 })
      )
    );
    expect(cart.items[0].price).toBe(4000);
    expect(cart.items[0].original_price).toBe(5000);
  });

  it("clamps quantity to stock and removes the line below 1", () => {
    mount();
    act(() => cart.addToCart(product()));
    act(() => cart.updateQuantity("p1", 99));
    expect(cart.items[0].quantity).toBe(3); // stock cap
    act(() => cart.updateQuantity("p1", 0));
    expect(cart.items).toHaveLength(0);
  });

  it("computes the subtotal and clears", () => {
    mount();
    act(() => {
      cart.addToCart(product());
      cart.addToCart(product({ id: "p2", price: 1000 }), 2);
    });
    expect(cart.subtotal).toBe(7000);
    act(() => cart.clearCart());
    expect(cart.items).toHaveLength(0);
    expect(cart.subtotal).toBe(0);
  });

  it("persists to localStorage and restores on remount", () => {
    const first = mount();
    act(() => cart.addToCart(product()));
    first.unmount();
    mount();
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].productId).toBe("p1");
  });
});
