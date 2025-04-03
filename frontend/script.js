const API_URL = "http://localhost:7777";
let currentUser = localStorage.getItem("username");
let currentChat = null;
let replyingTo = null;
let isCurrentUserAdmin = false;

// Redirect to login if not logged in
if (!localStorage.getItem("username")) {
    window.location.href = "login.html";
  }
  

// Modal elements
const modals = {
    // register: document.getElementById("registerModal"),
    directMessage: document.getElementById("directMessageModal"),
    groupChat: document.getElementById("groupChatModal")
};

const closeButtons = document.getElementsByClassName("close");

// Initialize modals
Object.values(modals).forEach(modal => {
    modal.style.display = "none";
});

// Close modal when clicking outside
window.onclick = function(event) {
    Object.values(modals).forEach(modal => {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    });
}

// Close buttons functionality
Array.from(closeButtons).forEach(button => {
    button.onclick = function() {
        Object.values(modals).forEach(modal => {
            modal.style.display = "none";
        });
    }
});

// Chat creation buttons
document.getElementById("newDirectMessageBtn").onclick = function() {
    modals.directMessage.style.display = "block";
    populateDirectMessageUsers();
}

document.getElementById("newGroupChatBtn").onclick = function() {
    if (!isCurrentUserAdmin) {
        alert("Only admins can create group chats");
        return;
    }
    modals.groupChat.style.display = "block";
    populateGroupChatUsers();
}

// User selector change handler
/*
    document.getElementById("userSelector").addEventListener("change", function() {
        currentUser = this.value;
        document.getElementById("currentUser").innerText = currentUser;
        loadUserChats();
        checkAdminStatus();
    
    });
*/

// Load user's chats
async function loadUserChats() {
    const response = await fetch(`${API_URL}/chats/${currentUser}`);
    const userChats = await response.json();

    const chatsArray = Array.isArray(userChats) ? userChats : Object.values(userChats);

    // Clear both sections
    const directContainer = document.getElementById("directChatsContainer");
    const groupContainer = document.getElementById("groupChatsContainer");
    directContainer.innerHTML = "";
    groupContainer.innerHTML = "";

    chatsArray.forEach(chat => {
        const chatElement = document.createElement("div");
        chatElement.className = "chat";

        let chatName = chat.type === "direct"
            ? chat.participants.filter(p => p !== currentUser).join(" - ")
            : chat.name;

        const menuHtml = isCurrentUserAdmin ? `
            <div class="chat-actions">
                <button class="chat-menu-btn" aria-label="Chat options">⋮</button>
                <div class="chat-dropdown">
                    <button onclick="renameChat('${chat.id}')">Rename</button>
                    <button onclick="deleteChat('${chat.id}')">Delete</button>
                </div>
            </div>
        ` : '';

        chatElement.innerHTML = `
            <div class="chat-info">
                <span>${chatName}</span>
            </div>
            ${menuHtml}
        `;

        chatElement.querySelector('.chat-info').onclick = () => openChat(chat.id);

        if (chat.type === "direct") {
            directContainer.appendChild(chatElement);
        } else {
            groupContainer.appendChild(chatElement);
        }
    });

    // Dropdown toggle logic
    document.querySelectorAll('.chat-menu-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const dropdown = btn.nextElementSibling;
            document.querySelectorAll('.chat-dropdown').forEach(d => {
                if (d !== dropdown) d.style.display = 'none';
            });
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        };
    });

    // Close all dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.chat-actions')) {
            document.querySelectorAll('.chat-dropdown').forEach(dropdown => {
                dropdown.style.display = 'none';
            });
        }
    });
}

// Check if current user is admin
async function checkAdminStatus() {
    const response = await fetch(`${API_URL}/users`);
    const users = await response.json();
    isCurrentUserAdmin = users[currentUser]?.role === "admin";
    console.log("Current user:", currentUser);
    console.log("Is admin:", isCurrentUserAdmin);
    
    // Show/hide group chat button based on admin status
    document.getElementById("newGroupChatBtn").style.display = 
        isCurrentUserAdmin ? "block" : "none";
}

// Populate direct message user selector
async function populateDirectMessageUsers() {
    const response = await fetch(`${API_URL}/users`);
    const users = await response.json();
    
    const select = document.getElementById("directMessageUser");
    select.innerHTML = '<option value="">Select user...</option>';
    
    Object.keys(users).forEach(username => {
        if (username !== currentUser) {
            const option = document.createElement("option");
            option.value = username;
            option.textContent = username;
            select.appendChild(option);
        }
    });
}

