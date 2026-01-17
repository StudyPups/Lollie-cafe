// Game Variables
let score = 0;
let currentCustomer = null;

// List of possible customers and what they want
const customers = [
    { name: "Emma 👧", wants: "cookie", request: "I'd love a yummy cookie please!" },
    { name: "Oliver 👦", wants: "juice", request: "Can I have some juice? I'm thirsty!" },
    { name: "Sophia 👩", wants: "coffee", request: "I need coffee to wake up!" },
    { name: "Luna the Dog 🐕", wants: "cupcake", request: "Woof! Can I have a cupcake?" },
    { name: "Mrs. Rose 👵", wants: "coffee", request: "A nice coffee would be lovely, dear." },
    { name: "Teddy Bear 🧸", wants: "cookie", request: "Cookies are my favorite!" },
    { name: "Captain Max 👨‍✈️", wants: "juice", request: "Orange juice before my flight, please!" }
];

// Start the game
function startGame() {
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameScreen').classList.remove('hidden');
    newCustomer();
}

// Get a new customer
function newCustomer() {
    // Pick a random customer from the list
    currentCustomer = customers[Math.floor(Math.random() * customers.length)];
    
    // Show their name and what they want
    document.getElementById('customerName').textContent = currentCustomer.name;
    document.getElementById('customerOrder').textContent = currentCustomer.request;
    
    // Hide any old feedback
    document.getElementById('feedback').classList.add('hidden');
}

// When Lollie serves a treat
function serveTreat(treat) {
    const feedbackElement = document.getElementById('feedback');
    
    // Check if it's what the customer wanted
    if (treat === currentCustomer.wants) {
        // Correct! 
        score++;
        document.getElementById('score').textContent = score;
        
        feedbackElement.textContent = "Perfect! " + currentCustomer.name.split(' ')[0] + " is happy! 😊";
        feedbackElement.className = 'feedback correct';
        feedbackElement.classList.remove('hidden');
        
        // Get a new customer after 2 seconds
        setTimeout(newCustomer, 2000);
        
    } else {
        // Wrong item!
        feedbackElement.textContent = "Oops! That's not what they wanted. Try again!";
        feedbackElement.className = 'feedback wrong';
        feedbackElement.classList.remove('hidden');
        
        // Hide the message after 2 seconds
        setTimeout(() => {
            feedbackElement.classList.add('hidden');
        }, 2000);
    }
}
