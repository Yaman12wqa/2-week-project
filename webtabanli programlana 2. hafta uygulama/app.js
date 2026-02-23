const STORAGE_KEY = "beuShareBoxProducts";

const productForm = document.getElementById("productForm");
const formError = document.getElementById("formError");
const productList = document.getElementById("productList");
const emptyState = document.getElementById("emptyState");
const productCount = document.getElementById("productCount");
const likeCount = document.getElementById("likeCount");
const commentCount = document.getElementById("commentCount");
const actionFeedback = document.getElementById("actionFeedback");
const categoryFilterNav = document.getElementById("categoryFilterNav");
const searchInput = document.getElementById("searchInput");
const titleInput = document.getElementById("title");
const descriptionInput = document.getElementById("description");
const priceInput = document.getElementById("price");
const categoryInput = document.getElementById("category");
const productUrlInput = document.getElementById("productUrl");
const imageUrlInput = document.getElementById("imageUrl");
const autoFillStatus = document.getElementById("autoFillStatus");

let autoFillRequestId = 0;

let products = loadProducts();
let activeCategory = "all";
let searchTerm = "";

initialize();

function initialize() {
  productForm.addEventListener("submit", handleAddProduct);
  categoryFilterNav.addEventListener("click", handleFilterClick);
  searchInput.addEventListener("input", handleSearchInput);
  productList.addEventListener("click", handleProductListClick);
  productList.addEventListener("submit", handleCommentSubmit);
  productUrlInput.addEventListener("change", () => {
    void handleProductUrlAutoFill();
  });
  productUrlInput.addEventListener("paste", handleProductUrlPaste);
  updateCategoryFilterState();
  renderProducts();
}

function loadProducts() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to read products from localStorage:", error);
    return [];
  }
}

function saveProducts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

function handleAddProduct(event) {
  event.preventDefault();
  const formData = new FormData(productForm);
  const title = formData.get("title").toString().trim();
  const description = formData.get("description").toString().trim();
  const rawPriceValue = formData.get("price");
  const priceRawText = rawPriceValue === null ? "" : rawPriceValue.toString().trim();
  const price = priceRawText === "" ? Number.NaN : Number(priceRawText);
  const category = formData.get("category").toString();
  const rawProductUrlValue = formData.get("productUrl");
  const productUrlRawText = rawProductUrlValue === null ? "" : rawProductUrlValue.toString().trim();
  const rawImageUrlValue = formData.get("imageUrl");
  const imageUrlRawText = rawImageUrlValue === null ? "" : rawImageUrlValue.toString().trim();

  const validationError = validateProduct({
    title,
    description,
    priceRawText,
    price,
    category,
    productUrlRawText,
    imageUrlRawText
  });
  if (validationError) {
    formError.textContent = validationError;
    return;
  }

  const newProduct = {
    id: createId(),
    title,
    description,
    price,
    category,
    productUrl: productUrlRawText,
    imageUrl: imageUrlRawText,
    likes: 0,
    comments: [],
    createdAt: new Date().toISOString()
  };

  products.unshift(newProduct);
  saveProducts();
  renderProducts();
  productForm.reset();
  setAutoFillStatus("");
  setAutoFillLoading(false);
  formError.textContent = "";
}

function validateProduct(product) {
  if (!product.title || product.title.length < 2) {
    return "Title must be at least 2 characters.";
  }
  if (!product.description || product.description.length < 5) {
    return "Description must be at least 5 characters.";
  }
  if (!product.priceRawText) {
    return "Price is required.";
  }
  if (Number.isNaN(product.price) || product.price < 0) {
    return "Price must be a valid number greater than or equal to 0.";
  }
  if (!product.category) {
    return "Please select a category.";
  }
  if (product.productUrlRawText && !isValidHttpUrl(product.productUrlRawText)) {
    return "Product URL must be a valid http(s) link.";
  }
  if (product.imageUrlRawText && !isValidHttpUrl(product.imageUrlRawText)) {
    return "Image URL must be a valid http(s) link.";
  }
  return "";
}

function handleFilterClick(event) {
  const button = event.target.closest(".category-filter-btn");
  if (!button) {
    return;
  }

  activeCategory = button.dataset.category;
  updateCategoryFilterState();
  renderProducts();
}

function handleSearchInput(event) {
  searchTerm = event.target.value.trim().toLowerCase();
  renderProducts();
}

function handleProductUrlPaste() {
  // Wait for paste to update the input value before reading it.
  window.setTimeout(() => {
    void handleProductUrlAutoFill();
  }, 100);
}

