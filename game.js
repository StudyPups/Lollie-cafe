/* =========================================================
   Lollie's Cafe Game — game.js (complete file)
   - Level 1 memory flow (show order ~5s then hide)
   - Customer “walks in” (adds .enter class)
   - No duplicate items per order (unique selection)
   - PNG menu items (uses item.img)
   - Serving animation: item PNG flies to customer
   - Correct item buttons stay disabled (no double-serve)
   - Inline onclick buttons supported (functions exposed on window)
   ========================================================= */

/* ---------------------------
   Game State
--------------------------- */
let currentLevel = 1;
let score = 0;

let currentCustomer = null;
let currentOrder = [];          // array of item objects still needed
let fullOrderSnapshot = [];     // for display/reference without mutating

let timerInterval = null;
let timeRemaining = 0;

let orderRevealTimeout = null;  // used to hide order after a delay


/* ---------------------------
   Game Data
 
--------------------------- */
const customers = [
  {
    name: "Peppermint",
    images: {
      wait:  "elf-wait.png",
      think: "elf-think.png",
      happy: "elf-happy.png",
      sad:   "elf-sad.png"
    }
  },
  {
    name: "Sugarplum",
    images: {
      wait:  "fairy-wait.png",
      think: "fairy-think.png",
      happy: "fairy-happy.png",
      sad:   "fairy-sad.png"
    }
  },
  {
    name: "Teddy",
    images: {
      wait:  "pup-wait.png",
      think: "pup-think.png",
      happy: "pup-happy.png",
      sad:   "pup-sad2.png"
    }
  }
];

// Menu items now use PNGs instead of emojis
const items = [
  { id: "donut",     name: "Donut",       img: "donut.png",     price: 3.50 },
  { id: "coffee",    name: "Coffee",      img: "coffee.png",    price: 4.50 },
  { id: "cupcake",   name: "Cupcake",     img: "cupcake.png",   price: 5.00 },
  { id: "milkshake", name: "Milkshake",   img: "milkshake.png", price: 6.50 },
  { id: "cookies",   name: "Cookie Bag",  img: "cookies.png",   price: 4.00 },
  { id: "water",     name: "Water",       img: "water.png",     price: 2.50 },
  { id: "beans",     name: "Magic Beans", img: "beans.png",     price: 7.00 }
];

const levelConfig = {
  1: {
    title: "Level 1: Memory Challenge",
    description: "Remember what the customer orders!",
    orderSize: [2, 3],
    timer: false,
    timeLimit: null,
    showPrices: false,
    mathMode: false,
    changeMode: false,
    ordersToWin: 5,
    revealMs: 5000
  },
  2: {
    title: "Level 2: Timed Challenge",
    description: "Remember orders before time runs out!",
    orderSize: [3, 4],
    timer: true,
    timeLimit: 45,
    showPrices: false,
    mathMode: false,
    changeMode: false,
    ordersToWin: 7,
    revealMs: 3000
  },
  3: {
    title: "Level 3: Math Challenge",
    description: "Calculate the total cost!",
    orderSize: [2, 4],
    timer: false,
    timeLimit: null,
    showPrices: true,
    mathMode: true,
    changeMode: false,
    ordersToWin: 5
  },
  4: {
    title: "Level 4: Master Challenge",
    description: "Give correct change!",
    orderSize: [2, 3],
    timer: false,
    timeLimit: null,
    showPrices: true,
    mathMode: true,
    changeMode: true,
    ordersToWin: 5
  }
};


/* =========================================================
   Screen Management
========================================================= */
function hideAllScreens() {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.add("hidden");
  });
}

function showStart() {
  hideAllScreens();
  document.getElementById("startScreen").classList.remove("hidden");
}

function showLevelSelect() {
  hideAllScreens();
  document.getElementById("levelSelect").classList.remove("hidden");
}

function showGame() {
  hideAllScreens();
  document.getElementById("gameScreen").classList.remove("hidden");
}

