// Game State
let currentLevel = 1;
let score = 0;
let currentCustomer = null;
let currentOrder = [];
let timerInterval = null;
let timeRemaining = 0;

// Game Data
const customers = [
    {
        name: "Peppermint",
        images: {
            wait: "elf-wait.png",
            think: "elf-think.png",
            happy: "elf-happy.png",
            sad: "elf-sad.png"
        }
    },
    {
        name: "Sugarplum",
        images: {
            wait: "fairy-wait.png",
            think: "fairy-think.png",
            happy: "fairy-happy.png",
            sad: "fairy-sad.png"
        }
    },
    {
        name: "Teddy",
        images: {
            wait: "pup-wait.png",
            think: "pup-think.png",
            happy: "pup-happy.png",
            sad: "pup-sad2.png"
        }
    }
];


const items = [
    { id: "donut", name: "Donut", emoji: "🍩", price: 3.50 },
    { id: "coffee", name: "Coffee", emoji: "☕", price: 4.50 },
    { id: "cupcake", name: "Cupcake", emoji: "🧁", price: 5.00 },
    { id: "milkshake", name: "Milkshake", emoji: "🥤", price: 6.50 },
    { id: "cookies", name: "Cookie Bag", emoji: "🍪", price: 4.00 },
    { id: "water", name: "Water", emoji: "💧", price: 2.50 },
    { id: "beans", name: "Magic Beans", emoji: "✨", price: 7.00 }
];

const levelConfig = {
    1: {
        title: "Level 1: Memory Challenge",
        description: "Remember what the customer orders!",
        orderSize: [2, 3],
        timer: false,
        showPrices: false,
        mathMode: false,
        changeMode: false,
        ordersToWin: 5
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
        ordersToWin: 7
    },
    3: {
        title: "Level 3: Math Challenge",
        description: "Calculate the total cost!",
        orderSize: [2, 4],
        timer: false,
        showPrices: true,
        mathMode: true,
        changeMode: false,
        ordersToWin: 5
    },
    4: {
        title: "Level 4: Master Challenge",
        description: "Calculate the total AND give correct change!",
        orderSize: [2, 3],
        timer: false,
        showPrices: true,
        mathMode: true,
        changeMode: true,
        ordersToWin: 5
    }
};

// Screen Management
function showStart() {
    hideAllScreens();
    document.getElementById('startScreen').classList.remove('hidden');
}

function showLevelSelect() {
    hideAllScreens();
    document.getElementById('levelSelect').classList.remove('hidden');
}

function showGame() {
    hideAllScreens();
    document.getElementById('gameScreen').classList.remove('hidden');
}

function showVictory() {
    hideAllScreens();
    document.getElementById('victoryScreen').classList.remove('hidden');
    document.getElementById('finalScore').textContent = score;
    
    // Set victory message based on score
    let message = "Amazing work!";
    if (score >= levelConfig[currentLevel].ordersToWin) {
        message = "Perfect! You're a cafe master! ⭐";
    } else if (score >= levelConfig[currentLevel].ordersToWin * 0.7) {
        message = "Great job! Keep practicing! 🌟";
    }
    document.getElementById('victoryMessage').textContent = message;
    
    // Show/hide next level button
    const nextBtn = document.getElementById('nextLevelBtn');
    if (currentLevel < 4) {
        nextBtn.classList.remove('hidden');
    } else {
        nextBtn.classList.add('hidden');
    }
}

function hideAllScreens() {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
}

// Level Management
function startLevel(level) {
    currentLevel = level;
    score = 0;
    const config = levelConfig[level];
    
    // Update UI
    document.getElementById('levelTitle').textContent = config.title;
    document.getElementById('score').textContent = score;
    
    // Timer setup
    if (config.timer) {
        document.getElementById('timerDisplay').classList.remove('hidden');
    } else {
        document.getElementById('timerDisplay').classList.add('hidden');
    }
    
    // Build menu
    buildMenu(config);
    
    // Hide/show appropriate UI elements
    document.getElementById('orderSummary').classList.add('hidden');
    document.getElementById('mathInput').classList.add('hidden');
    document.getElementById('changeInput').classList.add('hidden');
    
    showGame();
    newCustomer();
}

