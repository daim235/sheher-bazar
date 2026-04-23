import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/grocery")({
  head: () => ({
    meta: [
      { title: "Grocery — Shahar Bazar" },
      {
        name: "description",
        content:
          "Order groceries, fresh produce, spices, and daily essentials from local Sargodha shops with same-day delivery.",
      },
      { property: "og:title", content: "Grocery — Shahar Bazar" },
      {
        property: "og:description",
        content: "Order groceries from local Sargodha shops with same-day delivery.",
      },
    ],
  }),
  component: GroceryPage,
});

function GroceryPage() {
  // Grocery is a curated view of the marketplace
  return <Navigate to="/marketplace" search={{ q: "", category: "groceries" }} />;
}
