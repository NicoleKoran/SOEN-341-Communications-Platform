# SOEN-341-Communications-Platform

**Objective**
Develop a versatile communication platform that enables seamless collaboration for group discussions and private messaging.

**Project Description**
This dynamic communication platform streamlines interactions through text channels and direct messaging. Designed for collaborative use, it features the ability to create dedicated channels for specific topics, media sharing, privacy configurations, and more. Its intuitive and customizable interface enhances the user experience, making the platform an efficient communication system for both professional and personal use.

**Team Members**
- Robert Mounsef | 40279248 | RobertMounsef
- Tala Khraim | 40276410 | talakhraim
- Noah Afriat | 40276193 | noahafriat
- Nicole Koran | 40281430 | NicoleKoran
- Justin Tran | 40281429 | justinTran26
- Abdul Rehman | 40279024 |  Abdul-RehmanCU
- Andrii Branytskyi | 40251093 | AndriiBranytskyi

## Tech Stack

### Frontend:
- **HTML** - Defines the structure of the web application.
- **CSS** - Handles styling and layout.
- **JavaScript** - Manages client-side interactions and API calls.

### Backend:
- **Node.js** - Runs the backend server.
- **Express.js** - Handles HTTP requests and routing.
- **CORS** - Enables cross-origin resource sharing.
- **File System (`fs`)** - Reads and writes JSON-based databases.

### Database:
- **JSON-based storage**:
  - `users.json` - Stores user data.
  - `database.json` - Stores chat messages.

### APIs & Communication:
- **REST API** (Implemented using Express.js):
  - `/users` - Manages user registration and retrieval.
  - `/messages` - Handles chat messaging and retrieval.

### Development Tools & Setup:
- **GitHub** - Version control and collaboration.
- **Local development server** - Runs on `localhost:7777`.

## Step-by-Step Launch Guide
1. Download the Project
Clone the GitHub repository using:
git clone <repository-link>
Or manually download the ZIP file and extract it.

2. Install VS Code
Download and install Visual Studio Code.

3. Open the Project in VS Code
Open VS Code.
Click "File" → "Open Folder" and select the downloaded project folder.

4. Install Node.js (if not installed)
Download and install Node.js (LTS version).
Verify installation by running in the terminal:
node -v 
npm -v

6. Install Dependencies
Open the terminal in VS Code (View → Terminal).
Navigate to the backend folder:
cd backend
Run:
npm install express cors

7. Ensure Required JSON Files Exist

8. Start the Backend Server
Run:
node server.js
If successful, you should see:
Server running on http://localhost:7777

9. Open in Browser
Copy and paste this into your browser:
http://localhost:7777