function nextLevel() {
    if (currentLevel < 4) {
        startLevel(currentLevel + 1);
    } else {
        showLevelSelect();
    }
}

function quitToLevelSelect() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    showLevelSelect();
}

// Menu Building
function buildMenu(config) {
    const menuContainer = document.getElementById('menuItems');
    menuContainer.innerHTML = '';
    
    items.forEach(item => {
        const button = document.createElement('button');
        button.className = 'menu-button';
        button.onclick = () => serveItem(item.id);
        
        let priceText = config.showPrices ? `$${item.price.toFixed(2)}` : '';
        
        button.innerHTML = `
            <div class="item-emoji">${item.emoji}</div>
            <div class="item-name">${item.name}</div>
            ${priceText ? `<div class="item-price">${priceText}</div>` : ''}
        `;
        
        menuContainer.appendChild(button);
    });
    
    if (config.mathMode) {
        document.getElementById('counterTitle').textContent = "Calculate the total!";
    } else {
        document.getElementById('counterTitle').textContent = "What can you make?";
    }
}

// Customer Management
function newCustomer() {
    const config = levelConfig[currentLevel];
    
    // Pick random customer
    currentCustomer = customers[Math.floor(Math.random() * customers.length)];
    
    // Generate order
    const orderSize = Math.floor(Math.random() * (config.orderSize[1] - config.orderSize[0] + 1)) + config.orderSize[0];
    currentOrder = [];
    
    for (let i = 0; i < orderSize; i++) {
        const randomItem = items[Math.floor(Math.random() * items.length)];
        currentOrder.push(randomItem);
    }
    
    // Update UI
    updateCustomerDisplay('wait');
    document.getElementById('customerName').textContent = currentCustomer.name;
    
    // Generate order text
    let orderText = "I'd like ";
    currentOrder.forEach((item, index) => {
        if (index === currentOrder.length - 1 && currentOrder.length > 1) {
            orderText += "and ";
        }
        orderText += `${item.emoji} ${item.name}`;
        if (index < currentOrder.length - 2) {
            orderText += ", ";
        } else if (index < currentOrder.length - 1) {
            orderText += " ";
        }
    });
    orderText += ", please!";
    
    document.getElementById('customerOrder').textContent = orderText;
    
    // Hide feedback
    document.getElementById('feedback').classList.add('hidden');
    
    // Show thinking expression after a moment
    setTimeout(() => updateCustomerDisplay('think'), 1000);
    
    // Handle different game modes
    if (config.mathMode) {
        setTimeout(() => showMathChallenge(), 2000);
    }
    
    // Start timer if needed
    if (config.timer) {
        startTimer(config.timeLimit);
    }
}

function updateCustomerDisplay(emotion) {
    const img = document.getElementById('customerImage');
    img.src = currentCustomer.images[emotion];
}

function startTimer(seconds) {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    timeRemaining = seconds;
    document.getElementById('timer').textContent = timeRemaining;
    
    timerInterval = setInterval(() => {
        timeRemaining--;
        document.getElementById('timer').textContent = timeRemaining;
        
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            handleTimeout();
        }
    }, 1000);
}

function handleTimeout() {
    updateCustomerDisplay('sad');
    showFeedback("Time's up! Too slow!", false);
    
    setTimeout(() => {
        if (score >= levelConfig[currentLevel].ordersToWin) {
            showVictory();
        } else {
            newCustomer();
        }
    }, 2000);
}