// Populate group chat user checkboxes
async function populateGroupChatUsers() {
    const response = await fetch(`${API_URL}/users`);
    const users = await response.json();
    
    const container = document.getElementById("groupChatUsers");
    container.innerHTML = "";
    
    Object.keys(users).forEach(username => {
        if (username !== currentUser) {
            const label = document.createElement("label");
            label.innerHTML = `
                <input type="checkbox" value="${username}">
                ${username}
            `;
            container.appendChild(label);
        }
    });
}

// Create direct message chat
async function createDirectMessage() {
    const selectedUser = document.getElementById("directMessageUser").value;
    if (!selectedUser) {
        alert("Please select a user");
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/chats/direct`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                creator: currentUser,
                participant: selectedUser
            })
        });
        
        if (!response.ok) {
            throw new Error("Failed to create chat");
        }
        
        const chat = await response.json();
        modals.directMessage.style.display = "none";
        loadUserChats();
        openChat(chat.id);
    } catch (error) {
        alert(error.message);
    }
}

// Create group chat
async function createGroupChat() {
    const name = document.getElementById("groupChatName").value.trim();
    if (!name) {
        alert("Please enter a group name");
        return;
    }
    
    const selectedUsers = Array.from(document.querySelectorAll("#groupChatUsers input:checked"))
        .map(checkbox => checkbox.value);
        
    if (selectedUsers.length === 0) {
        alert("Please select at least one user");
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/chats/group`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                creator: currentUser,
                name: name,
                participants: selectedUsers
            })
        });
        
        if (!response.ok) {
            throw new Error("Failed to create group chat");
        }
        
        const chat = await response.json();
        modals.groupChat.style.display = "none";
        document.getElementById("groupChatName").value = "";
        loadUserChats();
        openChat(chat.id);
    } catch (error) {
        alert(error.message);
    }
}

// Add function to handle chat renaming
async function renameChat(chatId) {
    const newName = prompt("Enter new name for the chat:");
    if (!newName) return;

    try {
        const response = await fetch(`${API_URL}/chats/${chatId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: newName,
                username: currentUser
            })
        });

        if (!response.ok) {
            throw new Error("Failed to rename chat");
        }

        // Reload chat list
        loadUserChats();
        // If this is the current chat, update the header
        if (currentChat === chatId) {
            document.getElementById("chatName").innerText = newName;
        }
    } catch (error) {
        alert(error.message);
    }
}

// Add function to handle chat deletion
async function deleteChat(chatId) {
    if (!confirm("Are you sure you want to delete this chat? This action cannot be undone.")) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/chats/${chatId}?username=${currentUser}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            throw new Error("Failed to delete chat");
        }

        // If this was the current chat, clear it
        if (currentChat === chatId) {
            currentChat = null;
            document.getElementById("messageHistory").innerHTML = "";
            document.getElementById("chatName").innerText = "Chat Name";
        }

        // Reload chat list
        loadUserChats();
    } catch (error) {
        alert(error.message);
    }
}

// Modified openChat function
async function openChat(chatId) {
    currentChat = chatId;

    const response = await fetch(`${API_URL}/messages/${chatId}?username=${currentUser}`);
    if (!response.ok) {
        alert("Access denied to this chat");
        return;
    }

    const messages = await response.json();
    document.getElementById("messageHistory").innerHTML = "";
    messages.forEach(msg => displayMessage(msg));

    const chatResponse = await fetch(`${API_URL}/chats/${currentUser}`);
    const chats = await chatResponse.json();
    const chatsArray = Array.isArray(chats) ? chats : Object.values(chats);
    const chat = chatsArray.find(c => c.id === chatId);

    if (chat) {
        const chatName = chat.type === "direct"
            ? chat.participants.filter(p => p !== currentUser).join(", ")
            : chat.name;

        document.querySelector('.chat-header').innerHTML = `
            <div class="chat-header-content">
                <h2 id="chatName">${chatName}</h2>
                ${isCurrentUserAdmin ? `
                    <div class="chat-actions">
                        <button id="headerMenuBtn" class="chat-menu-btn">⋮</button>
                        <div id="headerDropdown" class="chat-dropdown">
                            <button onclick="renameChat('${chat.id}')">Rename Channel</button>
                            <button onclick="deleteChat('${chat.id}')">Delete Channel</button>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        // Dropdown logic
        if (isCurrentUserAdmin) {
            const headerMenuBtn = document.getElementById('headerMenuBtn');
            const headerDropdown = document.getElementById('headerDropdown');

            headerMenuBtn.onclick = (e) => {
                e.stopPropagation();
                headerDropdown.style.display = headerDropdown.style.display === 'block' ? 'none' : 'block';
            };

            document.addEventListener('click', () => {
                headerDropdown.style.display = 'none';
            });
        }
    } else {
        alert("Chat details not found");
    }
}

// Modified sendMessage function
async function sendMessage() {
    if (!currentChat) {
        alert("Please select a chat first");
        return;
    }
    
    const input = document.getElementById("messageInput");
    const text = input.value.trim();
    if (!text) return;

    const message = {
        chatId: currentChat,
        sender: currentUser,
        text,
        replyTo: replyingTo ? { sender: replyingTo.sender, text: replyingTo.text } : null
    };

    try {
        const response = await fetch(`${API_URL}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(message)
        });
        
        if (!response.ok) {
            throw new Error("Failed to send message");
        }
        
        const sentMessage = await response.json();
        displayMessage(sentMessage);
        input.value = "";
        replyingTo = null;
        document.getElementById("replyContainer").style.display = "none";
    } catch (error) {
        alert(error.message);
    }
}