async function handleProductUrlAutoFill() {
  const productUrlValue = productUrlInput.value.trim();
  if (!productUrlValue) {
    setAutoFillStatus("");
    return;
  }

  if (!isValidHttpUrl(productUrlValue)) {
    setAutoFillStatus("Enter a valid http(s) product link to auto-fill.", true);
    return;
  }

  const requestId = ++autoFillRequestId;
  setAutoFillLoading(true);
  setAutoFillStatus("Reading product link and extracting details...");

  try {
    const markup = await fetchProductPageMarkup(productUrlValue);
    if (requestId !== autoFillRequestId) {
      return;
    }

    const details = extractProductDetailsFromMarkup(markup, productUrlValue);
    const updatesCount = applyAutoFilledDetails(details);

    if (updatesCount > 0) {
      setAutoFillStatus(`Filled ${updatesCount} field(s) from the product link.`);
      return;
    }

    setAutoFillStatus("Could not extract new details from this link.", true);
  } catch (error) {
    if (requestId !== autoFillRequestId) {
      return;
    }

    console.error("Auto-fill failed:", error);
    setAutoFillStatus(
      "Auto-fill is blocked by this website policy. You can still fill fields manually.",
      true
    );
  } finally {
    if (requestId === autoFillRequestId) {
      setAutoFillLoading(false);
    }
  }
}

function getVisibleProducts() {
  return products
    .filter((product) => {
      if (activeCategory === "all") {
        return true;
      }
      return product.category === activeCategory;
    })
    .filter((product) => {
      if (!searchTerm) {
        return true;
      }
      const text = `${product.title} ${product.description}`.toLowerCase();
      return text.includes(searchTerm);
    });
}

