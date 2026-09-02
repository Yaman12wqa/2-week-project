# BEUShareBox

BEUShareBox is a browser-only classroom project for sharing sample products. It uses HTML, CSS, and vanilla JavaScript without a framework or backend.

> Learning status: This project was created with AI assistance. It is a candidate for hands-on learning because the repository has only three application files, but it should not be listed as a personal JavaScript skill until the project owner can explain and modify the main data flow.

## What the application does

- adds products with a title, description, price, category, and optional links
- stores products in the browser with `localStorage`
- filters and searches the product list
- records likes and comments
- deletes products after confirmation
- uses the Web Share API or clipboard as available
- attempts to read public product-page metadata for optional form auto-fill

## Files

```text
webtabanli programlana 2. hafta uygulama/
  index.html   page structure and form controls
  style.css    responsive layout and visual styles
  app.js       state, validation, rendering, storage, and interactions
```

## Run locally

You can open `index.html` directly. A local web server is better for clipboard, sharing, and network behavior:

```bash
cd "webtabanli programlana 2. hafta uygulama"
python -m http.server 8000
```

Then open `http://127.0.0.1:8000`.

## Known limitations

- Data is stored only in the current browser, not in a shared database.
- There are no accounts, permissions, or server-side validation.
- Product-page auto-fill often fails because other sites block browser requests.
- The project has no automated test suite yet.
- User-provided external links and images should be treated as untrusted.

See [LEARNING_GUIDE.md](./LEARNING_GUIDE.md) for the code flow, self-test questions, and small manual exercises.