function displayMessage(msg) {
    const messageBox = document.createElement("div");
    messageBox.className = `message ${msg.sender === currentUser ? "sent" : "received"}`;

    const messageContent = document.createElement("div");
    messageContent.className = "message-content";

    if (msg.replyTo) {
        const replyPreview = document.createElement("div");
        replyPreview.className = "reply-preview";
        replyPreview.innerHTML = `<strong>Replying to:</strong> ${msg.replyTo.text}`;
        messageContent.appendChild(replyPreview);
    }

    const senderName = document.createElement("div");
    senderName.className = "sender-name";
    senderName.textContent = msg.sender;
    messageContent.appendChild(senderName);

    const textElement = document.createElement("div");
    textElement.innerHTML = msg.text;
    messageContent.appendChild(textElement);

    messageBox.appendChild(messageContent);

    const buttonContainer = document.createElement("div");
    buttonContainer.className = "message-buttons";

    if (isCurrentUserAdmin) {
        const deleteBtn = document.createElement("button");
        deleteBtn.innerText = "Delete";
        deleteBtn.className = "delete-msg-btn";
        deleteBtn.onclick = () => deleteMessage(msg.timestamp);
        buttonContainer.appendChild(deleteBtn);
    }

    if (msg.sender !== currentUser) {
        const replyBtn = document.createElement("button");
        replyBtn.innerText = "Reply";
        replyBtn.className = "reply-btn";
        replyBtn.onclick = () => setReply(msg);
        buttonContainer.appendChild(replyBtn);
    }

    messageBox.appendChild(buttonContainer);
    document.getElementById("messageHistory").appendChild(messageBox);
}


async function deleteMessage(timestamp) {
    if (!confirm("Are you sure you want to delete this message?")) return;

    try {
        const response = await fetch(`${API_URL}/messages/${currentChat}/${timestamp}?username=${currentUser}`, {
            method: "DELETE"
        });

        if (!response.ok) throw new Error("Failed to delete message");

        // Reload chat to update UI
        openChat(currentChat);
    } catch (error) {
        alert(error.message);
    }
}



function setReply(msg) {
    replyingTo = msg;
    document.getElementById("replyingToText").innerText = `Replying to: ${msg.text}`;
    document.getElementById("replyContainer").style.display = "block";
}

function cancelReply() {
    replyingTo = null;
    document.getElementById("replyContainer").style.display = "none";
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

// Modify the registerUser function to close the modal after successful registration

/*
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
    */

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
    
/*
    const userSelector = document.getElementById("userSelector");
    userSelector.innerHTML = ""; // Clear existing options
    
    Object.keys(users).forEach(username => {
        const option = document.createElement("option");
        option.value = username;
        option.textContent = username;
        userSelector.appendChild(option);
    });
*/

    // Also load the contact selector
    await loadContactSelector();
}

// Load users when page loads
loadUsers();

//display user details
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
        document.getElementById("profilePicture").src =
        user.profilePicture ? `${API_URL}${user.profilePicture}?t=${Date.now()}` : "default-avatar.png";

        
        const isOwnProfile = username === currentUser;

        document.querySelector('button[onclick*="uploadProfilePic"]').style.display = isOwnProfile ? "inline-block" : "none";
        document.getElementById("resetProfilePicBtn").style.display = isOwnProfile ? "inline-block" : "none";
        document.getElementById("editUserBtn").style.display = isOwnProfile ? "block" : "none";

        const roleContainer = document.getElementById("userDetails");

        // to prevent any buttons from adding each time selectinf diff user
        const oldBtn = document.getElementById("changeRoleBtn");
        if (oldBtn) oldBtn.remove();

        const oldBtn2 = document.getElementById("dltBtn");
        if (oldBtn2) oldBtn2.remove();

        // Change Role btn for admin
        if (isCurrentUserAdmin && username !== currentUser) {
            
            const btn = document.createElement("button");
            btn.id = "changeRoleBtn";
            btn.textContent = user.role === "admin" ? "Set as User" : "Set as Admin";
            btn.onclick = () => changeUserRole(username, user.role === "admin" ? "user" : "admin");
            roleContainer.appendChild(btn);

            const deleteBtn = document.createElement("button");
            deleteBtn.id = "dltBtn";
            deleteBtn.textContent = "Delete User";
            deleteBtn.onclick = () => deleteUser(username);
            roleContainer.appendChild(deleteBtn);
        }
    }
}