async function fetchProductPageMarkup(productUrl) {
  const candidates = [
    productUrl,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(productUrl)}`
  ];

  let lastError = null;
  for (const candidateUrl of candidates) {
    try {
      const response = await fetchWithTimeout(candidateUrl, 10000);
      if (!response.ok) {
        lastError = new Error(`Request failed with status ${response.status}`);
        continue;
      }

      const markup = await response.text();
      if (markup.trim()) {
        return markup;
      }
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Unable to fetch page markup.");
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      }
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function extractProductDetailsFromMarkup(markup, sourceUrl) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(markup, "text/html");
  const productSchema = extractProductFromJsonLd(doc);

  const title = normalizeText(
    pickFirstNonEmpty([
      productSchema?.name,
      getMetaValue(doc, ["meta[property='og:title']", "meta[name='twitter:title']", "meta[name='title']"]),
      doc.querySelector("title")?.textContent || "",
      extractMarkdownHeading(markup)
    ])
  );

  const description = normalizeText(
    pickFirstNonEmpty([
      productSchema?.description,
      getMetaValue(doc, [
        "meta[property='og:description']",
        "meta[name='description']",
        "meta[name='twitter:description']"
      ])
    ])
  );

  const imageRaw = pickFirstNonEmpty([
    getJsonLdImageUrl(productSchema),
    getMetaValue(doc, ["meta[property='og:image']", "meta[name='twitter:image']", "meta[itemprop='image']"])
  ]);

  const categoryRaw = pickFirstNonEmpty([
    productSchema?.category,
    getMetaValue(doc, ["meta[property='product:category']", "meta[name='category']"])
  ]);

  const priceRaw = pickFirstNonEmpty([
    getJsonLdPrice(productSchema),
    getMetaValue(doc, [
      "meta[property='product:price:amount']",
      "meta[property='og:price:amount']",
      "meta[itemprop='price']"
    ])
  ]);

  return {
    title,
    description,
    imageUrl: resolveUrl(imageRaw, sourceUrl),
    category: suggestCategoryValue(categoryRaw),
    price: normalizePrice(priceRaw)
  };
}

function applyAutoFilledDetails(details) {
  let updatesCount = 0;

  if (details.title && titleInput.value.trim() !== details.title) {
    titleInput.value = details.title;
    updatesCount += 1;
  }

  if (details.description && descriptionInput.value.trim() !== details.description) {
    descriptionInput.value = details.description;
    updatesCount += 1;
  }

  if (details.price !== null) {
    const nextPriceValue = String(details.price);
    if (priceInput.value.trim() !== nextPriceValue) {
      priceInput.value = nextPriceValue;
      updatesCount += 1;
    }
  }

  if (details.category && categoryInput.value !== details.category) {
    categoryInput.value = details.category;
    updatesCount += 1;
  }

  if (details.imageUrl && imageUrlInput.value.trim() !== details.imageUrl) {
    imageUrlInput.value = details.imageUrl;
    updatesCount += 1;
  }

  return updatesCount;
}

function renderProducts() {
  const visibleProducts = getVisibleProducts();
  productList.innerHTML = "";

  visibleProducts.forEach((product) => {
    const card = createProductCard(product);
    productList.appendChild(card);
  });

  if (products.length === 0) {
    emptyState.textContent = "No products yet, share the first one!";
  } else if (visibleProducts.length === 0) {
    emptyState.textContent = "No products match the selected category or search text.";
  }

  // Empty state is shown when current filters return no products.
  emptyState.classList.toggle("visually-hidden", visibleProducts.length > 0);
  updateStats();
}

function createProductCard(product) {
  const article = document.createElement("article");
  article.className = "product-card";
  article.dataset.id = product.id;
  const productUrl = typeof product.productUrl === "string" ? product.productUrl : "";
  const hasProductUrl = productUrl.trim() !== "";
  const imageUrl = getEffectiveImageUrl(product);
  const hasImageUrl = imageUrl.trim() !== "";

  const commentItems = product.comments
    .map((comment) => `<li>${escapeHtml(comment.text)}</li>`)
    .join("");

  article.innerHTML = `
    ${
      hasImageUrl
        ? `<div class="product-image-wrap">
      <img class="product-image" src="${escapeAttribute(imageUrl)}" alt="${escapeAttribute(
            product.title
          )}" loading="lazy">
    </div>`
        : ""
    }
    <div class="product-head">
      <h3>${escapeHtml(product.title)}</h3>
      <span class="category-badge">${escapeHtml(product.category)}</span>
    </div>
    <p class="product-description">${escapeHtml(product.description)}</p>
    <div class="meta">
      <strong>${formatPrice(product.price)}</strong>
      <span>${formatDate(product.createdAt)}</span>
    </div>
    ${
      hasProductUrl
        ? `<a class="product-link" href="${escapeAttribute(
            productUrl
          )}" target="_blank" rel="noopener noreferrer">Open product link</a>`
        : ""
    }
    <div class="actions">
      <button type="button" class="like-btn" data-action="like" data-id="${product.id}">
        Like (${product.likes})
      </button>
      <button type="button" class="share-btn" data-action="share" data-id="${product.id}">
        Share
      </button>
      <button type="button" class="delete-btn" data-action="delete" data-id="${product.id}">
        Delete
      </button>
    </div>
    <form class="comment-form" data-id="${product.id}">
      <label class="visually-hidden" for="comment-${product.id}">Comment</label>
      <input
        id="comment-${product.id}"
        name="comment"
        type="text"
        placeholder="Write a comment"
        maxlength="120"
        required
      >
      <button type="submit">Post</button>
    </form>
    <ul class="comment-list">${commentItems}</ul>
  `;

  const productImage = article.querySelector(".product-image");
  if (productImage) {
    productImage.addEventListener("error", () => {
      const imageWrap = article.querySelector(".product-image-wrap");
      if (imageWrap) {
        imageWrap.remove();
      }
    });
  }

  return article;
}

function handleProductListClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }

  const productId = button.dataset.id;
  const product = products.find((item) => item.id === productId);
  if (!product) {
    return;
  }

  if (button.dataset.action === "like") {
    product.likes += 1;
    saveProducts();
    renderProducts();
    return;
  }

  if (button.dataset.action === "share") {
    void shareProduct(product);
    return;
  }

  if (button.dataset.action === "delete") {
    const isConfirmed = confirm("Are you sure you want to delete this product?");
    if (!isConfirmed) {
      return;
    }
    products = products.filter((item) => item.id !== productId);
    saveProducts();
    renderProducts();
  }
}

function handleCommentSubmit(event) {
  const form = event.target;
  if (!form.classList.contains("comment-form")) {
    return;
  }

  event.preventDefault();
  const productId = form.dataset.id;
  const input = form.querySelector("input[name='comment']");
  const text = input.value.trim();

  if (!text) {
    return;
  }

  const product = products.find((item) => item.id === productId);
  if (!product) {
    return;
  }

  product.comments.push({
    id: createId(),
    text,
    createdAt: new Date().toISOString()
  });

  saveProducts();
  renderProducts();
}

function updateStats() {
  const totals = products.reduce(
    (accumulator, product) => {
      accumulator.products += 1;
      accumulator.likes += product.likes;
      accumulator.comments += product.comments.length;
      return accumulator;
    },
    { products: 0, likes: 0, comments: 0 }
  );

  productCount.textContent = String(totals.products);
  likeCount.textContent = String(totals.likes);
  commentCount.textContent = String(totals.comments);
}

function updateCategoryFilterState() {
  const filterButtons = categoryFilterNav.querySelectorAll(".category-filter-btn");
  filterButtons.forEach((button) => {
    const isActive = button.dataset.category === activeCategory;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function setAutoFillLoading(isLoading) {
  productUrlInput.classList.toggle("is-loading", isLoading);
  productUrlInput.setAttribute("aria-busy", String(isLoading));
}

function setAutoFillStatus(message, isError = false) {
  autoFillStatus.textContent = message;
  autoFillStatus.classList.toggle("is-error", isError);
}

function extractProductFromJsonLd(doc) {
  const scripts = Array.from(doc.querySelectorAll("script[type='application/ld+json']"));
  for (const script of scripts) {
    const rawText = script.textContent ? script.textContent.trim() : "";
    if (!rawText) {
      continue;
    }

    try {
      const parsed = JSON.parse(rawText);
      const product = findProductNodeInJsonLd(parsed);
      if (product) {
        return product;
      }
    } catch {
      // Some websites publish malformed JSON-LD; skip and continue.
    }
  }

  return null;
}

function findProductNodeInJsonLd(node) {
  if (!node || typeof node !== "object") {
    return null;
  }

  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findProductNodeInJsonLd(item);
      if (found) {
        return found;
      }
    }
    return null;
  }

  if (isJsonLdProductType(node["@type"])) {
    return node;
  }

  if (node["@graph"]) {
    const graphFound = findProductNodeInJsonLd(node["@graph"]);
    if (graphFound) {
      return graphFound;
    }
  }

  for (const key of Object.keys(node)) {
    const nestedFound = findProductNodeInJsonLd(node[key]);
    if (nestedFound) {
      return nestedFound;
    }
  }

  return null;
}

function isJsonLdProductType(typeValue) {
  if (!typeValue) {
    return false;
  }

  if (Array.isArray(typeValue)) {
    return typeValue.some(isJsonLdProductType);
  }

  return String(typeValue).toLowerCase().includes("product");
}

function getJsonLdImageUrl(productSchema) {
  if (!productSchema) {
    return "";
  }

  const image = productSchema.image;
  if (typeof image === "string") {
    return image;
  }
  if (Array.isArray(image) && image.length > 0) {
    if (typeof image[0] === "string") {
      return image[0];
    }
    if (image[0] && typeof image[0] === "object" && typeof image[0].url === "string") {
      return image[0].url;
    }
  }
  if (image && typeof image === "object" && typeof image.url === "string") {
    return image.url;
  }

  return "";
}

function getJsonLdPrice(productSchema) {
  if (!productSchema || !productSchema.offers) {
    return "";
  }

  const offers = Array.isArray(productSchema.offers) ? productSchema.offers[0] : productSchema.offers;
  if (!offers || typeof offers !== "object") {
    return "";
  }

  return pickFirstNonEmpty([offers.price, offers.lowPrice, offers.highPrice]);
}

function getMetaValue(doc, selectors) {
  for (const selector of selectors) {
    const element = doc.querySelector(selector);
    if (!element) {
      continue;
    }
    const rawContent = element.getAttribute("content") || element.textContent || "";
    const value = rawContent.trim();
    if (value) {
      return value;
    }
  }
  return "";
}

function pickFirstNonEmpty(values) {
  for (const value of values) {
    if (value === null || value === undefined) {
      continue;
    }
    const text = String(value).trim();
    if (text) {
      return text;
    }
  }
  return "";
}

function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePrice(rawValue) {
  if (rawValue === null || rawValue === undefined) {
    return null;
  }

  let cleaned = String(rawValue).trim();
  if (!cleaned) {
    return null;
  }

  cleaned = cleaned.replace(/[^\d.,-]/g, "");
  if (!cleaned) {
    return null;
  }

  if (cleaned.includes(",") && cleaned.includes(".")) {
    if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      cleaned = cleaned.replace(/,/g, "");
    }
  } else if (cleaned.includes(",")) {
    cleaned = cleaned.replace(",", ".");
  }

  const parsed = Number(cleaned);
  if (Number.isNaN(parsed) || parsed < 0) {
    return null;
  }

  return Number(parsed.toFixed(2));
}

function resolveUrl(value, baseUrl) {
  const rawValue = String(value || "").trim();
  if (!rawValue) {
    return "";
  }

  try {
    return new URL(rawValue, baseUrl).href;
  } catch {
    return "";
  }
}

function suggestCategoryValue(categoryRaw) {
  const normalized = String(categoryRaw || "").toLowerCase().trim();
  if (!normalized) {
    return "";
  }

  const optionValues = Array.from(categoryInput.options).map((option) => option.value);
  const directMatch = optionValues.find(
    (value) => value && normalized.includes(value.toLowerCase())
  );
  if (directMatch) {
    return directMatch;
  }

  const keywordMap = [
    { value: "Electronics", pattern: /(electronic|phone|laptop|camera|tablet|headphone|tech)/i },
    { value: "Books", pattern: /(book|novel|textbook|magazine|ebook)/i },
    { value: "Fashion", pattern: /(fashion|shirt|dress|shoe|jacket|bag|clothing)/i },
    { value: "Home", pattern: /(home|kitchen|furniture|decor|appliance)/i }
  ];

  for (const entry of keywordMap) {
    if (entry.pattern.test(normalized)) {
      return entry.value;
    }
  }

  return "Other";
}

function extractMarkdownHeading(markup) {
  const match = markup.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : "";
}

async function shareProduct(product) {
  const shareUrl = getShareUrl(product);
  const imageUrl = getEffectiveImageUrl(product);
  const textPart = `${product.description}${imageUrl ? `\nImage: ${imageUrl}` : ""}`;
  const payload = {
    title: product.title,
    text: textPart,
    url: shareUrl
  };

  try {
    const shareImageFile = await buildShareImageFile(product);
    if (navigator.share) {
      if (shareImageFile && navigator.canShare && navigator.canShare({ files: [shareImageFile] })) {
        await navigator.share({
          title: product.title,
          text: product.description,
          files: [shareImageFile]
        });
        showActionFeedback("Product shared with image.");
        return;
      }

      await navigator.share(payload);
      showActionFeedback("Product shared successfully.");
      return;
    }

    await copyTextToClipboard(shareUrl);
    showActionFeedback("Product link copied to clipboard.");
  } catch (error) {
    if (error && error.name === "AbortError") {
      return;
    }
    console.error("Share failed:", error);
    showActionFeedback("Sharing failed on this browser.");
  }
}

function getShareUrl(product) {
  const productUrl = typeof product.productUrl === "string" ? product.productUrl.trim() : "";
  if (productUrl) {
    return productUrl;
  }
  return `${window.location.origin}${window.location.pathname}#product-${product.id}`;
}

