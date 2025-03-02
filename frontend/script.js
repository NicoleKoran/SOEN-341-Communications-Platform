const API_URL = "http://localhost:7777";
let currentUser = "Alice";
let currentChat = "chat1";


document.getElementById("userSelector").addEventListener("change", function() {
    currentUser = this.value;
    document.getElementById("currentUser").innerText = currentUser;
});

const chatList = document.getElementById("chatList");
["chat1", "chat2"].forEach(chat => {
    let chatElement = document.createElement("div");
    chatElement.className = "chat";
    chatElement.innerText = chat;
    chatElement.onclick = () => openChat(chat);
    chatList.appendChild(chatElement);
});

async function openChat(chatId) {
    currentChat = chatId;
    document.getElementById("chatName").innerText = `Chat: ${chatId}`;
    document.getElementById("messageHistory").innerHTML = "";

    const res = await fetch(`${API_URL}/messages/${chatId}`);
    const messages = await res.json();

    messages.forEach(msg => displayMessage(msg));
}

function displayMessage(msg) {
    const messageBox = document.createElement("div");
    messageBox.className = `message ${msg.sender === currentUser ? "sent" : "received"}`;
    messageBox.innerHTML = `<strong>${msg.sender}:</strong> ${msg.text}`;
    document.getElementById("messageHistory").appendChild(messageBox);
}

// Send msg
async function sendMessage() {
    const input = document.getElementById("messageInput");
    const text = input.value.trim();
    if (!text) return;

    const message = { chatId: currentChat, sender: currentUser, text };

    // Send to api
    await fetch(`${API_URL}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message),
    });

    displayMessage(message);
    input.value = "";
}
function toggleContactInfo() {
    const contactInfo = document.getElementById("contactInfo");
    const contactSelector = document.getElementById("contactSelector");
    
    if (window.innerWidth <= 768) {
        if (contactInfo.style.display === "none" || contactInfo.style.display === "") {
            if (!contactSelector.value) {
                contactSelector.value = currentUser;
                displayUserDetails(currentUser);
            }
            contactInfo.style.display = "flex";
        } else {
            contactInfo.style.display = "none";
        }
    }
}

// Get modal elements
const modal = document.getElementById("registerModal");
const registerBtn = document.getElementById("registerBtn");
const closeBtn = document.getElementsByClassName("close")[0];

// Open modal
registerBtn.onclick = function() {
    modal.style.display = "block";
}

// Close modal
closeBtn.onclick = function() {
    modal.style.display = "none";
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

// Modify the registerUser function to close the modal after successful registration
async function registerUser() {
    const username = document.getElementById("newUsername").value.trim();
    const email = document.getElementById("newEmail").value.trim();
    const phoneNumber = document.getElementById("newPhone").value.trim();
    
    if (!username || !email || !phoneNumber) {
        alert("Please fill in all fields");
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/users`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, email, phoneNumber })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error);
        }
        
        // Clear form
        document.getElementById("newUsername").value = "";
        document.getElementById("newEmail").value = "";
        document.getElementById("newPhone").value = "";
        
        // Reload user list
        loadUsers();
        alert("User registered successfully!");
    } catch (error) {
        alert(error.message);
    }
}

// Add this function to load the contact selector
async function loadContactSelector() {
    const response = await fetch(`${API_URL}/users`);
    const users = await response.json();
    
    const contactSelector = document.getElementById("contactSelector");
    contactSelector.innerHTML = '<option value="">Select user info...</option>';
    
    Object.keys(users).forEach(username => {
        const option = document.createElement("option");
        option.value = username;
        option.textContent = username;
        contactSelector.appendChild(option);
    });
}

// Add event listener for contact selector
document.getElementById("contactSelector").addEventListener("change", async function() {
    const selectedUser = this.value;
    if (selectedUser) {
        await displayUserDetails(selectedUser);
        if (window.innerWidth <= 768) {
            document.getElementById("contactInfo").style.display = "flex";
        }
    }
});

// Update loadUsers to also load the contact selector
async function loadUsers() {
    const response = await fetch(`${API_URL}/users`);
    const users = await response.json();
    
    const userSelector = document.getElementById("userSelector");
    userSelector.innerHTML = ""; // Clear existing options
    
    Object.keys(users).forEach(username => {
        const option = document.createElement("option");
        option.value = username;
        option.textContent = username;
        userSelector.appendChild(option);
    });

    // Also load the contact selector
    await loadContactSelector();
}

// Load users when page loads
loadUsers();

// Add this function to display user details
async function displayUserDetails(username) {
    const response = await fetch(`${API_URL}/users`);
    const users = await response.json();
    const user = users[username];

    if (user) {
        document.getElementById("detailUsername").textContent = username;
        document.getElementById("detailEmail").textContent = user.email || "-";
        document.getElementById("detailPhone").textContent = user.phoneNumber || "-";
        document.getElementById("detailRole").textContent = user.role || "user";
        document.getElementById("detailCreated").textContent = new Date(user.createdAt).toLocaleDateString();
    }
}

// Call displayUserDetails when the page loads
window.addEventListener('load', async () => {
    await displayUserDetails(currentUser);
});