function showVictory() {
  hideAllScreens();
  document.getElementById("victoryScreen").classList.remove("hidden");
  document.getElementById("finalScore").textContent = score;

  let message = "Amazing work!";
  if (score >= levelConfig[currentLevel].ordersToWin) {
    message = "Perfect! You're a cafe master! ⭐";
  } else if (score >= levelConfig[currentLevel].ordersToWin * 0.7) {
    message = "Great job! Keep practicing! 🌟";
  }
  document.getElementById("victoryMessage").textContent = message;

  const nextBtn = document.getElementById("nextLevelBtn");
  if (currentLevel < 4) nextBtn.classList.remove("hidden");
  else nextBtn.classList.add("hidden");
}


/* =========================================================
   Level Management
========================================================= */
function startLevel(level) {
  currentLevel = level;
  score = 0;

  const config = levelConfig[level];

  // Clean up any timers / pending reveals from previous level
  stopTimer();
  clearOrderRevealTimeout();

  // Update header
  document.getElementById("levelTitle").textContent = config.title;
  document.getElementById("score").textContent = score;

  // Timer UI
  const timerDisplay = document.getElementById("timerDisplay");
  if (config.timer) timerDisplay.classList.remove("hidden");
  else timerDisplay.classList.add("hidden");

 // Setup the appropriate menu for this level
setupLevelMenu(level);

// Build regular menu for levels 2-4
if (level > 1) {
  buildMenu(config);
}

  // Hide special UI panels (math/change)
  document.getElementById("orderSummary").classList.add("hidden");
  document.getElementById("mathInput").classList.add("hidden");
  document.getElementById("changeInput").classList.add("hidden");
  document.getElementById("totalDisplay").classList.add("hidden");

  // Clear feedback
  hideFeedback();

  showGame();
  newCustomer();
}

function nextLevel() {
  if (currentLevel < 4) startLevel(currentLevel + 1);
  else showLevelSelect();
}

function quitToLevelSelect() {
  stopTimer();
  clearOrderRevealTimeout();
  showLevelSelect();
}


/* =========================================================
   Menu Building (PNG items)
========================================================= */
function buildMenu(config) {
  const menuContainer = document.getElementById("menuItems");
  menuContainer.innerHTML = "";

  items.forEach((item) => {
    const button = document.createElement("button");
    button.className = "menu-button";
    button.type = "button";
    button.onclick = () => serveItem(item.id, button);

    const priceText = config.showPrices ? `$${item.price.toFixed(2)}` : "";

    button.innerHTML = `
      <img class="item-thumb" src="${item.img}" alt="${item.name}">
      <div class="item-name">${item.name}</div>
      ${priceText ? `<div class="item-price">${priceText}</div>` : ""}
    `;

    menuContainer.appendChild(button);
  });

  document.getElementById("counterTitle").textContent =
    config.mathMode ? "Calculate the total!" : "What can you make?";
}

function setMenuEnabled(isEnabled) {
  document.querySelectorAll(".menu-button").forEach((btn) => {
    if (isEnabled) {
      // Only re-enable if it wasn't permanently disabled by a correct serve
      // We use the data-locked flag for "served correctly already"
      if (btn.dataset.locked === "true") return;
      btn.disabled = false;
      btn.classList.remove("disabled");
    } else {
      btn.disabled = true;
      btn.classList.add("disabled");
    }
  });
}

function lockMenuButton(buttonEl) {
  buttonEl.dataset.locked = "true";
  buttonEl.disabled = true;
  buttonEl.classList.add("disabled");
}

function unlockMenuButton(buttonEl) {
  buttonEl.dataset.locked = "false";
  buttonEl.disabled = false;
  buttonEl.classList.remove("disabled");
}


