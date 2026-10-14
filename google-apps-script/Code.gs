/** AZ BAKERS menu API. Sheet columns match the Product type in src/lib/products.ts. */
const HEADERS = ["id", "name", "category", "price", "description", "image", "tags", "serves", "ingredients", "allergens", "prepDays", "featured", "stock"];
const STARTER_ROWS = [
  ["strawberry-dream", "Strawberry dream cake", "Celebration cakes", 1850, "Soft vanilla sponge, cloud-light cream, and strawberries at their ripest.", "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1100&q=85", "birthday,fruity,share,vegetarian", "Serves 8–10", "Wheat flour, eggs, dairy cream, strawberries, sugar, vanilla.", "Contains wheat, eggs, and dairy. Prepared in a kitchen that handles nuts.", 2, true, 8],
  ["dark-chocolate", "Midnight chocolate cake", "Celebration cakes", 2100, "Deep cocoa sponge wrapped in silky dark chocolate ganache.", "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=1100&q=85", "chocolate,birthday,share,vegetarian", "Serves 8–10", "Wheat flour, eggs, dairy, cocoa, dark chocolate, sugar.", "Contains wheat, eggs, and dairy. Prepared in a kitchen that handles nuts.", 2, true, 6],
  ["lemon-cloud", "Lemon & elderflower cloud", "Celebration cakes", 1950, "Bright lemon sponge, fragrant elderflower, and a little sunshine.", "https://images.unsplash.com/photo-1464195244916-405fa0a82545?auto=format&fit=crop&w=1100&q=85", "fruity,birthday,share,vegetarian", "Serves 8–10", "Wheat flour, eggs, butter, lemon, elderflower, sugar.", "Contains wheat, eggs, and dairy. Prepared in a kitchen that handles nuts.", 2, false, 5],
  ["cinnamon-rolls", "Sunday cinnamon rolls", "Pastries", 320, "Pillowy, slow-risen rolls with a buttery cinnamon swirl.", "https://images.unsplash.com/photo-1509365465985-25d11c17e812?auto=format&fit=crop&w=1100&q=85", "share,small-treat,vegetarian", "Box of 2", "Wheat flour, milk, butter, cinnamon, yeast, sugar.", "Contains wheat and dairy. Prepared in a kitchen that handles nuts.", 0, true, 18],
  ["berry-tart", "Little berry tart", "Pastries", 280, "A crisp, buttery shell filled with vanilla custard and berries.", "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1100&q=85", "fruity,small-treat,gift,vegetarian", "1 tart", "Wheat flour, eggs, dairy, berries, sugar, vanilla.", "Contains wheat, eggs, and dairy. Prepared in a kitchen that handles nuts.", 0, false, 10],
  ["brownie-box", "Fudgy brownie box", "Cookies & bites", 450, "Crackly on top, gloriously fudgy within. Made for sharing (or not).", "https://images.unsplash.com/photo-1607920591413-4ec007e70023?auto=format&fit=crop&w=1100&q=85", "chocolate,share,gift,small-treat,vegetarian", "Box of 4", "Wheat flour, eggs, butter, dark chocolate, cocoa, sugar.", "Contains wheat, eggs, and dairy. Prepared in a kitchen that handles nuts.", 0, true, 14],
  ["sourdough", "Slow morning sourdough", "Fresh bread", 390, "A crackly crust and chewy middle, naturally leavened overnight.", "https://images.unsplash.com/photo-1585478259715-876acc5be8eb?auto=format&fit=crop&w=1100&q=85", "share,vegetarian", "One loaf", "Wheat flour, water, sourdough starter, sea salt.", "Contains wheat. Prepared in a kitchen that handles nuts.", 0, false, 12],
  ["vanilla-cupcakes", "Vanilla party cupcakes", "Cookies & bites", 540, "A little vanilla cake with a generous swirl of buttercream. Box of four.", "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&w=1100&q=85", "birthday,gift,small-treat,vegetarian", "Box of 4", "Wheat flour, eggs, butter, milk, vanilla, sugar.", "Contains wheat, eggs, and dairy. Prepared in a kitchen that handles nuts.", 0, false, 12]
];

function doGet() {
  return json_({ products: readProducts_() });
}

function doPost(event) {
  const lock = LockService.getScriptLock();
  try {
    const input = JSON.parse(event.postData.contents || "{}");
    const expected = PropertiesService.getScriptProperties().getProperty("ADMIN_KEY");
    if (!expected || input.adminKey !== expected) return json_({ error: "Admin access was not accepted." });
    lock.waitLock(15000);
    const sheet = menuSheet_();
    const action = input.action;
    if (action === "create") {
      const product = normalize_(input.product || {});
      if (!product.name || !product.id) throw new Error("A product name and id are required.");
      if (findRow_(sheet, product.id)) throw new Error("That product id already exists.");
      sheet.appendRow(HEADERS.map(key => valueFor_(product, key)));
    } else if (action === "update") {
      const product = normalize_(input.product || {});
      const row = findRow_(sheet, product.id);
      if (!row) throw new Error("That product was not found.");
      sheet.getRange(row, 1, 1, HEADERS.length).setValues([HEADERS.map(key => valueFor_(product, key))]);
    } else if (action === "delete") {
      const row = findRow_(sheet, String(input.id || ""));
      if (!row) throw new Error("That product was not found.");
      sheet.deleteRow(row);
    } else {
      throw new Error("Choose create, update, or delete.");
    }
    SpreadsheetApp.flush();
    return json_({ ok: true, products: readProducts_() });
  } catch (error) {
    return json_({ error: String(error && error.message || error) });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function menuSheet_() {
  const id = PropertiesService.getScriptProperties().getProperty("SHEET_ID");
  if (!id) throw new Error("Set SHEET_ID in the Apps Script project properties.");
  const book = SpreadsheetApp.openById(id);
  let sheet = book.getSheetByName("Products");
  if (!sheet) sheet = book.insertSheet("Products");
  if (sheet.getLastRow() === 0) sheet.getRange(1, 1, STARTER_ROWS.length + 1, HEADERS.length).setValues([HEADERS, ...STARTER_ROWS]);
  return sheet;
}

function readProducts_() {
  const sheet = menuSheet_();
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return [];
  const keys = rows[0].map(String);
  return rows.slice(1).filter(row => row.some(value => value !== "")).map(row => {
    const record = {};
    keys.forEach((key, index) => record[key] = row[index]);
    return normalize_(record);
  });
}

function findRow_(sheet, id) {
  if (sheet.getLastRow() < 2) return 0;
  const found = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1)
    .createTextFinder(String(id)).matchEntireCell(true).findNext();
  return found ? found.getRow() : 0;
}

function normalize_(item) {
  return {
    id: String(item.id || ""), name: String(item.name || ""), category: String(item.category || "Pastries"),
    price: Number(item.price || 0), description: String(item.description || ""), image: String(item.image || "/images/bake-placeholder.svg"),
    tags: Array.isArray(item.tags) ? item.tags.map(String) : String(item.tags || "").split(",").map(tag => tag.trim()).filter(Boolean),
    serves: String(item.serves || "One treat"), ingredients: String(item.ingredients || ""), allergens: String(item.allergens || ""),
    prepDays: Number(item.prepDays || 0), featured: item.featured === true || String(item.featured).toLowerCase() === "true",
    stock: Number(item.stock || 0)
  };
}

function valueFor_(product, key) {
  return key === "tags" ? product.tags.join(",") : product[key];
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