//add pfp
document.getElementById("uploadProfilePic").addEventListener("change", async function () {
    const file = this.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profilePicture", file);

    const response = await fetch(`${API_URL}/users/${currentUser}/upload-profile-picture`, {
        method: "POST",
        body: formData
    });

    if (!response.ok) {
        alert("Failed to upload profile picture");
        return;
    }

    const data = await response.json();
    document.getElementById("profilePicture").src = data.imageUrl;
});

document.getElementById("resetProfilePicBtn").addEventListener("click", async function () {

    const response = await fetch(`${API_URL}/users/${currentUser}/reset-profile-picture`, {
        method: "POST"
    })

    if (!response.ok) {
        alert("Failed to reset profile picture");
        return;
    }

    // Reset the image in the UI
    document.getElementById("profilePicture").src = "default-avatar.png";

    // Optionally re-fetch user data to stay in sync
    await displayUserDetails(currentUser);
});




// Add event listener for Enter key in message input
document.getElementById("messageInput").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault(); // Prevent default to avoid new line
        sendMessage();
    }
});

// Call displayUserDetails when the page loads
window.addEventListener('load', async () => {
    await loadUsers();
    await checkAdminStatus();
    await loadUserChats();
    await displayUserDetails(currentUser);
    document.getElementById("currentUser").innerText = currentUser;
//  document.getElementById("userSelector").value = currentUser;

});

document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("username"); // Clear login info
    window.location.href = "login.html"; // Redirect to login
});

async function changeUserRole(targetUser, newRole) {
    try {
        const response = await fetch(`${API_URL}/users/${targetUser}/role`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                role: newRole,
                requestingUser: currentUser
            })
        });

        if (!response.ok) throw new Error("Failed to change user role");

        //alert(`User role changed to ${newRole}`);
        await displayUserDetails(targetUser);
        await loadUsers();
    } catch (error) {
        alert(error.message);
    }
}
async function deleteUser(username) {
    if (!confirm(`Are you sure you want to delete user '${username}'? This will remove all their data.`)) return;

    try {
        const response = await fetch(`${API_URL}/users/${username}?requestingUser=${currentUser}`, {
            method: "DELETE"
        });

        if (!response.ok) throw new Error("Failed to delete user");

        alert(`User '${username}' deleted successfully`);
        await loadUsers();
        document.getElementById("contactInfo").style.display = "none";
        loadUserChats(); //refresh chhats
    } catch (error) {
        alert(error.message);
    }
}

// Edit modal reference
const editUserModal = document.getElementById("editUserModal");
const closeEditModal = document.getElementById("closeEditModal");

document.getElementById("editUserBtn").addEventListener("click", () => {
    const username = document.getElementById("detailUsername").textContent;
    const email = document.getElementById("detailEmail").textContent;
    const phone = document.getElementById("detailPhone").textContent;

    document.getElementById("editUsername").value = username;
    document.getElementById("editEmail").value = email !== "-" ? email : "";
    document.getElementById("editPhone").value = phone !== "-" ? phone : "";

    editUserModal.style.display = "block";
});

closeEditModal.onclick = () => {
    editUserModal.style.display = "none";
};

window.addEventListener("click", (e) => {
    if (e.target === editUserModal) editUserModal.style.display = "none";
});

document.getElementById("saveUserChanges").addEventListener("click", async () => {
    const originalUsername = document.getElementById("detailUsername").textContent;
    const newUsername = document.getElementById("editUsername").value.trim();
    const newEmail = document.getElementById("editEmail").value.trim();
    const newPhone = document.getElementById("editPhone").value.trim();

    if (!newUsername || !newEmail || !newPhone) {
        alert("All fields are required");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/users/${originalUsername}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                newUsername,
                email: newEmail,
                phoneNumber: newPhone,
                requestingUser: currentUser
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to update user");
        }

        const msg = document.getElementById("editUserMessage");
            msg.style.color = "green";
            msg.textContent = "User updated successfully!";
            await loadUsers();
            await displayUserDetails(newUsername);

    } catch (error) {
        msg.style.color = "darkred";
        msg.textContent = error.message;
    }
});