/* =========================================================
   Customer + Order Management
========================================================= */
function newCustomer() {
  const config = levelConfig[currentLevel];

  stopTimer();
  clearOrderRevealTimeout();
  hideFeedback();

  // Pick random customer
  currentCustomer = customers[Math.floor(Math.random() * customers.length)];
  document.getElementById("customerName").textContent = currentCustomer.name;

  // Start with wait image
  updateCustomerDisplay("wait");

  // Trigger entrance animation (CSS should animate .customer.enter)
  const customerEl = document.querySelector(".customer");
  if (customerEl) {
    customerEl.classList.remove("enter");
    // Force reflow to restart animation reliably
    void customerEl.offsetWidth;
    customerEl.classList.add("enter");
  }

  // Generate a UNIQUE order (no duplicates)
  const orderSize = randInt(config.orderSize[0], config.orderSize[1]);
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  fullOrderSnapshot = shuffled.slice(0, orderSize);
  currentOrder = [...fullOrderSnapshot]; // mutable copy for serving

  // Show order
  if (config.mathMode) {
    // Math levels: show summary after a short beat
    document.getElementById("customerOrder").textContent = "Let me think… 🤔";
    setTimeout(() => updateCustomerDisplay("think"), 700);
    setTimeout(() => showMathChallenge(), 1200);
    // Disable menu while in math mode
    setMenuEnabled(false);
  } else {
    // Memory levels (1 & 2):
    // 1) Disable menu while order is being shown
    setMenuEnabled(false);

    // 2) Show order (as images + words)
    showOrderInBubble(fullOrderSnapshot);

    // 3) Customer switches to thinking face after a moment
    setTimeout(() => updateCustomerDisplay("think"), 700);

    // 4) Hide order after reveal time and enable menu
    const revealMs = config.revealMs ?? 4000;
    orderRevealTimeout = setTimeout(() => {
      hideOrderInBubble();
      setMenuEnabled(true);

      // Optional: helpful prompt
      document.getElementById("customerOrder").textContent =
        "Okay… what did I order again? 🤔";
    }, revealMs);
  }

  // Start timer if needed (Level 2)
  if (config.timer) startTimer(config.timeLimit);
}

function showOrderInBubble(orderArr) {
  const bubble = document.getElementById("customerOrder");

  // We use innerHTML so we can show the item PNGs.
  // If you want a cleaner look, add CSS for .order-line and .order-thumb in style.css.
  const lines = orderArr
    .map(
      (it) => `
      <span class="order-line" style="display:inline-flex;align-items:center;gap:8px;margin:6px 8px;">
        <img class="order-thumb" src="${it.img}" alt="${it.name}" style="width:34px;height:34px;object-fit:contain;">
        <strong>${it.name}</strong>
      </span>`
    )
    .join("");

  bubble.innerHTML = `
    <div style="margin-bottom:8px;"><strong>I’d like…</strong></div>
    <div style="display:flex;flex-wrap:wrap;justify-content:center;">${lines}</div>
    <div style="margin-top:10px;"><em>please!</em></div>
  `;
}

function hideOrderInBubble() {
  const bubble = document.getElementById("customerOrder");
  bubble.textContent = ""; // clear back to plain text
}

function updateCustomerDisplay(emotion) {
  const img = document.getElementById("customerImage");
  if (!img || !currentCustomer) return;
  img.src = currentCustomer.images[emotion] || currentCustomer.images.wait;
}


