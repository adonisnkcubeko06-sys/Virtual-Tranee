/* ==========================================================================
   PANAROTTIS TRAINING PORTAL — application script
   Plain, framework-free JavaScript (ES2017+). No build step required, so
   this runs unmodified in Safari on iOS and Chrome on Android, as well as
   every modern desktop browser. If a TypeScript source is ever wanted,
   this file's functions map 1:1 onto typed equivalents — but shipping
   compiled JS (as done here) is what guarantees it "just works" when the
   file is opened directly on a phone with no tooling installed.
   ========================================================================== */
(function () {
  "use strict";

  /* -------------------------------------------------------------------
     0. SAFE STORAGE WRAPPER
     Wraps localStorage so a private-browsing / storage-denied context
     (common on some iOS configurations) never throws and breaks the app.
     ------------------------------------------------------------------- */
  var STORAGE_KEY = "panarottisTrainingProgress_v1";
  var memoryFallback = null; // used only if localStorage is unavailable

  function storageAvailable() {
    try {
      var t = "__pana_test__";
      window.localStorage.setItem(t, "1");
      window.localStorage.removeItem(t);
      return true;
    } catch (e) {
      return false;
    }
  }
  var HAS_STORAGE = storageAvailable();

  function loadProgress() {
    var defaults = {
      quiz: { answered: 0, correct: 0, streak: 0, bestStreak: 0, completed: false, bestPct: 0 },
      tf: { answered: 0, correct: 0, streak: 0, bestStreak: 0, completed: false, bestPct: 0 },
      scenario: { answered: 0, correct: 0, streak: 0, bestStreak: 0, completed: false, bestPct: 0 },
      menuViewed: false
    };
    if (!HAS_STORAGE) return memoryFallback || defaults;
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaults;
      var parsed = JSON.parse(raw);
      // merge defensively in case of older/partial saved shapes
      return Object.assign({}, defaults, parsed, {
        quiz: Object.assign({}, defaults.quiz, parsed.quiz),
        tf: Object.assign({}, defaults.tf, parsed.tf),
        scenario: Object.assign({}, defaults.scenario, parsed.scenario)
      });
    } catch (e) {
      return defaults;
    }
  }

  function saveProgress() {
    if (!HAS_STORAGE) { memoryFallback = state.progress; return; }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));
    } catch (e) {
      /* storage full or blocked mid-session — fail silently, keep app usable */
    }
  }

  /* -------------------------------------------------------------------
     1. CONTENT DATA
     Placeholder content structured so real menu photos can be swapped
     in later without touching any logic below. Each menu item's `id`
     is reused by quiz/flashcard questions that reference it.
     ------------------------------------------------------------------- */