async function buildShareImageFile(product) {
  const imageUrl = getEffectiveImageUrl(product);
  if (!imageUrl) {
    return null;
  }

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return null;
    }

    const blob = await response.blob();
    if (!blob.type.startsWith("image/")) {
      return null;
    }

    const extension = getExtensionFromMimeType(blob.type);
    return new File([blob], `product-image.${extension}`, { type: blob.type });
  } catch (error) {
    console.error("Unable to load image for share:", error);
    return null;
  }
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const tempInput = document.createElement("textarea");
  tempInput.value = text;
  tempInput.setAttribute("readonly", "true");
  tempInput.style.position = "absolute";
  tempInput.style.left = "-9999px";
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand("copy");
  document.body.removeChild(tempInput);
}

function showActionFeedback(message) {
  actionFeedback.textContent = message;
  window.clearTimeout(showActionFeedback.timeoutId);
  showActionFeedback.timeoutId = window.setTimeout(() => {
    actionFeedback.textContent = "";
  }, 2500);
}

function isValidHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function getExtensionFromMimeType(mimeType) {
  const extensionMap = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/svg+xml": "svg",
    "image/bmp": "bmp"
  };

  return extensionMap[mimeType] || "png";
}

function getEffectiveImageUrl(product) {
  const imageUrl = typeof product.imageUrl === "string" ? product.imageUrl.trim() : "";
  if (imageUrl) {
    return imageUrl;
  }

  const productUrl = typeof product.productUrl === "string" ? product.productUrl.trim() : "";
  if (isLikelyImageUrl(productUrl)) {
    return productUrl;
  }

  return "";
}

function isLikelyImageUrl(url) {
  return /\.(png|jpe?g|webp|gif|bmp|svg)(\?.*)?$/i.test(url);
}

function createId() {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function formatPrice(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(value);
}

function formatDate(isoDate) {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function escapeAttribute(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