/* =========================================================
   Timer (Level 2)
========================================================= */
function startTimer(seconds) {
  stopTimer();
  timeRemaining = seconds;
  document.getElementById("timer").textContent = timeRemaining;

  timerInterval = setInterval(() => {
    timeRemaining--;
    document.getElementById("timer").textContent = timeRemaining;

    if (timeRemaining <= 0) {
      stopTimer();
      handleTimeout();
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function handleTimeout() {
  // On timeout, customer is sad and we move on.
  // You can add penalties/lives later if you want.
  updateCustomerDisplay("sad");
  showFeedback("Time’s up! Too slow!", false);

  // Re-enable menu in case we were mid-reveal
  setMenuEnabled(true);

  setTimeout(() => {
    if (score >= levelConfig[currentLevel].ordersToWin) showVictory();
    else newCustomer();
  }, 1400);
}

function clearOrderRevealTimeout() {
  if (orderRevealTimeout) {
    clearTimeout(orderRevealTimeout);
    orderRevealTimeout = null;
  }
}


/* =========================================================
   Serving Items (Levels 1 & 2)
   - Fly PNG from clicked menu button to customer
   - Then react (happy/sad)
   - Correct item locks button disabled permanently for this round
========================================================= */
function serveItem(itemId, buttonEl) {
  const config = levelConfig[currentLevel];
  if (config.mathMode) return;            // math levels don’t serve items
  if (!buttonEl || buttonEl.disabled) return;

  const clickedItem = items.find((it) => it.id === itemId);
  if (!clickedItem) return;

  // While the item flies, temporarily disable the button to prevent spam clicks
  buttonEl.disabled = true;
  buttonEl.classList.add("disabled");

  flyImageFromButtonToCustomer(buttonEl, clickedItem.img, clickedItem.name, () => {
    const index = currentOrder.findIndex((orderItem) => orderItem.id === itemId);
    const isCorrect = index !== -1;

    if (isCorrect) {
      // Remove from remaining order
      currentOrder.splice(index, 1);

      // Lock button permanently (cannot serve same item again)
      lockMenuButton(buttonEl);

      // React after item arrives
      updateCustomerDisplay("happy");

      if (currentOrder.length === 0) {
        showFeedback("Perfect! Thank you! 😊", true, true);
        stopTimer();

        setTimeout(() => {
          score++;
          document.getElementById("score").textContent = score;

          if (score >= levelConfig[currentLevel].ordersToWin) {
            showVictory();
          } else {
            // Rebuild menu for next round (clears locks)
            buildMenu(levelConfig[currentLevel]);
            newCustomer();
          }
        }, 900);
      } else {
        showFeedback("Yum! What else? 😋", true, false);
        setTimeout(() => {
          hideFeedback();
          updateCustomerDisplay("think");
        }, 800);
      }
    } else {
      // Wrong item: show sad, then allow them to try a different item
      updateCustomerDisplay("sad");
      showFeedback("Oops! That’s not right. Try again!", false, false);

      setTimeout(() => {
        hideFeedback();
        updateCustomerDisplay("think");

        // Re-enable this wrong button (it was only temporarily disabled)
        unlockMenuButton(buttonEl);
      }, 900);
    }
  });
}


/* =========================================================
   Flying Item Animation (PNG)
========================================================= */
function flyImageFromButtonToCustomer(buttonEl, imgSrc, altText, onArrive) {
  const start = buttonEl.getBoundingClientRect();
  const customerImg = document.getElementById("customerImage");
  const end = customerImg.getBoundingClientRect();

  const flyer = document.createElement("img");
  flyer.className = "flying-item";
  flyer.src = imgSrc;
  flyer.alt = altText;

  // Default size; your CSS can override .flying-item if you prefer
  flyer.style.width = "56px";
  flyer.style.height = "56px";
  flyer.style.objectFit = "contain";
  flyer.style.position = "fixed";
  flyer.style.zIndex = "2000";
  flyer.style.pointerEvents = "none";
  flyer.style.left = `${start.left + start.width / 2}px`;
  flyer.style.top = `${start.top + start.height / 2}px`;
  flyer.style.transform = "translate(-50%, -50%)";

  document.body.appendChild(flyer);

  // Web Animations API: move from button center to customer image center
  const anim = flyer.animate(
    [
      {
        left: `${start.left + start.width / 2}px`,
        top: `${start.top + start.height / 2}px`,
        transform: "translate(-50%, -50%) scale(1)",
        opacity: 1
      },
      {
        left: `${end.left + end.width / 2}px`,
        top: `${end.top + end.height / 2}px`,
        transform: "translate(-50%, -50%) scale(0.9)",
        opacity: 1
      }
    ],
    { duration: 520, easing: "ease-in-out", fill: "forwards" }
  );

  anim.onfinish = () => {
    flyer.remove();
    if (typeof onArrive === "function") onArrive();
  };
}


/* =========================================================
   Math Mode (Levels 3 & 4)
========================================================= */
function showMathChallenge() {
  const config = levelConfig[currentLevel];

  // Build order list
  const orderList = document.getElementById("orderList");
  orderList.innerHTML = "";

  let total = 0;
  fullOrderSnapshot.forEach((item) => {
    total += item.price;

    const row = document.createElement("div");
    row.className = "order-item";
    row.innerHTML = `
      <span>${item.name}</span>
      <span>$${item.price.toFixed(2)}</span>
    `;
    orderList.appendChild(row);
  });

  document.getElementById("orderSummary").classList.remove("hidden");

  if (config.changeMode) {
    // Level 4: show total and ask for change
    document.getElementById("totalDisplay").classList.remove("hidden");
    document.getElementById("orderTotal").textContent = total.toFixed(2);

    // Make a payment that covers the bill (rounded up to nearest $5)
    const payment = Math.ceil(total / 5) * 5;
    document.getElementById("customerPayment").textContent = payment.toFixed(2);

    document.getElementById("changeInput").classList.remove("hidden");
    document.getElementById("mathInput").classList.add("hidden");

    document.getElementById("changeAmount").value = "";
    document.getElementById("changeAmount").focus();

    document.getElementById("customerOrder").textContent =
      `Here’s $${payment.toFixed(2)}. What’s my change?`;
  } else {
    // Level 3: ask for total only
    document.getElementById("totalDisplay").classList.add("hidden");
    document.getElementById("mathInput").classList.remove("hidden");
    document.getElementById("changeInput").classList.add("hidden");

    document.getElementById("totalInput").value = "";
    document.getElementById("totalInput").focus();

    document.getElementById("customerOrder").textContent = "How much do I owe?";
  }

  // In math mode, menu is disabled
  setMenuEnabled(false);
}

function checkTotal() {
  const userAnswer = parseFloat(document.getElementById("totalInput").value);
  const correctTotal = fullOrderSnapshot.reduce((sum, item) => sum + item.price, 0);

  if (Number.isNaN(userAnswer)) {
    showFeedback("Type a number first 😊", false);
    return;
  }

  if (Math.abs(userAnswer - correctTotal) < 0.01) {
    handleMathCorrect();
  } else {
    handleMathWrong();
  }
}

function checkChange() {
  const userChange = parseFloat(document.getElementById("changeAmount").value);
  const total = fullOrderSnapshot.reduce((sum, item) => sum + item.price, 0);
  const payment = parseFloat(document.getElementById("customerPayment").textContent);
  const correctChange = payment - total;

  if (Number.isNaN(userChange)) {
    showFeedback("Type a number first 😊", false);
    return;
  }

  if (Math.abs(userChange - correctChange) < 0.01) {
    handleMathCorrect();
  } else {
    handleMathWrong();
  }
}

function handleMathCorrect() {
  updateCustomerDisplay("happy");
  showFeedback("Correct! Great maths! 🌟", true);

  setTimeout(() => {
    score++;
    document.getElementById("score").textContent = score;

    if (score >= levelConfig[currentLevel].ordersToWin) {
      showVictory();
    } else {
      // Reset panels and load next customer
      document.getElementById("orderSummary").classList.add("hidden");
      document.getElementById("mathInput").classList.add("hidden");
      document.getElementById("changeInput").classList.add("hidden");
      document.getElementById("totalDisplay").classList.add("hidden");

      buildMenu(levelConfig[currentLevel]);
      newCustomer();
    }
  }, 1100);
}

function handleMathWrong() {
  updateCustomerDisplay("sad");
  showFeedback("Not quite — try again!", false);
}


/* =========================================================
   Feedback helpers
========================================================= */
function showFeedback(message, isCorrect, autoClear = true) {
  const el = document.getElementById("feedback");
  el.textContent = message;
  el.className = `feedback ${isCorrect ? "correct" : "wrong"}`;
  el.classList.remove("hidden");

  if (autoClear) {
    setTimeout(() => el.classList.add("hidden"), 1200);
  }
}

function hideFeedback() {
  const el = document.getElementById("feedback");
  el.classList.add("hidden");
}


/* =========================================================
   Utilities
========================================================= */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


/* =========================================================
   Keyboard support (Enter submits for math inputs)
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const totalInput = document.getElementById("totalInput");
  const changeAmount = document.getElementById("changeAmount");

  if (totalInput) {
    totalInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") checkTotal();
    });
  }

  if (changeAmount) {
    changeAmount.addEventListener("keypress", (e) => {
      if (e.key === "Enter") checkChange();
    });
  }
});


/* =========================================================
   Make functions available to inline onclick handlers
   (your HTML uses onclick="showLevelSelect()" etc.)
========================================================= */
window.showLevelSelect = showLevelSelect;
window.showStart = showStart;
window.startLevel = startLevel;
window.quitToLevelSelect = quitToLevelSelect;
window.nextLevel = nextLevel;
window.checkTotal = checkTotal;

/* ============================================
   LEVEL 1: ITEM HUNT FUNCTIONS
   ============================================ */

// Show/hide the appropriate menu based on level
function setupLevelMenu(levelNum) {
  const itemHunt = document.getElementById('itemHuntContainer');
  const menuItems = document.getElementById('menuItems');
  
  if (levelNum === 1) {
    // Level 1: Item Hunt Mode
    itemHunt.classList.remove('hidden');
    menuItems.classList.add('hidden');
    
    // Reset all items to be visible and clickable
    document.querySelectorAll('.hidden-item').forEach(item => {
      item.classList.remove('found');
    });
    
    // Hide instructions after 3 seconds
    setTimeout(() => {
      const instructions = document.getElementById('huntInstructions');
      if (instructions) {
        instructions.style.opacity = '0';
        instructions.style.transition = 'opacity 0.5s';
        setTimeout(() => instructions.style.display = 'none', 500);
      }
    }, 3000);
    
  } else {
    // Levels 2-4: Regular Grid Menu
    itemHunt.classList.add('hidden');
    menuItems.classList.remove('hidden');
  }
}

// Modified serve function for item hunt mode
function serveItemHunt(itemId, buttonEl) {
  const config = levelConfig[currentLevel];
  
  // Check if this item is in the current order
  const index = currentOrder.findIndex((orderItem) => orderItem.id === itemId);
  const isCorrect = index !== -1;
  
  if (isCorrect) {
    // Mark item as found visually
    buttonEl.classList.add('found');
    
    // Remove from remaining order
    currentOrder.splice(index, 1);
    
    // Fly the item to customer
    const clickedItem = items.find((it) => it.id === itemId);
    flyImageFromButtonToCustomer(buttonEl, clickedItem.img, clickedItem.name, () => {
      updateCustomerDisplay("happy");
      
      if (currentOrder.length === 0) {
        // All items found!
        showFeedback("Perfect! Thank you! 😊", true);
        stopTimer();
        
        setTimeout(() => {
          score++;
          document.getElementById("score").textContent = score;
          
          if (score >= config.ordersToWin) {
            showVictory();
          } else {
            // Reset for next round
            setupLevelMenu(1);
            newCustomer();
          }
        }, 1200);
      } else {
        // More items to find
        showFeedback("Great! Keep looking! 🔍", true, false);
        setTimeout(() => {
          hideFeedback();
          updateCustomerDisplay("think");
        }, 800);
      }
    });
    
  } else {
    // Wrong item clicked
    updateCustomerDisplay("sad");
    showFeedback("That's not what I ordered! 🤔", false);
    
    // Shake animation for wrong item
    buttonEl.style.animation = 'shake 0.5s';
    setTimeout(() => {
      buttonEl.style.animation = '';
      updateCustomerDisplay("think");
      hideFeedback();
    }, 600);
  }
}

// Expose to global scope for onclick handlers
window.serveItemHunt = serveItemHunt;