const MENU_DATA = {
    beverages: {
        title: "🍷 Beverages",
        subcategories: {
            "House Wines": [
                { name: "Sweet Rosé", price: "Glass R48.90 / Bottle R138.90", desc: "Fresh and fruity with strawberry aromas and a juicy, balanced palate. Perfect summer aperitif.", ingredients: ["Rosé wine", "Strawberry aromas", "Balanced palate"], tags: ["wine"], modifiers: ["Pairs with salads, light meals, seafood pizzas and pastas"] },
                { name: "Sauvignon Blanc", price: "Glass R49.90 / Bottle R141.90", desc: "Aromatic and crisp, with notes of gooseberry, citrus and fresh grass. Zesty acidity balanced by white fruit, green fig and a hint of minerality.", ingredients: ["Sauvignon Blanc wine", "Gooseberry notes", "Citrus", "Fresh grass", "Green fig", "Minerality"], tags: ["wine"], modifiers: ["Pairs with salads, chicken, seafood, pizzas and pastas"] },
                { name: "Merlot", price: "Glass R51.90 / Bottle R149.90", desc: "Soft and medium-bodied, with delicate spice and ripe red berry aromas. Smooth tannins and good length.", ingredients: ["Merlot wine", "Spice notes", "Red berry aromas", "Smooth tannins"], tags: ["wine"], modifiers: ["Pairs with red meat pizzas and pastas"] }
            ],
            "Specially Selected Wines - Dry White": [
                { name: "Graça", price: "Glass R135.90", desc: "A light, crisp, off-dry white wine with a slight sparkle.", ingredients: ["White wine", "Off-dry", "Slight sparkle"], tags: ["wine", "white"] },
                { name: "Van Loveren Sauvignon Blanc", price: "Glass R66.90 / Bottle R175.90", desc: "Aromatic and full-bodied wine has hints of melon and figs on the palate.", ingredients: ["Sauvignon Blanc", "Melon hints", "Fig notes", "Full-bodied"], tags: ["wine", "white"] },
                { name: "Two Oceans Sauvignon Blanc", price: "Glass R52.90 / Bottle R142.90", desc: "Grassy nuances, light, crisp, remarkably fresh and very palatable.", ingredients: ["Sauvignon Blanc", "Grassy nuances", "Light & crisp"], tags: ["wine", "white"] },
                { name: "Spier Chardonnay", price: "Glass R68.90 / Bottle R179.90", desc: "Subtle nuanced citrus, Golden Delicious apples, ripe nectarines and the creaminess of a vanilla bean crème brûlée.", ingredients: ["Chardonnay", "Citrus", "Golden Delicious apples", "Ripe nectarines", "Vanilla bean crème brûlée"], tags: ["wine", "white"] },
                { name: "Leopard's Leap Chenin Blanc", price: "Bottle R179.90", desc: "Medium-bodied, zesty lemon and lime notes with layers of sweet melon and subtle green herbaceous aromas.", ingredients: ["Chenin Blanc", "Lemon", "Lime", "Sweet melon", "Green herbaceous aromas"], tags: ["wine", "white"] }
            ],
            "Specially Selected Wines - Sparkling": [
                { name: "JC Le Roux Le Domaine", price: "R209.90", desc: "Premium sparkling wine.", ingredients: ["Sparkling wine", "Premium blend"], tags: ["wine", "sparkling"] }
            ],
            "Specially Selected Wines - Semi-Sweet": [
                { name: "Four Cousins Natural Sweet White", price: "Glass R53.90 / Bottle R136.90", desc: "A fragrant, sunshine-coloured wine with a gentle honeysuckle perfume.", ingredients: ["Sweet white wine", "Honeysuckle perfume", "Sunshine-coloured"], tags: ["wine", "white", "sweet"] },
                { name: "Drostdy Hof Adelpracht", price: "Glass R52.90 / Bottle R134.90", desc: "A well-balanced, fruity white wine to complement any occasion.", ingredients: ["White wine", "Fruity", "Well-balanced"], tags: ["wine", "white", "sweet"] }
            ],
            "Specially Selected Wines - Rosé": [
                { name: "Graça Rosé", price: "Glass R134.90", desc: "Light off-dry wine, rich in colour, fruity in taste. Made from Sauvignon Blanc, Sémillon, Pinotage and Colombard grapes.", ingredients: ["Rosé wine", "Sauvignon Blanc", "Sémillon", "Pinotage", "Colombard grapes"], tags: ["wine", "rose"] },
                { name: "Four Cousins Rosé", price: "Glass R51.90 / Bottle R138.90", desc: "Fruity, easy-drinking wine with tropical flavours and a silky finish.", ingredients: ["Rosé wine", "Tropical flavours", "Silky finish"], tags: ["wine", "rose"] },
                { name: "Van Loveren Moscato Perle Rosé", price: "Glass R61.90 / Bottle R166.90", desc: "Irresistibly fruity with flavours of raspberry and wild strawberry with abundant notes of rose petal.", ingredients: ["Moscato Perle Rosé", "Raspberry", "Wild strawberry", "Rose petal notes"], tags: ["wine", "rose"] }
            ],
            "Specially Selected Wines - Red": [
                { name: "Two Oceans Cab Sav Merlot", price: "Glass R52.90 / Bottle R142.90", desc: "Full of berry aromas with undertones of grassiness. Medium-bodied and fruity.", ingredients: ["Cabernet Sauvignon", "Merlot blend", "Berry aromas", "Grassiness undertones"], tags: ["wine", "red"] },
                { name: "The Wolftrap", price: "Glass R59.90 / Bottle R159.90", desc: "A rich, deep red blend that includes Syrah, Mourvèdre and Viognier.", ingredients: ["Red blend", "Syrah", "Mourvèdre", "Viognier"], tags: ["wine", "red"] },
                { name: "Nederburg Baronne", price: "Bottle R181.90", desc: "A medium-bodied, smooth dry red showing delectable fruit and maturation flavours.", ingredients: ["Red wine", "Smooth dry red", "Fruit flavours", "Maturation notes"], tags: ["wine", "red"] }
            ],
            "Ciders & Spritzers": [
                { name: "Hunter's", price: "R48.90", desc: "Gold, Dry or Extreme", ingredients: ["Apple cider", "Varieties: Gold, Dry, Extreme"], tags: ["cider"] },
                { name: "Savanna Dry", price: "R54.90", desc: "Crisp dry cider", ingredients: ["Apple cider", "Crisp dry"], tags: ["cider"] },
                { name: "Flying Fish Pressed Lemon", price: "R48.90", desc: "Refreshing lemon flavoured", ingredients: ["Apple cider", "Pressed lemon flavour"], tags: ["cider"] },
                { name: "Brutal Fruit Ruby Apple", price: "R47.90", desc: "Apple flavoured cider", ingredients: ["Apple cider", "Ruby apple flavour"], tags: ["cider"] }
            ],
            "Beers - Local": [
                { name: "Castle Lager", price: "R39.90", desc: "Local favourite", ingredients: ["Lager beer", "Local brew"], tags: ["beer"] },
                { name: "Castle Lite", price: "R43.90", desc: "Light beer", ingredients: ["Light lager beer"], tags: ["beer"] },
                { name: "Carling Black Label", price: "R43.90", desc: "Premium local", ingredients: ["Premium lager beer", "Local brew"], tags: ["beer"] }
            ],
            "Beers - Draught on Tap": [
                { name: "Castle Lager (500ml)", price: "R43.90", desc: "Where available", ingredients: ["Draught lager", "500ml serve"], tags: ["beer", "draught"] },
                { name: "Castle Lite (500ml)", price: "R46.90", desc: "Where available", ingredients: ["Draught light lager", "500ml serve"], tags: ["beer", "draught"] }
            ],
            "Beers - International": [
                { name: "Windhoek Draught (440ml)", price: "R56.90", desc: "Namibian premium", ingredients: ["Namibian draught beer", "440ml serve"], tags: ["beer"] },
                { name: "Stella Artois", price: "R48.90", desc: "Belgian pilsner", ingredients: ["Belgian pilsner beer"], tags: ["beer"] },
                { name: "Heineken", price: "R49.90", desc: "Dutch premium lager", ingredients: ["Dutch premium lager"], tags: ["beer"] },
                { name: "Corona", price: "R49.90", desc: "Mexican lager", ingredients: ["Mexican lager beer"], tags: ["beer"] }
            ],
            "Spirits (Soda/Fountain Mixer R25.90)": [
                { name: "Skyy Vodka", price: "R37.90", ingredients: ["Vodka", "Premium grain spirit"], tags: ["spirit", "vodka"] },
                { name: "Smirnoff Vodka", price: "R30.90", ingredients: ["Vodka", "Triple distilled"], tags: ["spirit", "vodka"] },
                { name: "Gordon's Gin", price: "R31.90", ingredients: ["London dry gin", "Juniper berries", "Botanicals"], tags: ["spirit", "gin"] },
                { name: "Tanqueray Gin", price: "R36.90", ingredients: ["Premium London dry gin", "Botanical blend"], tags: ["spirit", "gin"] },
                { name: "Bell's", price: "R34.90", ingredients: ["Blended Scotch whisky"], tags: ["spirit", "whisky"] },
                { name: "Jameson", price: "R47.90", ingredients: ["Irish whiskey", "Triple distilled"], tags: ["spirit", "whisky"] },
                { name: "Johnnie Walker Blonde", price: "R39.90", ingredients: ["Blended Scotch whisky", "Blonde label"], tags: ["spirit", "whisky"] },
                { name: "Johnnie Walker Black", price: "R53.90", ingredients: ["Blended Scotch whisky", "12-year aged"], tags: ["spirit", "whisky"] },
                { name: "Klipdrift", price: "R30.90", ingredients: ["South African brandy"], tags: ["spirit", "brandy"] },
                { name: "Richelieu", price: "R30.90", ingredients: ["South African brandy"], tags: ["spirit", "brandy"] },
                { name: "Hennessy VSOP", price: "R78.90", ingredients: ["Cognac", "Very Superior Old Pale", "Aged grape spirit"], tags: ["spirit", "cognac"] },
                { name: "Captain Morgan Rum", price: "R30.90", ingredients: ["Spiced rum", "Caribbean blend"], tags: ["spirit", "rum"] },
                { name: "Spiced Gold Rum", price: "R30.90", ingredients: ["Gold rum", "Spiced blend"], tags: ["spirit", "rum"] },
                { name: "Havana Club Rum 3YO", price: "R49.90", ingredients: ["Cuban rum", "3 Year Old aged"], tags: ["spirit", "rum"] }
            ],
            "Liqueurs": [
                { name: "Amarula Cream", price: "R31.90", ingredients: ["Cream liqueur", "Marula fruit", "African origin"], tags: ["liqueur"] },
                { name: "Kahlúa", price: "R38.90", ingredients: ["Coffee liqueur", "Mexican origin", "Rum base"], tags: ["liqueur"] }
            ],
            "Shooters": [
                { name: "Jägermeister", price: "R42.90", ingredients: ["Herbal liqueur", "56 botanicals", "German origin"], tags: ["shooter"] },
                { name: "Jose Cuervo Gold Tequila", price: "R41.90", ingredients: ["Gold tequila", "100% agave", "Mexican origin"], tags: ["shooter", "tequila"] }
            ],
            "Alcohol-Free": [
                { name: "Savanna 0.0 Cider", price: "R49.90", ingredients: ["Non-alcoholic cider", "Apple base"], tags: ["non-alcoholic", "cider"] },
                { name: "Brutal Fruit 0.0 Ruby Apple", price: "R49.90", ingredients: ["Non-alcoholic cider", "Ruby apple flavour"], tags: ["non-alcoholic", "cider"] },
                { name: "Heineken 0.0 Beer", price: "R49.90", ingredients: ["Non-alcoholic beer", "Lager style"], tags: ["non-alcoholic", "beer"] }
            ],
            "Mixers": [
                { name: "Standard Mixers", price: "R29.90", desc: "Coke, Dry Lemon, Ginger Ale, Lemonade, Soda Water, Indian Tonic Water, Schweppes Floral Pink Tonic", ingredients: ["Coca-Cola", "Dry Lemon", "Ginger Ale", "Lemonade", "Soda Water", "Indian Tonic Water", "Schweppes Floral Pink Tonic"], tags: ["mixer"] },
                { name: "Red Bull Energy (250ml)", price: "R49.90", desc: "Regular, Watermelon, Sugarfree or Apricot & Strawberry", ingredients: ["Energy drink", "Taurine", "Caffeine", "B-vitamins"], tags: ["mixer", "energy"] }
            ],
            "Cocktails & Flavours": [
                { name: "Tropical Bull", price: "R85.90", desc: "Vodka with Red Bull Apricot & Strawberry", ingredients: ["Vodka", "Red Bull Apricot & Strawberry"], tags: ["cocktail"] },
                { name: "Sunset Bull", price: "R89.90", desc: "Vodka, Orange Juice, Cranberry Juice & Red Bull", ingredients: ["Vodka", "Orange Juice", "Cranberry Juice", "Red Bull"], tags: ["cocktail"] },
                { name: "Watermelon Gin Bull", price: "R89.90", desc: "Gin & Red Bull Watermelon", ingredients: ["Gin", "Red Bull Watermelon"], tags: ["cocktail"] },
                { name: "Sangria", price: "Per Litre R137.90 / Carafe R82.90 / Glass R47.90", desc: "Deliciously refreshing wine cocktail", ingredients: ["Red wine", "Fresh fruit", "Brandy", "Orange juice", "Sugar"], tags: ["cocktail", "wine"] },
                { name: "Mojito", price: "Cocktail R89.90 / Mocktail R69.90", ingredients: ["White rum (cocktail)", "Fresh mint", "Lime juice", "Sugar", "Soda water"], tags: ["cocktail", "mocktail"] },
                { name: "Strawberry Daiquiri", price: "Cocktail R87.90 / Mocktail R69.90", ingredients: ["White rum (cocktail)", "Fresh strawberries", "Lime juice", "Sugar syrup"], tags: ["cocktail", "mocktail"] },
                { name: "Margarita", price: "Cocktail R89.90 / Mocktail R68.90", ingredients: ["Tequila (cocktail)", "Triple sec", "Lime juice", "Salt rim"], tags: ["cocktail", "mocktail"] },
                { name: "Cranberry Cosmo", price: "Cocktail R79.90 / Mocktail R68.90", ingredients: ["Vodka (cocktail)", "Cranberry juice", "Triple sec", "Lime juice"], tags: ["cocktail", "mocktail"] }
            ]
        }
    },
    pizza: {
        title: "🍕 Pizzas",
        subcategories: {
            "Classic Pizzas": [
                { name: "Margherita", price: "R94.90", desc: "A traditional tomato base topped with mozzarella and Italian spices.", ingredients: ["Tomato base", "Mozzarella cheese", "Italian spices", "Oregano", "Basil"], tags: ["veg", "classic"], modifiers: ["Vegan option available"] },
                { name: "Three Cheese Flatbread", price: "R113.90", desc: "Garlic or herb flatbread topped with mozzarella, cheddar and Danish feta.", ingredients: ["Garlic or herb flatbread base", "Mozzarella", "Cheddar cheese", "Danish feta"], tags: ["veg", "classic"] },
                { name: "Saucy Chicken & Mushroom", price: "R155.90", desc: "Roast chicken strips and mushrooms, drizzled in a sweet chilli mayo.", ingredients: ["Tomato base", "Mozzarella", "Roast chicken strips", "Brown mushrooms", "Sweet chilli mayo drizzle"], tags: ["hot", "classic"], modifiers: ["Add extra chilli for a hotter bite"] },
                { name: "Chicken & Mayo", price: "R142.90", desc: "Roast chicken strips and tangy mayonnaise.", ingredients: ["Tomato base", "Mozzarella", "Roast chicken strips", "Tangy mayonnaise"], tags: ["classic"] },
                { name: "Pepperoni", price: "R139.90", desc: "Our famous Margherita covered in thinly sliced pepperoni.", ingredients: ["Tomato base", "Mozzarella", "Italian spices", "Thinly sliced pepperoni"], tags: ["hot", "classic"], modifiers: ["Add extra chilli for a hotter bite"] },
                { name: "Bacon & Ham", price: "R143.90", desc: "Bacon and ham.", ingredients: ["Tomato base", "Mozzarella", "Bacon strips", "Ham slices"], tags: ["classic"] },
                { name: "Alfredo", price: "R148.90", desc: "Creamy white sauce-based Margherita, garlic, Parmesan cheese, mushrooms, ham and bacon.", ingredients: ["Creamy white sauce base", "Mozzarella", "Garlic", "Parmesan cheese", "Brown mushrooms", "Ham", "Bacon"], tags: ["classic"] },
                { name: "Sweet & Spicy Chicken", price: "R145.90", desc: "Roast chicken strips with red onions, drizzled in our secret sweet and spicy tikka sauce.", ingredients: ["Tomato base", "Mozzarella", "Roast chicken strips", "Red onions", "Sweet & spicy tikka sauce"], tags: ["hot", "classic"] },
                { name: "Sweet Chilli Chicken & Feta", price: "R149.90", desc: "Roast chicken strips, Danish feta and sweet chilli sauce.", ingredients: ["Tomato base", "Mozzarella", "Roast chicken strips", "Danish feta", "Sweet chilli sauce"], tags: ["classic"] },
                { name: "BBQ Chicken / Rib & Pineapple", price: "R142.90", desc: "Your choice of roast chicken strips or deboned pork ribs, pineapple and sticky BBQ sauce.", ingredients: ["Tomato base", "Mozzarella", "Roast chicken strips OR deboned pork ribs", "Pineapple chunks", "Sticky BBQ sauce"], tags: ["classic"] },
                { name: "Regina", price: "R127.90", desc: "Ham and mushrooms.", ingredients: ["Tomato base", "Mozzarella", "Ham", "Brown mushrooms"], tags: ["classic"] },
                { name: "Vegetarian", price: "R143.90", desc: "Cherry tomatoes, red onions, assorted peppers, mushrooms and pineapple.", ingredients: ["Tomato base", "Mozzarella", "Cherry tomatoes", "Red onions", "Assorted peppers", "Brown mushrooms", "Pineapple"], tags: ["veg", "classic"] },
                { name: "Hawaiian", price: "R127.90", desc: "Ham and pineapple.", ingredients: ["Tomato base", "Mozzarella", "Ham", "Pineapple chunks"], tags: ["classic"] }
            ],
            "Gourmet Pizzas": [
                { name: "Saucy Chicken & Bacon Supreme", price: "R178.90", desc: "Roast chicken strips, bacon and ham, drizzled in our sweet chilli mayo.", ingredients: ["Tomato base", "Mozzarella", "Roast chicken strips", "Bacon", "Ham", "Sweet chilli mayo drizzle"], tags: ["gourmet"] },
                { name: "Californian", price: "R177.90", desc: "Double bacon, Danish feta and avocado.", ingredients: ["Tomato base", "Mozzarella", "Double bacon", "Danish feta", "Fresh avocado"], tags: ["gourmet"] },
                { name: "Carnivore", price: "R178.90", desc: "Salami, chorizo sausage, ham and bacon.", ingredients: ["Tomato base", "Mozzarella", "Salami", "Chorizo sausage", "Ham", "Bacon"], tags: ["gourmet"] },
                { name: "Rib & Steak/Chicken", price: "R177.90", desc: "Deboned pork ribs and steak or roast chicken strips, marinated in sticky BBQ sauce.", ingredients: ["Tomato base", "Mozzarella", "Deboned pork ribs", "Steak OR roast chicken strips", "Sticky BBQ sauce marinade"], tags: ["gourmet"] },
                { name: "Saucy Meat Supreme", price: "R172.90", desc: "Bacon, ham, chorizo sausage and bolognese mince, drizzled in sticky BBQ sauce.", ingredients: ["Tomato base", "Mozzarella", "Bacon", "Ham", "Chorizo sausage", "Bolognese mince", "Sticky BBQ sauce"], tags: ["gourmet"] },
                { name: "Panarottis Special", price: "R195.90", desc: "Our champion pizza! Salami, ham, mushrooms, pineapple and olives.", ingredients: ["Tomato base", "Mozzarella", "Salami", "Ham", "Brown mushrooms", "Pineapple", "Olives"], tags: ["gourmet"] },
                { name: "Seafood", price: "R195.90", desc: "Prawn tails, calamari strips, crab sticks and mussels drizzled in a sweet chilli mayo.", ingredients: ["Tomato base", "Mozzarella", "Prawn tails", "Calamari strips", "Crab sticks", "Mussels", "Sweet chilli mayo drizzle"], tags: ["gourmet"], modifiers: ["Add anchovies R19.90"] },
                { name: "Mexicana", price: "R175.90", desc: "Bolognese mince, cherry tomatoes, assorted peppers, red onions and garlic.", ingredients: ["Tomato base", "Mozzarella", "Bolognese mince", "Cherry tomatoes", "Assorted peppers", "Red onions", "Garlic"], tags: ["hot", "gourmet"], modifiers: ["Add extra chilli for a hotter bite"] },
                { name: "Al Capone", price: "R169.90", desc: "Tikka chicken, red onions, cherry tomatoes and gherkins.", ingredients: ["Tomato base", "Mozzarella", "Tikka chicken", "Red onions", "Cherry tomatoes", "Gherkins"], tags: ["hot", "gourmet"] },
                { name: "Mediterranean", price: "R159.90", desc: "Olives, Danish feta, sun-dried tomatoes, basil pesto and fresh rocket.", ingredients: ["Tomato base", "Mozzarella", "Olives", "Danish feta", "Sun-dried tomatoes", "Basil pesto", "Fresh rocket"], tags: ["veg", "gourmet"], modifiers: ["Add salami R33.90"] },
                { name: "Nachos Pizza", price: "R194.90", desc: "Bolognese mince or roast chicken strips in our secret sweet and spicy tikka sauce or tomato concassé, garlic, spicy salsa, cream cheese, avocado and nacho chips - spicy with a bite.", ingredients: ["Tomato base OR tikka sauce", "Mozzarella", "Bolognese mince OR roast chicken strips", "Tomato concassé", "Garlic", "Spicy salsa", "Cream cheese", "Avocado", "Nacho chips"], tags: ["hot", "gourmet"], modifiers: ["Add extra chilli for a hotter bite"] }
            ],
            "Special Pizzas": [
                { name: "Duo Pizzas", price: "R188.90", desc: "Combine your 2 favourite 30cm pizzas into 1 delicious duo! Excludes mini/Meaty Pizzas.", ingredients: ["Two 30cm pizza halves combined", "Choice of any 2 classic/gourmet pizzas", "Excludes mini/Meaty Pizzas"], tags: ["special", "dp"] },
                { name: "Calzone", price: "R172.90", desc: "Folded pizza pocket filled with mozzarella, salami, chorizo, mushrooms and pineapple, oven-baked until golden brown.", ingredients: ["Folded pizza dough", "Mozzarella", "Salami", "Chorizo", "Mushrooms", "Pineapple", "Golden brown baked crust"], tags: ["new", "special"] },
                { name: "Double Up", price: "R30.90", desc: "Add extra cheese or avocado to any pizza.", ingredients: ["Extra mozzarella cheese", "OR fresh avocado slices"], tags: ["modifier"] }
            ]
        }
    },
    pasta: {
        title: "🍝 Pastas",
        note: "Choice of spaghetti, penne or fettuccine",
        subcategories: {
            "Classic Pastas": [
                { name: "Alfredo", price: "R139.90", desc: "Crispy bacon, ham and brown mushrooms in a rich, cream-based sauce.", ingredients: ["Choice of pasta (spaghetti/penne/fettuccine)", "Crispy bacon", "Ham", "Brown mushrooms", "Rich cream-based sauce", "Parmesan"], tags: ["classic"] },
                { name: "Bolognese", price: "R129.90", desc: "Slow-cooked beef bolognese mince in a tomato-based sauce, sprinkled with Parmesan.", ingredients: ["Choice of pasta", "Slow-cooked beef bolognese mince", "Tomato-based sauce", "Parmesan cheese sprinkle"], tags: ["hot", "classic"] },
                { name: "Bacon Carbonara", price: "R124.90", desc: "Crispy bacon tossed in creamy hollandaise sauce, served with spaghetti and sprinkled with Parmesan.", ingredients: ["Spaghetti", "Crispy bacon", "Creamy hollandaise sauce", "Parmesan cheese"], tags: ["new", "classic"] },
                { name: "Capricciosa", price: "R134.90", desc: "Oven-roasted chicken, assorted peppers and brown mushrooms in a cream-based sauce.", ingredients: ["Choice of pasta", "Oven-roasted chicken", "Assorted peppers", "Brown mushrooms", "Cream-based sauce"], tags: ["hot", "classic"] },
                { name: "Chicken Mediterranean", price: "R142.90", desc: "Pasta tossed in olive oil and garlic, combined with roast chicken, brown mushrooms and basil pesto. Topped with sun-dried tomatoes, Danish feta and rocket.", ingredients: ["Choice of pasta", "Olive oil", "Garlic", "Roast chicken", "Brown mushrooms", "Basil pesto", "Sun-dried tomatoes", "Danish feta", "Fresh rocket"], tags: ["hot", "classic"], modifiers: ["Add creamy Parmesan white sauce R19.90"] }
            ],
            "Speciality Pastas": [
                { name: "Saltimbocca", price: "R214.90", desc: "Fillet medallions served on a bed of pasta layered with mozzarella and finished with crispy bacon, ham and brown mushrooms in a rich, cream-based sauce.", ingredients: ["Choice of pasta base", "Fillet medallions", "Mozzarella layer", "Crispy bacon", "Ham", "Brown mushrooms", "Rich cream-based sauce"], tags: ["dp", "speciality"] },
                { name: "Chicken Milano", price: "R177.90", desc: "Chicken breast medallions served on a bed of pasta layered with cheddar and finished with sautéed brown mushrooms, red onions, and assorted peppers in a rich, cream-based sauce.", ingredients: ["Choice of pasta base", "Chicken breast medallions", "Cheddar cheese layer", "Sautéed brown mushrooms", "Red onions", "Assorted peppers", "Rich cream-based sauce"], tags: ["speciality"] }
            ],
            "Gourmet Pastas": [
                { name: "Home-Made Beef Lasagne", price: "R149.90", desc: "A home-made traditional Italian dish of layered bolognese mince, pasta and tomato sauce, topped with mozzarella and cheddar, baked to perfection.", ingredients: ["Layered bolognese mince", "Pasta sheets", "Tomato sauce", "Mozzarella", "Cheddar cheese", "Oven-baked"], tags: ["gourmet"] },
                { name: "Prawn & Chorizo", price: "R169.90", desc: "Prawn tails and chorizo sausage perfectly combined with sautéed red onions in a creamy tomato-based sauce.", ingredients: ["Choice of pasta", "Prawn tails", "Chorizo sausage", "Sautéed red onions", "Creamy tomato-based sauce"], tags: ["gourmet"] },
                { name: "Chicken Parmesan Pomodoro", price: "R163.90", desc: "A tomato-based pasta with chorizo sausage, red onions, garlic and a hint of chilli, topped with a Cajun-crusted chicken breast, oven-baked and smothered in a creamy Parmesan white sauce.", ingredients: ["Choice of pasta", "Tomato-based sauce", "Chorizo sausage", "Red onions", "Garlic", "Hint of chilli", "Cajun-crusted chicken breast", "Creamy Parmesan white sauce", "Oven-baked"], tags: ["gourmet"] },
                { name: "Seafood", price: "R169.90", desc: "Prawn tails, mussels and calamari strips perfectly combined with sautéed red onions in a creamy tomato-based sauce.", ingredients: ["Choice of pasta", "Prawn tails", "Mussels", "Calamari strips", "Sautéed red onions", "Creamy tomato-based sauce"], tags: ["gourmet"], modifiers: ["Add anchovies R19.90"] },
                { name: "Cajun Chicken & Prawn", price: "R169.90", desc: "Cajun roast chicken strips, garlic prawns and assorted peppers in a rich cream-based sauce.", ingredients: ["Choice of pasta", "Cajun roast chicken strips", "Garlic prawns", "Assorted peppers", "Rich cream-based sauce"], tags: ["gourmet"] },
                { name: "Carne", price: "R157.90", desc: "Crispy bacon, salami, chorizo sausage, red onions and assorted peppers, sautéed and combined in a creamy tomato-based sauce.", ingredients: ["Choice of pasta", "Crispy bacon", "Salami", "Chorizo sausage", "Red onions", "Assorted peppers", "Creamy tomato-based sauce"], tags: ["gourmet"] }
            ]
        }
    },
    breakfast: {
    title: "🍳 Breakfasts (Served until 11AM)",
    subcategories: {
        "Classic Breakfasts": [
            { 
                name: "Palermo", 
                price: "R118.90", 
                image: "./images/palermo.jpg",
                desc: "2 Eggs, 3 rashers of bacon, 2 pork cheese grillers, mushrooms, grilled tomato and chips. Served with 2 slices of toast.", 
                ingredients: ["2 Fried eggs", "3 Rashers of bacon", "2 Pork cheese grillers", "Sautéed mushrooms", "Grilled tomato", "Chips", "2 Slices of toast"], 
                tags: ["dp"],
                questionsToAsk: [
                    "How would you like your eggs prepared?",
                    "Would you like white or brown toast?"
                ]
            },
            { 
                name: "Classico", 
                price: "R49.90", 
                image: "./images/classico.jpg",
                desc: "1 Egg, 2 rashers of bacon, grilled tomato and chips. Served with 1 slice of toast.", 
                ingredients: ["1 Fried egg", "2 Rashers of bacon", "Grilled tomato", "Chips", "1 Slice of toast"], 
                tags: ["hot"],
                questionsToAsk: [
                    "How would you like your eggs prepared?",
                    "Would you like white or brown toast?"
                ]
            },
            { 
                name: "Breakfast Bowl", 
                price: "R84.90", 
                image: "./images/breakfast-bowl.jpg",
                desc: "Scrambled eggs, chorizo sausage, a hashbrown, mushrooms and grilled cherry tomatoes tossed in basil pesto.", 
                ingredients: ["Scrambled eggs", "Chorizo sausage", "Hashbrown", "Mushrooms", "Grilled cherry tomatoes", "Basil pesto"], 
                tags: ["veg"] 
            },
            { 
                name: "French Toast", 
                price: "R69.90", 
                image: "./images/french-toast.jpg",
                desc: "2 Slices of French toast, strawberries and fresh cream. Served with maple syrup and 3 rashers of bacon.", 
                ingredients: ["2 Slices French toast", "Fresh strawberries", "Fresh cream", "Maple syrup", "3 Rashers of bacon"], 
                tags: [],
                questionsToAsk: [
                    "Would you like white or brown toast?"
                ]
            },
            { 
                name: "Carb-Conscious Breakfast", 
                price: "R66.90", 
                image: "./images/carb-conscious.jpg",
                desc: "3 Eggs, 3 rashers of bacon, mushrooms and grilled tomato.", 
                ingredients: ["3 Eggs", "3 Rashers of bacon", "Mushrooms", "Grilled tomato"], 
                tags: [], 
                modifiers: ["Add wors R33.90"],
                questionsToAsk: [
                    "How would you like your eggs prepared?"
                ]
            },
            { 
                name: "Grilled Supremo", 
                price: "R69.90", 
                image: "./images/grilled-supremo.jpg",
                desc: "2 Eggs, 2 rashers of bacon, 2 pork cheese grillers, grilled tomato and 2 slices of toast.", 
                ingredients: ["2 Fried eggs", "2 Rashers of bacon", "2 Pork cheese grillers", "Grilled tomato", "2 Slices of toast"], 
                tags: [], 
                modifiers: ["Add chips R23.90"],
                questionsToAsk: [
                    "How would you like your eggs prepared?",
                    "Would you like white or brown toast?"
                ]
            }
        ],
        "Breakfast Pizzas": [
            {
                name: "Mexican",
                price: "",
                image: "./images/mexican-pizza.jpg",
                desc: "Tomato base topped with mozzarella, bolognese mince mixed with spicy salsa and scrambled eggs.",
                ingredients: ["Tomato base", "Mozzarella cheese", "Bolognese mince", "Spicy salsa", "Scrambled eggs"],
                tags: ["veg"]
            },
            {
                name: "Rasher & Bacon",
                price: "",
                image: "./images/rasher-bacon-pizza.jpg",
                desc: "Tomato base topped with mozzarella, slices of Cajun pork rashers, bacon strips and scrambled eggs.",
                ingredients: ["Tomato base", "Mozzarella cheese", "Cajun pork rashers", "Bacon strips", "Scrambled eggs"],
                tags: []
            },
            {
                name: "Wors & Relish",
                price: "",
                image: "./images/wors-relish-pizza.jpg",
                desc: "Tomato base topped with mozzarella, sliced wors mixed with relish, and scrambled eggs.",
                ingredients: ["Tomato base", "Mozzarella cheese", "Sliced wors", "Relish", "Scrambled eggs"],
                tags: []
            },
            {
                name: "Traditional",
                price: "",
                image: "./images/traditional-pizza.jpg",
                desc: "Tomato base topped with mozzarella, bacon strips, or roast chicken strips, mushrooms, cherry tomatoes and scrambled eggs.",
                ingredients: ["Tomato base", "Mozzarella cheese", "Bacon strips OR roast chicken strips", "Mushrooms", "Cherry tomatoes", "Scrambled eggs"],
                tags: [],
                questionsToAsk: [
                    "Would you prefer bacon of chicken strips?"
                ]
            }
        ],
        "Breakfast Bagels": [
            {
                name: "Mince, Egg & Cheddar",
                price: "",
                image: "./images/mince-egg-cheddar-bagel.jpg",
                desc: "Bolognese mince, scrambled egg and Cheddar on a freshly toasted bagel with cream cheese and relish",
                ingredients: ["Bolognese mince", "Scrambled egg", "Cheddar cheese", "Toasted bagel", "Cream cheese", "Relish"],
                tags: []
            },
            {
                name: "Bacon Benedict",
                price: "",
                image: "./images/bacon-benedict-bagel.jpg",
                desc: "2 Rashers of bacon and fried egg, topped with hollandaise sauce and rocket on a freshly toasted bagel with cream cheese.",
                ingredients: ["2 Rashers of bacon", "Fried egg", "Hollandaise sauce", "Rocket", "Toasted bagel", "Cream cheese"],
                tags: [],
                questionsToAsk: [
                    "How would you like your egg prepared?"
                ]
            },
            {
                name: "Cream Cheese, Avo & Tomato Salsa",
                price: "",
                image: "./images/cream-cheese-avo-bagel.jpg",
                desc: "Cream cheese and mashed avo with spicy salsa on a freshly toasted bagel.",
                ingredients: ["Cream cheese", "Mashed avocado", "Spicy salsa", "Toasted bagel"],
                tags: ["veg"]
            }
        ],
        "Tasty Top-Ups": [
            { name: "Wors", price: "R33.90", image: "./images/wors.jpg", ingredients: ["Boerewors sausage (125g)"], tags: ["new", "top-up"] },
            { name: "Chicken Livers (75g)", price: "R29.90", image: "./images/chicken-livers.jpg", ingredients: ["Chicken livers", "Peri-peri sauce", "75g portion"], tags: ["top-up"] },
            { name: "2 Pork Cheese Grillers", price: "R26.90", image: "./images/pork-cheese-grillers.jpg", ingredients: ["Pork cheese grillers", "2 pieces"], tags: ["top-up"] },
            { name: "Avo", price: "R19.90", image: "./images/avo.jpg", ingredients: ["Fresh avocado", "Sliced"], tags: ["top-up"] },
            { name: "1 Hashbrown", price: "R16.90", image: "./images/hashbrown.jpg", ingredients: ["Hashbrown patty", "Golden fried"], tags: ["top-up"] },
            { name: "2 Slices of Toast", price: "R12.90", image: "./images/toast.jpg", ingredients: ["White or brown bread", "Buttered toast", "2 slices"], tags: ["top-up"] },
            { name: "1 Egg", price: "R9.90", image: "./images/egg.jpg", ingredients: ["1 Fried or scrambled egg"], tags: ["top-up"] },
            { name: "Cheese (50g)", price: "R19.90", image: "./images/cheese.jpg", ingredients: ["Grated cheddar cheese", "50g portion"], tags: ["top-up"] },
            { name: "Chips (150g)", price: "R23.90", image: "./images/chips.jpg", ingredients: ["French fries", "150g portion", "Golden crispy"], tags: ["top-up"] }
        ]
    }
},
    starters: {
        title: "🥗 Starters, Subs & Meals",
        subcategories: {
            "Starters": [
                { name: "Flatbread", price: "R74.90", desc: "Garlic or herb", ingredients: ["Pizza dough flatbread", "Garlic butter OR herb butter", "Toasted"], tags: [] },
                { name: "Mozzarella Flatbread", price: "R106.90", desc: "Garlic or herb flatbread topped with mozzarella.", ingredients: ["Pizza dough flatbread", "Garlic butter OR herb butter", "Mozzarella cheese", "Melted & golden"], tags: [] }
            ],
            "Subs": [
                { name: "Chicken & Mushroom Sub", price: "R99.90", desc: "Plant-based chicken strips and mushrooms mixed with vegan sweet chilli mayo and topped with vegan mozzarella.", ingredients: ["Sub roll", "Plant-based chicken strips", "Sautéed mushrooms", "Vegan sweet chilli mayo", "Vegan mozzarella"], tags: ["vegan"] }
            ],
            "Meals": [
                { name: "Crumbed Veg Stack", price: "R151.90", desc: "Golden brown plant-based chicken-style schnitzel, topped with spicy salsa, fresh avocado and vegan mozzarella sprinkle. Served with chips, stir-fry fettuccine or a garden salad.", ingredients: ["Plant-based chicken-style schnitzel", "Breadcrumb coating", "Spicy salsa", "Fresh avocado", "Vegan mozzarella sprinkle", "Side: Chips OR stir-fry fettuccine OR garden salad"], tags: ["hot", "vegan"] }
            ]
        }
    },
    vegan: {
        title: "🌱 Vegan Friendly",
        subcategories: {
            "Vegan Starters": [
                { name: "Flatbread", price: "R74.90", desc: "Garlic or herb", ingredients: ["Pizza dough flatbread", "Garlic butter OR herb butter (vegan)", "Toasted"], tags: ["vegan"] },
                { name: "Mozzarella Flatbread", price: "R106.90", desc: "Garlic or herb flatbread topped with vegan mozzarella.", ingredients: ["Pizza dough flatbread", "Garlic OR herb butter (vegan)", "Vegan mozzarella", "Melted & golden"], tags: ["vegan"] }
            ],
            "Vegan Classic Pizzas": [
                { name: "Margherita", price: "R104.90", desc: "A traditional tomato base topped with vegan mozzarella and Italian spices.", ingredients: ["Tomato base", "Vegan mozzarella", "Italian spices", "Oregano", "Basil"], tags: ["vegan", "classic"] },
                { name: "BBQ Chicken & Pineapple", price: "R160.90", desc: "Plant-based chicken strips, pineapple and sticky BBQ basting.", ingredients: ["Tomato base", "Vegan mozzarella", "Plant-based chicken strips", "Pineapple chunks", "Sticky BBQ basting"], tags: ["vegan", "classic"] },
                { name: "Chicken & Mayo", price: "R155.90", desc: "Margherita topped with plant-based chicken strips and vegan mayo.", ingredients: ["Tomato base", "Vegan mozzarella", "Plant-based chicken strips", "Vegan mayonnaise"], tags: ["vegan", "classic"] },
                { name: "Vegetarian", price: "R165.90", desc: "Margherita topped with cherry tomatoes, red onions, assorted peppers, mushrooms and pineapple.", ingredients: ["Tomato base", "Vegan mozzarella", "Cherry tomatoes", "Red onions", "Assorted peppers", "Brown mushrooms", "Pineapple"], tags: ["vegan", "classic"] },
                { name: "Saucy Chicken & Mushroom", price: "R163.90", desc: "Margherita topped with plant-based chicken strips and mushrooms, drizzled in vegan sweet chilli mayo.", ingredients: ["Tomato base", "Vegan mozzarella", "Plant-based chicken strips", "Brown mushrooms", "Vegan sweet chilli mayo drizzle"], tags: ["vegan", "classic"] }
            ],
            "Vegan Gourmet Pizzas": [
                { name: "Mexicana", price: "R192.90", desc: "Margherita topped with plant-based bolognese, cherry tomatoes, assorted peppers, red onions and garlic.", ingredients: ["Tomato base", "Vegan mozzarella", "Plant-based bolognese mince", "Cherry tomatoes", "Assorted peppers", "Red onions", "Garlic"], tags: ["vegan", "hot", "gourmet"], modifiers: ["Add extra chilli for a hotter bite"] },
                { name: "Al Capone", price: "R185.90", desc: "Margherita topped with plant-based tikka chicken strips, red onions, cherry tomatoes and gherkins.", ingredients: ["Tomato base", "Vegan mozzarella", "Plant-based tikka chicken strips", "Red onions", "Cherry tomatoes", "Gherkins"], tags: ["vegan", "hot", "gourmet"], modifiers: ["Add extra chilli for a hotter bite"] }
            ],
            "V Pizza Toppings": [
                { name: "Vegan Chicken Strips", price: "R27.90 each", ingredients: ["Plant-based chicken strips", "Seasoned", "Protein-rich"], tags: ["vegan", "topping"] },
                { name: "Vegan Mince", price: "R27.90 each", ingredients: ["Plant-based mince", "Seasoned", "Protein-rich"], tags: ["vegan", "topping"] }
            ],
            "Vegan Pastas": [
                { name: "Arrabbiata", price: "R112.90", desc: "Tomato-based sauce with red onions, garlic, and a hint of chilli.", ingredients: ["Choice of pasta", "Tomato-based sauce", "Red onions", "Garlic", "Hint of chilli"], tags: ["vegan", "hot"], modifiers: ["With or without olives"] },
                { name: "Bolognese", price: "R145.90", desc: "Plant-based bolognese in a tomato-based sauce, sprinkled with vegan mozzarella.", ingredients: ["Choice of pasta", "Plant-based bolognese mince", "Tomato-based sauce", "Vegan mozzarella sprinkle"], tags: ["vegan"] }
            ],
            "Vegan Subs": [
                { name: "Chicken & Mushroom", price: "R99.90", desc: "Plant-based chicken strips and mushrooms mixed with vegan sweet chilli mayo and topped with vegan mozzarella.", ingredients: ["Sub roll", "Plant-based chicken strips", "Sautéed mushrooms", "Vegan sweet chilli mayo", "Vegan mozzarella"], tags: ["vegan"] }
            ],
            "Vegan Meals": [
                { name: "Crumbed Veg Stack", price: "R151.90", desc: "Golden brown plant-based chicken-style schnitzel, topped with spicy salsa, fresh avocado and vegan mozzarella sprinkle. Served with chips, stir-fry fettuccine or a garden salad.", ingredients: ["Plant-based chicken-style schnitzel", "Breadcrumb coating", "Spicy salsa", "Fresh avocado", "Vegan mozzarella sprinkle", "Side: Chips OR stir-fry fettuccine OR garden salad"], tags: ["vegan", "hot"] }
            ]
        }
    }
};

  var MENU = {};
  Object.keys(MENU_DATA).forEach(function (categoryKey) {
    var category = MENU_DATA[categoryKey];
    var flattened = [];
    if (category && Array.isArray(category.items)) {
      flattened = category.items;
    } else if (category && category.subcategories) {
      Object.keys(category.subcategories).forEach(function (groupName) {
        (category.subcategories[groupName] || []).forEach(function (item) {
          flattened.push(Object.assign({}, item, { group: item.group || groupName }));
        });
      });
    }
    MENU[category.title ? category.title.replace(/^\S+\s*/, "") : categoryKey] = flattened;
  });

  var QUIZ_BANK = [
    { category: "Pastas", q: "What protein is standard on a Spaghetti Carbonara?", options: ["Grilled chicken", "Bacon", "Calamari", "Beef mince"], correct: 1, explain: "Carbonara at Panarottis is built on bacon in a creamy egg and parmesan sauce — not a tomato base." },
    { category: "Pizzas", q: "What are the standard toppings on a Hawaiian pizza?", options: ["Ham and pineapple", "Mushroom and onion", "Bacon and egg", "Olives and feta"], correct: 0, explain: "Hawaiian is tomato base, mozzarella, ham and pineapple — the classic sweet-and-savoury combo." },
    { category: "Starters", q: "What sauce is Crumbed Calamari served with?", options: ["Sweet chilli", "Tartare sauce", "Garlic aioli", "Marinara"], correct: 1, explain: "Calamari is paired with tartare sauce and a lemon wedge as standard." },
    { category: "Combos", q: "Can premium pastas be swapped into the Pizza & Pasta Combo?", options: ["Yes, any pasta", "Only on weekends", "No — combo pastas only", "Only with a manager override"], correct: 2, explain: "The combo is priced around the standard combo pasta list; premium pastas fall outside that pricing." },
    { category: "Pastas", q: "Chicken Alfredo's sauce base is best described as:", options: ["Tomato and basil", "Cream and parmesan", "Olive oil and garlic", "Beef ragu"], correct: 1, explain: "Alfredo is a rich cream and parmesan sauce, finished with parsley and grilled chicken." },
    { category: "Kids Menu", q: "What comes standard with a Kids Margherita Pizza?", options: ["A side salad", "A juice box", "An extra topping", "Garlic bread"], correct: 1, explain: "Kids Margherita includes a juice box as standard — no substitutions on kids sizing." },
    { category: "Pizzas", q: "Which topping is NOT part of the standard Veggie Supreme?", options: ["Mushroom", "Sweetcorn", "Pepperoni", "Peppers"], correct: 2, explain: "Veggie Supreme is mushroom, peppers, onion, olives and sweetcorn — no meat toppings." },
    { category: "Beverages", q: "What is the standard upcharge for a non-dairy milk swap on a Cappuccino?", options: ["No charge", "+R6", "+R15", "Not available"], correct: 1, explain: "Non-dairy milk is available as a standard modifier for +R6." },
    { category: "Desserts", q: "What accompanies the Chocolate Brownie by default?", options: ["Whipped cream only", "Vanilla ice cream and chocolate sauce", "Fresh berries", "Nothing — brownie only"], correct: 1, explain: "The brownie is served warm with vanilla ice cream and chocolate sauce, though ice cream can be omitted on request." },
    { category: "Combos", q: "How many people is the Family Feast built to serve?", options: ["2", "4", "6", "8"], correct: 1, explain: "Family Feast (two large pizzas, garlic bread, 1.5L drink) is portioned for around 4 people." }
  ];

  /* True/False bank — operational and allergen rules */
  var TF_BANK = [
    { category: "Allergens", statement: "The Crumbed Calamari starter should be flagged to guests with a seafood or egg allergy.", answer: true, explain: "Calamari is crumbed (egg/gluten) and is seafood — always flag it for those allergy types." },
    { category: "Standard Builds", statement: "Garlic Bread comes with cheese and bacon added as standard.", answer: false, explain: "Cheese and bacon are optional add-ons on Garlic Bread, not standard inclusions — always confirm before charging extra." },
    { category: "Kids Menu", statement: "Kids meals can be substituted freely with items from the adult menu at the same price.", answer: false, explain: "Kids sizing and pricing is fixed — no free substitutions from the adult menu." },
    { category: "Allergens", statement: "Carbonara contains egg as part of its standard sauce.", answer: true, explain: "Carbonara's sauce is egg-and-parmesan based, so it must be flagged for egg allergies." },
    { category: "Combos", statement: "A drink can be added to the Pizza & Pasta Combo for an extra charge.", answer: true, explain: "One drink can be added to the combo for +R20." },
    { category: "Standard Builds", statement: "Margherita pizza can be requested on a thin base.", answer: true, explain: "Thin base is available on request for the Margherita." },
    { category: "Allergens", statement: "All pastas at Panarottis are gluten-free by default.", answer: false, explain: "Standard pasta dishes contain gluten unless a specific gluten-free swap is requested and available." },
    { category: "Operations", statement: "Iced Tea flavour should always be confirmed with the guest at the time of order.", answer: true, explain: "Since peach and lemon variants exist, the flavour must be confirmed rather than assumed." },
    { category: "Standard Builds", statement: "The Family Feast pizza selection can include any pizza on the full menu.", answer: false, explain: "Family Feast pizza choices are limited to the listed combo flavours." },
    { category: "Allergens", statement: "Thickshakes are dairy-based and should be flagged for guests with a dairy allergy or intolerance.", answer: true, explain: "Thickshakes are ice-cream based, so they must be flagged as containing dairy." }
  ];

  /* Scenario bank — waitron etiquette, complaints, upselling, service standards */
  var SCENARIO_BANK = [
    {
      category: "Complaint Handling",
      q: "A guest says their pizza base arrived undercooked and doughy in the middle. What's the best first response?",
      options: [
        "Apologise, remove it from the table and offer a freshly made replacement immediately.",
        "Explain that the base is meant to be soft in the centre.",
        "Offer a 10% discount on the bill without addressing the food.",
        "Suggest they scrape off the topping and eat around the base."
      ],
      correct: 0,
      explain: "Acknowledge the issue, remove the item, and fix it fast with a proper remake — that's the professional standard for a genuine kitchen error."
    },
    {
      category: "Upselling",
      q: "A table orders two large pizzas with no sides or drinks. What's the most natural upsell moment?",
      options: [
        "Say nothing — let them order more if they want to.",
        "Suggest garlic bread to start and ask if they'd like drinks while the pizzas are prepared.",
        "Tell them the meal seems incomplete without dessert.",
        "Push the most expensive item on the menu regardless of fit."
      ],
      correct: 1,
      explain: "A relevant, well-timed suggestion (starter + drinks while they wait) adds value for the guest and revenue for the table — that's genuine upselling, not pressure."
    },
    {
      category: "Table Service",
      q: "You're carrying food to a table and a different guest flags you down about an unrelated issue. What do you do?",
      options: [
        "Ignore them until the food is delivered and cleared from your hands.",
        "Stop immediately, put the hot food down on the nearest surface, and deal with the other issue.",
        "Briefly acknowledge them, say you'll be right back once the food is delivered, then follow through.",
        "Ask a random guest at that table to deliver the food for you."
      ],
      correct: 2,
      explain: "A brief acknowledgement plus a genuine follow-up keeps both guests respected without compromising food safety or timing."
    },
    {
      category: "Complaint Handling",
      q: "A guest claims they were charged for a topping they didn't order. What should you do?",
      options: [
        "Insist the till is always correct and refuse to check.",
        "Check the order against the till slip, and correct the bill if there's an error.",
        "Tell them to take it up with management only.",
        "Give a full refund on the whole meal to avoid conflict."
      ],
      correct: 1,
      explain: "Verify against the actual order first — most billing complaints are resolved quickly and fairly by checking the record, not by guessing or over-correcting."
    },
    {
      category: "Allergen Handling",
      q: "A guest mentions a severe nut allergy while ordering. What's the correct next step?",
      options: [
        "Note it mentally and proceed as normal.",
        "Inform the kitchen directly, flag the order clearly, and confirm which dishes are safe before final order.",
        "Tell the guest to check the menu themselves for nut content.",
        "Suggest they order at their own risk."
      ],
      correct: 1,
      explain: "Severe allergies require an explicit, verified handoff to the kitchen — this is a food-safety issue, not just a preference note."
    },
    {
      category: "Table Service",
      q: "A guest asks for a course to be delayed because they're waiting on someone. What's best practice?",
      options: [
        "Fire the order anyway to keep kitchen timing simple.",
        "Confirm the delay with the kitchen and hold the fire until the guest gives the go-ahead.",
        "Tell the guest the kitchen can't accommodate delays.",
        "Cancel the order entirely."
      ],
      correct: 1,
      explain: "Communicating timing changes to the kitchen keeps food quality high and shows the guest their request was actually heard."
    },
    {
      category: "Upselling",
      q: "A guest asks 'What's good here?' while looking at the dessert menu. What's the strongest response?",
      options: [
        "\"Everything is good.\"",
        "Recommend one or two specific desserts with a short, honest reason why (e.g. a guest favourite or a fresh-made option).",
        "Hand them the menu and walk away.",
        "Only recommend the most expensive dessert."
      ],
      correct: 1,
      explain: "A specific, honest recommendation builds trust and makes ordering easier — vague answers or pure price-steering both undercut the guest's confidence in you."
    },
    {
      category: "Complaint Handling",
      q: "A guest is visibly frustrated about a long wait and raises their voice. What's the right tone to take?",
      options: [
        "Match their tone to show you understand their frustration.",
        "Stay calm, acknowledge the wait honestly, and give a realistic update or next step.",
        "Avoid the table until they calm down on their own.",
        "Blame the kitchen directly to the guest."
      ],
      correct: 1,
      explain: "Staying calm and giving an honest, concrete update de-escalates the situation far better than matching energy or avoiding the guest."
    }
  ];

  /* -------------------------------------------------------------------
     2. APPLICATION STATE
     ------------------------------------------------------------------- */
  var TABS = [
    { id: "menu", label: "Menu", icon: "📋" },
    { id: "quiz", label: "Quiz", icon: "🧠" },
    { id: "tf", label: "True/False", icon: "✅" },
    { id: "scenario", label: "Scenarios", icon: "🗣️" },
    { id: "progress", label: "Progress", icon: "📊" }
  ];

  var state = {
    activeTab: "menu",
    activeMenuCategory: "__all__",
    progress: loadProgress(),

    flashIndex: 0,
    flashKnownIds: {}, // id -> true if user marked "knew it" this session

    quiz: { order: [], index: 0, score: 0, answered: false },
    tf: { order: [], index: 0, score: 0, answered: false },
    scn: { order: [], index: 0, score: 0, answered: false }
  };

  /* -------------------------------------------------------------------
     3. SMALL DOM HELPERS (all null-safe — see task note on safe DOM use)
     ------------------------------------------------------------------- */
  function $(id) { return document.getElementById(id); }
  function el(tag, className, text) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
  }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }
  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

  /* -------------------------------------------------------------------
     4. NAV / TAB RENDERING
     ------------------------------------------------------------------- */
  function renderTabs() {
    var desktopWrap = $("tabsDesktop");
    var mobileWrap = $("tabsMobile");
    if (!desktopWrap || !mobileWrap) return;
    desktopWrap.innerHTML = "";
    mobileWrap.innerHTML = "";

    TABS.forEach(function (tab) {
      [desktopWrap, mobileWrap].forEach(function (wrap) {
        var btn = el("button", "tab-btn");
        btn.type = "button";
        btn.id = (wrap === desktopWrap ? "tab-" : "tabm-") + tab.id;
        btn.setAttribute("role", "tab");
        btn.setAttribute("aria-selected", tab.id === state.activeTab ? "true" : "false");
        btn.setAttribute("aria-controls", "view-" + tab.id);

        var ico = el("span", "ico", tab.icon);
        ico.setAttribute("aria-hidden", "true");
        var label = el("span", null, tab.label);
        btn.appendChild(ico);
        btn.appendChild(label);

        btn.addEventListener("click", function () { setActiveTab(tab.id); });
        wrap.appendChild(btn);
      });
    });
  }

  function setActiveTab(tabId) {
    state.activeTab = tabId;
    TABS.forEach(function (tab) {
      var view = $("view-" + tab.id);
      if (view) view.classList.toggle("active", tab.id === tabId);
      ["tab-", "tabm-"].forEach(function (prefix) {
        var btn = $(prefix + tab.id);
        if (btn) btn.setAttribute("aria-selected", tab.id === tabId ? "true" : "false");
      });
    });
    if (tabId === "progress") renderProgressDashboard();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  /* -------------------------------------------------------------------
     5. MENU MODULE
     ------------------------------------------------------------------- */
  function renderMenuCatNav() {
    var nav = $("menuCatNav");
    if (!nav) return;
    nav.innerHTML = "";

    var all = el("button", "chip-btn", "All");
    all.type = "button";
    if (state.activeMenuCategory === "__all__") all.classList.add("active");
    all.addEventListener("click", function () {
      state.activeMenuCategory = "__all__";
      renderMenuCatNav();
      renderMenuGrid();
    });
    nav.appendChild(all);

    Object.keys(MENU).forEach(function (cat) {
      var btn = el("button", "chip-btn", cat);
      btn.type = "button";
      if (cat === state.activeMenuCategory) btn.classList.add("active");
      btn.addEventListener("click", function () {
        state.activeMenuCategory = cat;
        renderMenuCatNav();
        renderMenuGrid();
      });
      nav.appendChild(btn);
    });
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function allMenuItems() {
    var rows = [];
    Object.keys(MENU).forEach(function (cat) {
      (MENU[cat] || []).forEach(function (item) {
        rows.push({ category: cat, item: item });
      });
    });
    return rows;
  }

  function renderMenuGrid() {
    var grid = $("menuGrid");
    if (!grid) return;
    grid.innerHTML = "";

    var searchEl = $("menuSearch");
    var query = (searchEl ? searchEl.value : "").trim().toLowerCase();

    var source = state.activeMenuCategory === "__all__"
      ? allMenuItems()
      : (MENU[state.activeMenuCategory] || []).map(function (item) {
          return { category: state.activeMenuCategory, item: item };
        });

    var items = source.filter(function (row) {
      if (!query) return true;
      var item = row.item;
      var haystack = [
        row.category, item.group, item.name, item.desc,
        (item.ingredients || []).join(" "),
        (item.tags || []).join(" "),
        (item.mods || item.modifiers || []).join(" ")
      ].join(" ").toLowerCase();
      return haystack.includes(query);
    });

    if (!items.length) {
      grid.innerHTML = '<div class="empty-menu"><strong>No menu items found</strong>Try another dish, ingredient or category.</div>';
      return;
    }

    items.forEach(function (row) {
      var item = row.item;
      var card = el("article", "item-card");

      var copy = el("div", "item-copy");
      if (item.group) copy.insertAdjacentHTML("beforeend", '<span class="group-pill">' + escapeHtml(item.group) + '</span>');
      var h3 = el("h3");
      h3.appendChild(el("span", null, item.name || ""));
      if (item.price) h3.appendChild(el("span", "price", item.price));
      copy.appendChild(h3);
      card.appendChild(copy);

      var body = el("div", "item-card-body");
      body.appendChild(el("p", "desc", item.desc || ""));

      var metaRow = el("div", "meta-row");
      (item.tags || []).forEach(function (tag) {
        metaRow.appendChild(el("span", "tag allergen", String(tag)));
      });
      (item.mods || item.modifiers || []).forEach(function (mod) {
        metaRow.appendChild(el("span", "tag mod", mod));
      });
      if (metaRow.children.length) body.appendChild(metaRow);

      var ingredients = item.ingredients || [];
      if (ingredients.length) {
        var toggle = el("button", "ingredient-toggle", "＋ Show ingredients & build");
        toggle.type = "button";
        var panel = el("div", "ingredient-panel");
        panel.innerHTML =
          '<div class="ingredient-title">Ingredients & build</div>' +
          '<div class="ingredient-list">' +
          ingredients.map(function (ing) {
            return '<span class="ingredient-chip">' + escapeHtml(ing) + '</span>';
          }).join("") +
          '</div>';
        toggle.addEventListener("click", function () {
          var open = panel.classList.toggle("open");
          toggle.textContent = open ? "− Hide ingredients & build" : "＋ Show ingredients & build";
        });
        body.appendChild(toggle);
        body.appendChild(panel);
      }

      card.appendChild(body);
      grid.appendChild(card);
    });

    if (!state.progress.menuViewed) {
      state.progress.menuViewed = true;
      saveProgress();
    }
  }

  /* -------------------------------------------------------------------
     6. FLASHCARDS
     Built directly from the QUIZ_BANK so content stays consistent.
     ------------------------------------------------------------------- */
  var FLASH_DECK = QUIZ_BANK.map(function (q) {
    return {
      category: q.category,
      front: q.q,
      back: q.options[q.correct],
      detail: q.explain
    };
  });

  function renderFlashcard() {
    var card = $("flashCard");
    if (!card) return;
    card.classList.remove("flipped");
    var f = FLASH_DECK[state.flashIndex];
    if (!f) return;
    var kicker = $("flashFrontKicker");
    var front = $("flashFrontText");
    var back = $("flashBackText");
    var detail = $("flashBackDetail");
    if (kicker) kicker.textContent = f.category;
    if (front) front.textContent = f.front;
    if (back) back.textContent = f.back;
    if (detail) detail.textContent = f.detail || "";
  }

  function flashAdvance(delta) {
    state.flashIndex = (state.flashIndex + delta + FLASH_DECK.length) % FLASH_DECK.length;
    renderFlashcard();
  }

  function initFlashcards() {
    var card = $("flashCard");
    if (card) {
      card.addEventListener("click", function () { card.classList.toggle("flipped"); });
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          card.classList.toggle("flipped");
        }
      });
    }
    var prev = $("flashPrev"); if (prev) prev.addEventListener("click", function () { flashAdvance(-1); });
    var next = $("flashNext"); if (next) next.addEventListener("click", function () { flashAdvance(1); });

    var knew = $("flashKnew");
    var knewNot = $("flashKnewNot");
    if (knew) knew.addEventListener("click", function () {
      var f = FLASH_DECK[state.flashIndex];
      if (f) state.flashKnownIds[f.front] = true;
      flashAdvance(1);
    });
    if (knewNot) knewNot.addEventListener("click", function () {
      var f = FLASH_DECK[state.flashIndex];
      if (f) state.flashKnownIds[f.front] = false;
      flashAdvance(1);
    });

    var flashBtn = $("modeFlashBtn");
    var quizBtn = $("modeQuizBtn");
    if (flashBtn) flashBtn.addEventListener("click", function () { switchStudyMode("flash"); });
    if (quizBtn) quizBtn.addEventListener("click", function () { switchStudyMode("quiz"); });

    renderFlashcard();
  }

  function switchStudyMode(mode) {
    var flashPane = $("flashPane");
    var quizPane = $("quizPane");
    var flashBtn = $("modeFlashBtn");
    var quizBtn = $("modeQuizBtn");
    if (!flashPane || !quizPane) return;
    if (mode === "flash") {
      flashPane.style.display = "";
      quizPane.style.display = "none";
      if (flashBtn) flashBtn.classList.add("active");
      if (quizBtn) quizBtn.classList.remove("active");
    } else {
      flashPane.style.display = "none";
      quizPane.style.display = "";
      if (flashBtn) flashBtn.classList.remove("active");
      if (quizBtn) quizBtn.classList.add("active");
    }
  }

  /* -------------------------------------------------------------------
     7. GENERIC GRADED-SESSION ENGINE
     Shared logic used by Quiz, True/False and Scenarios so scoring,
     streaks and localStorage writes behave identically everywhere.
     ------------------------------------------------------------------- */
  function startSession(kind) {
    var s = state[kind];
    var bank = kind === "quiz" ? QUIZ_BANK : kind === "tf" ? TF_BANK : SCENARIO_BANK;
    s.order = shuffle(bank.map(function (_, i) { return i; }));
    s.index = 0;
    s.score = 0;
    s.answered = false;
    showSessionActive(kind);
    renderSessionQuestion(kind);
  }

  function showSessionActive(kind) {
    var prefix = kind === "quiz" ? "quiz" : kind === "tf" ? "tf" : "scn";
    var activeArea = $(prefix + "ActiveArea");
    var completeArea = $(prefix + "CompleteArea");
    if (activeArea) activeArea.style.display = "";
    if (completeArea) completeArea.style.display = "none";
  }

  function renderSessionQuestion(kind) {
    var s = state[kind];
    var bank = kind === "quiz" ? QUIZ_BANK : kind === "tf" ? TF_BANK : SCENARIO_BANK;
    var prefix = kind === "quiz" ? "quiz" : kind === "tf" ? "tf" : "scn";
    var qData = bank[s.order[s.index]];
    if (!qData) return;
    s.answered = false;

    var progLabel = $(prefix + "ProgressLabel");
    var total = s.order.length;
    if (progLabel) {
      var noun = kind === "quiz" ? "Question" : kind === "tf" ? "Question" : "Scenario";
      progLabel.textContent = noun + " " + (s.index + 1) + " of " + total;
    }
    var fill = $(prefix + "ProgressFill");
    if (fill) fill.style.width = Math.round((s.index / total) * 100) + "%";

    var streakLabel = $(prefix + "StreakLabel");
    var currentStreak = state.progress[kind === "quiz" ? "quiz" : kind === "tf" ? "tf" : "scenario"].streak;
    if (streakLabel) streakLabel.textContent = "🔥 Streak: " + currentStreak;

    var catLabel = $(prefix + "CategoryLabel");
    if (catLabel) catLabel.textContent = qData.category;

    var qText = $(prefix + "QuestionText") || $(prefix + "QuestionText");
    if (kind === "tf") {
      var tfText = $("tfQuestionText");
      if (tfText) tfText.textContent = qData.statement;
    } else {
      var textEl = $(prefix + "QuestionText");
      if (textEl) textEl.textContent = qData.q;
    }

    var feedback = $(prefix + "Feedback");
    if (feedback) { feedback.className = "feedback-box"; feedback.textContent = ""; }
    var nextBtn = $(prefix + "NextBtn");
    if (nextBtn) nextBtn.disabled = true;

    var scoreLabel = $(prefix + "ScoreLabel");
    var totalLabel = $(prefix + "TotalLabel");
    if (scoreLabel) scoreLabel.textContent = s.score;
    if (totalLabel) totalLabel.textContent = s.index; // answered-so-far denominator

    if (kind === "tf") {
      renderTfOptions(qData);
    } else {
      renderMcOptions(kind, qData, prefix);
    }
  }

  function renderMcOptions(kind, qData, prefix) {
    var wrap = $(prefix + "Options");
    if (!wrap) return;
    wrap.innerHTML = "";
    var letters = ["A", "B", "C", "D", "E"];
    qData.options.forEach(function (optText, idx) {
      var btn = el("button", "opt-btn");
      btn.type = "button";
      var letter = el("span", "letter", letters[idx] || String(idx + 1));
      var textSpan = el("span", null, optText);
      btn.appendChild(letter);
      btn.appendChild(textSpan);
      btn.addEventListener("click", function () {
        answerMc(kind, qData, idx, wrap, prefix);
      });
      wrap.appendChild(btn);
    });
  }

  function answerMc(kind, qData, chosenIdx, wrap, prefix) {
    var s = state[kind];
    if (s.answered) return;
    s.answered = true;
    var correctIdx = qData.correct;
    var buttons = wrap.querySelectorAll(".opt-btn");
    buttons.forEach(function (b, i) {
      b.disabled = true;
      if (i === correctIdx) b.classList.add("correct");
      else if (i === chosenIdx) b.classList.add("incorrect");
    });
    var isCorrect = chosenIdx === correctIdx;
    finishAnswer(kind, isCorrect, qData.explain, prefix);
  }

  function renderTfOptions(qData) {
    var trueBtn = $("tfTrueBtn");
    var falseBtn = $("tfFalseBtn");
    if (!trueBtn || !falseBtn) return;
    trueBtn.disabled = false;
    falseBtn.disabled = false;
    trueBtn.className = "opt-btn";
    falseBtn.className = "opt-btn";
    trueBtn.querySelector(".letter") && (trueBtn.querySelector(".letter").textContent = "T");

    trueBtn.onclick = function () { answerTf(qData, true); };
    falseBtn.onclick = function () { answerTf(qData, false); };
  }

  function answerTf(qData, chosen) {
    var s = state.tf;
    if (s.answered) return;
    s.answered = true;
    var trueBtn = $("tfTrueBtn");
    var falseBtn = $("tfFalseBtn");
    var correct = qData.answer;
    [trueBtn, falseBtn].forEach(function (b) { if (b) b.disabled = true; });
    if (trueBtn) trueBtn.classList.add(correct === true ? "correct" : (chosen === true ? "incorrect" : ""));
    if (falseBtn) falseBtn.classList.add(correct === false ? "correct" : (chosen === false ? "incorrect" : ""));
    var isCorrect = chosen === correct;
    finishAnswer("tf", isCorrect, qData.explain, "tf");
  }

  function finishAnswer(kind, isCorrect, explanation, prefix) {
    var s = state[kind];
    var progKey = kind === "quiz" ? "quiz" : kind === "tf" ? "tf" : "scenario";
    var prog = state.progress[progKey];

    if (isCorrect) {
      s.score++;
      prog.streak++;
      prog.bestStreak = Math.max(prog.bestStreak, prog.streak);
    } else {
      prog.streak = 0;
    }
    prog.answered++;
    if (isCorrect) prog.correct++;
    saveProgress();

    var feedback = $(prefix + "Feedback");
    if (feedback) {
      feedback.className = "feedback-box show " + (isCorrect ? "good" : "bad");
      var strong = document.createElement("strong");
      strong.textContent = isCorrect ? "Correct" : "Not quite";
      feedback.innerHTML = "";
      feedback.appendChild(strong);
      feedback.appendChild(document.createTextNode(explanation || ""));
    }

    var streakLabel = $(prefix + "StreakLabel");
    if (streakLabel) streakLabel.textContent = "🔥 Streak: " + prog.streak;

    var scoreLabel = $(prefix + "ScoreLabel");
    var totalLabel = $(prefix + "TotalLabel");
    if (scoreLabel) scoreLabel.textContent = s.score;
    if (totalLabel) totalLabel.textContent = s.index + 1;

    var nextBtn = $(prefix + "NextBtn");
    if (nextBtn) nextBtn.disabled = false;
  }

  function advanceSession(kind) {
    var s = state[kind];
    var prefix = kind === "quiz" ? "quiz" : kind === "tf" ? "tf" : "scn";
    if (!s.answered) return; // guard: must answer before advancing
    s.index++;
    if (s.index >= s.order.length) {
      completeSession(kind, prefix);
    } else {
      renderSessionQuestion(kind);
    }
  }

  function completeSession(kind, prefix) {
    var s = state[kind];
    var progKey = kind === "quiz" ? "quiz" : kind === "tf" ? "tf" : "scenario";
    var prog = state.progress[progKey];
    var pct = Math.round((s.score / s.order.length) * 100);
    prog.completed = true;
    prog.bestPct = Math.max(prog.bestPct, pct);
    saveProgress();

    var fill = $(prefix + "ProgressFill");
    if (fill) fill.style.width = "100%";

    var activeArea = $(prefix + "ActiveArea");
    var completeArea = $(prefix + "CompleteArea");
    if (activeArea) activeArea.style.display = "none";
    if (completeArea) completeArea.style.display = "";

    var finalScoreEl = $(prefix + "FinalScore");
    if (finalScoreEl) finalScoreEl.textContent = pct + "%";

    updateMasteryChip();
  }

  function initSessionEngine() {
    var quizNext = $("quizNextBtn"); if (quizNext) quizNext.addEventListener("click", function () { advanceSession("quiz"); });
    var tfNext = $("tfNextBtn"); if (tfNext) tfNext.addEventListener("click", function () { advanceSession("tf"); });
    var scnNext = $("scnNextBtn"); if (scnNext) scnNext.addEventListener("click", function () { advanceSession("scn"); });

    var quizRestart = $("quizRestartBtn"); if (quizRestart) quizRestart.addEventListener("click", function () { startSession("quiz"); });
    var tfRestart = $("tfRestartBtn"); if (tfRestart) tfRestart.addEventListener("click", function () { startSession("tf"); });
    var scnRestart = $("scnRestartBtn"); if (scnRestart) scnRestart.addEventListener("click", function () { startSession("scn"); });

    startSession("quiz");
    startSession("tf");
    startSession("scn");
  }

  /* -------------------------------------------------------------------
     8. PROGRESS DASHBOARD
     ------------------------------------------------------------------- */
  var DIAL_CIRCUMFERENCE = 2 * Math.PI * 52; // r=52

  function computeOverallMastery() {
    var p = state.progress;
    var totalAnswered = p.quiz.answered + p.tf.answered + p.scenario.answered;
    var totalCorrect = p.quiz.correct + p.tf.correct + p.scenario.correct;
    var accuracyPct = totalAnswered > 0 ? (totalCorrect / totalAnswered) : 0;

    var modulesDone = [p.menuViewed, p.quiz.completed, p.tf.completed, p.scenario.completed].filter(Boolean).length;
    var completionPct = modulesDone / 4;

    // Mastery blends completion (did they finish modules) with accuracy (did they do well)
    var mastery = Math.round(((accuracyPct * 0.65) + (completionPct * 0.35)) * 100);
    return {
      mastery: clamp(mastery, 0, 100),
      totalAnswered: totalAnswered,
      totalCorrect: totalCorrect,
      modulesDone: modulesDone,
      bestStreak: Math.max(p.quiz.bestStreak, p.tf.bestStreak, p.scenario.bestStreak)
    };
  }

  function updateMasteryChip() {
    var m = computeOverallMastery();
    var chip = $("masteryChipText");
    if (chip) chip.textContent = m.mastery + "% mastery";
  }

  function renderProgressDashboard() {
    var m = computeOverallMastery();

    var dial = $("dialProgressCircle");
    if (dial) {
      var offset = DIAL_CIRCUMFERENCE * (1 - m.mastery / 100);
      dial.style.strokeDasharray = DIAL_CIRCUMFERENCE.toFixed(1);
      dial.style.strokeDashoffset = offset.toFixed(1);
    }
    var dialText = $("dialText");
    if (dialText) dialText.textContent = m.mastery + "%";

    var summary = $("dialSummaryText");
    if (summary) {
      summary.textContent = m.mastery >= 80
        ? "Excellent work — you're operating at floor-ready mastery. Keep drilling to stay sharp."
        : m.mastery >= 45
        ? "Good progress. Revisit any module below 100% completion to push your mastery higher."
        : "Just getting started — work through each module at least once to build your baseline.";
    }

    var setNum = function (id, val) { var e = $(id); if (e) e.textContent = val; };
    setNum("statAnswered", m.totalAnswered);
    setNum("statCorrect", m.totalCorrect);
    setNum("statBestStreak", m.bestStreak);
    setNum("statModulesDone", m.modulesDone + "/4");

    renderModuleList();
    updateMasteryChip();
  }

  function renderModuleList() {
    var wrap = $("moduleList");
    if (!wrap) return;
    wrap.innerHTML = "";
    var p = state.progress;

    var rows = [
      { name: "Menu Breakdown", sub: "Digital cheat sheet reviewed", icon: "📋", done: p.menuViewed, pct: p.menuViewed ? 100 : 0 },
      { name: "Quiz", sub: p.quiz.answered + " questions answered", icon: "🧠", done: p.quiz.completed, pct: p.quiz.bestPct },
      { name: "True / False", sub: p.tf.answered + " statements answered", icon: "✅", done: p.tf.completed, pct: p.tf.bestPct },
      { name: "Scenarios", sub: p.scenario.answered + " scenarios answered", icon: "🗣️", done: p.scenario.completed, pct: p.scenario.bestPct }
    ];

    rows.forEach(function (r) {
      var row = el("div", "module-row");
      var ico = el("div", "m-ico", r.icon);
      var info = el("div", "m-info");
      info.appendChild(el("div", "m-name", r.name));
      info.appendChild(el("div", "m-sub", r.sub));
      var track = el("div", "m-track");
      var fill = el("div"); fill.style.width = r.pct + "%";
      track.appendChild(fill);
      var badge = el("span", r.done ? "badge-done" : "badge-todo", r.done ? "Best " + r.pct + "%" : "Not started");

      row.appendChild(ico);
      row.appendChild(info);
      row.appendChild(track);
      row.appendChild(badge);
      wrap.appendChild(row);
    });
  }

  function initResetButton() {
    var btn = $("resetProgressBtn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var ok = window.confirm("This clears all saved scores and streaks on this device. Continue?");
      if (!ok) return;
      state.progress = {
        quiz: { answered: 0, correct: 0, streak: 0, bestStreak: 0, completed: false, bestPct: 0 },
        tf: { answered: 0, correct: 0, streak: 0, bestStreak: 0, completed: false, bestPct: 0 },
        scenario: { answered: 0, correct: 0, streak: 0, bestStreak: 0, completed: false, bestPct: 0 },
        menuViewed: false
      };
      saveProgress();
      startSession("quiz");
      startSession("tf");
      startSession("scn");
      renderProgressDashboard();
      updateMasteryChip();
    });
  }

  /* -------------------------------------------------------------------
     9. BOOTSTRAP
     ------------------------------------------------------------------- */
  function init() {
    renderTabs();
    setActiveTab("menu");

    renderMenuCatNav();
    renderMenuGrid();

    initFlashcards();
    initSessionEngine();
    initResetButton();

    renderProgressDashboard();
    updateMasteryChip();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