// Math Mode
function showMathChallenge() {
    const config = levelConfig[currentLevel];
    
    // Show order summary
    const orderList = document.getElementById('orderList');
    orderList.innerHTML = '';
    
    let total = 0;
    currentOrder.forEach(item => {
        total += item.price;
        const orderItem = document.createElement('div');
        orderItem.className = 'order-item';
        orderItem.innerHTML = `
            <span>${item.emoji} ${item.name}</span>
            <span>$${item.price.toFixed(2)}</span>
        `;
        orderList.appendChild(orderItem);
    });
    
    document.getElementById('orderSummary').classList.remove('hidden');
    
    if (config.changeMode) {
        // Level 4: Show total, ask for change
        document.getElementById('totalDisplay').classList.remove('hidden');
        document.getElementById('orderTotal').textContent = total.toFixed(2);
        
        // Generate random payment amount (always enough to cover bill)
        const payment = Math.ceil(total / 5) * 5; // Round up to nearest $5
        document.getElementById('customerPayment').textContent = payment.toFixed(2);
        
        document.getElementById('changeInput').classList.remove('hidden');
        document.getElementById('changeAmount').value = '';
        document.getElementById('changeAmount').focus();
        
        // Update speech bubble
        document.getElementById('customerOrder').textContent = 
            `Here's $${payment.toFixed(2)}. What's my change?`;
    } else {
        // Level 3: Calculate total
        document.getElementById('totalDisplay').classList.add('hidden');
        document.getElementById('mathInput').classList.remove('hidden');
        document.getElementById('totalInput').value = '';
        document.getElementById('totalInput').focus();
        
        document.getElementById('customerOrder').textContent = 
            "How much do I owe?";
    }
    
    // Disable menu buttons
    document.querySelectorAll('.menu-button').forEach(btn => {
        btn.classList.add('disabled');
        btn.onclick = null;
    });
}

function checkTotal() {
    const userAnswer = parseFloat(document.getElementById('totalInput').value);
    const correctTotal = currentOrder.reduce((sum, item) => sum + item.price, 0);
    
    if (Math.abs(userAnswer - correctTotal) < 0.01) {
        handleCorrectAnswer();
    } else {
        handleWrongAnswer();
        // Let them try again
        setTimeout(() => {
            document.getElementById('feedback').classList.add('hidden');
        }, 2000);
    }
}

function checkChange() {
    const userChange = parseFloat(document.getElementById('changeAmount').value);
    const total = currentOrder.reduce((sum, item) => sum + item.price, 0);
    const payment = parseFloat(document.getElementById('customerPayment').textContent);
    const correctChange = payment - total;
    
    if (Math.abs(userChange - correctChange) < 0.01) {
        handleCorrectAnswer();
    } else {
        handleWrongAnswer();
        // Let them try again
        setTimeout(() => {
            document.getElementById('feedback').classList.add('hidden');
        }, 2000);
    }
}

// Simple Mode (Levels 1-2)
function serveItem(itemId) {
    const config = levelConfig[currentLevel];
    
    // In math mode, items shouldn't be clickable
    if (config.mathMode) return;
    
    const isCorrect = currentOrder.some(orderItem => orderItem.id === itemId);
    
    if (isCorrect) {
        // Remove this item from the order
        const index = currentOrder.findIndex(orderItem => orderItem.id === itemId);
        currentOrder.splice(index, 1);
        
        // Check if order is complete
        if (currentOrder.length === 0) {
            handleCorrectAnswer();
        } else {
            // Show positive feedback but continue
            updateCustomerDisplay('happy');
            showFeedback("Yes! What else?", true, false);
            setTimeout(() => {
                updateCustomerDisplay('think');
            }, 1000);
        }
    } else {
        handleWrongAnswer();
    }
}

function handleCorrectAnswer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    score++;
    document.getElementById('score').textContent = score;
    
    updateCustomerDisplay('happy');
    showFeedback("Perfect! Thank you! 😊", true);
    
    setTimeout(() => {
        if (score >= levelConfig[currentLevel].ordersToWin) {
            showVictory();
        } else {
            // Reset for next customer
            document.getElementById('orderSummary').classList.add('hidden');
            document.getElementById('mathInput').classList.add('hidden');
            document.getElementById('changeInput').classList.add('hidden');
            
            // Re-enable menu buttons
            buildMenu(levelConfig[currentLevel]);
            
            newCustomer();
        }
    }, 2000);
}

function handleWrongAnswer() {
    updateCustomerDisplay('sad');
    showFeedback("Oops! That's not right. Try again!", false);
}

function showFeedback(message, isCorrect, autoClear = true) {
    const feedbackElement = document.getElementById('feedback');
    feedbackElement.textContent = message;
    feedbackElement.className = `feedback ${isCorrect ? 'correct' : 'wrong'}`;
    feedbackElement.classList.remove('hidden');
    
    if (autoClear) {
        setTimeout(() => {
            feedbackElement.classList.add('hidden');
        }, 2000);
    }
}

// Keyboard support for math inputs
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('totalInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkTotal();
        }
    });
    
    document.getElementById('changeAmount').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkChange();
        }
    });
});
