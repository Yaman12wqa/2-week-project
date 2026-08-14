# BEUShareBox learning guide

This guide is for understanding the project, not for claiming JavaScript proficiency.

## The main flow

1. `index.html` creates the form, filters, statistics, and empty product-list container.
2. At the top of `app.js`, JavaScript finds those elements with `document.getElementById`.
3. `initialize()` connects browser events to handler functions.
4. `loadProducts()` reads the saved JSON array from `localStorage`.
5. `handleAddProduct()` validates the form and adds one object to the `products` array.
6. `saveProducts()` writes the array back to `localStorage`.
7. `renderProducts()` rebuilds the visible product cards and updates the statistics.

The central idea is:

```text
user event -> change products array -> save -> render
```

## Functions to understand first

- `validateProduct`: returns an error message when form data is invalid.
- `getVisibleProducts`: applies category and text filters to the array.
- `createProductCard`: converts one product object into a DOM card.
- `handleProductListClick`: handles like, share, and delete button actions.
- `handleCommentSubmit`: appends a comment to one product.
- `escapeHtml` and `escapeAttribute`: reduce HTML-injection risk when rendering text.

Leave the auto-fill and sharing functions until the basic create/filter/comment/delete flow is clear.

## Self-test questions

1. Why is `products` declared with `let` instead of `const`?
2. What is the difference between changing the array and calling `renderProducts()`?
3. Why does `saveProducts()` use `JSON.stringify`?
4. What happens if the saved JSON in `localStorage` is damaged?
5. How does event delegation let one listener handle every product button?
6. Why must user text be escaped before it is inserted with `innerHTML`?

## Small manual exercises

Complete these one at a time and test each change in the browser:

1. Change the empty-state message and explain which function controls it.
2. Add a `Clear search` button that resets the search input and redraws the list.
3. Change likes into a toggle so one card can be liked and unliked locally.
4. Add a `condition` field with `New` and `Used` choices, then display it on each card.

For each exercise, write down:

- which HTML element you added or changed;
- which JavaScript state or object field changed;
- which event handler runs;
- when data is saved;
- when the page is rendered again.

