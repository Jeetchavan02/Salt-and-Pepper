# Salt and Pepper Password Protection Technique

This project is a complete, full-stack demonstration of the **Salt and Pepper Password Protection Technique** for Cryptography & System Security (Exp-7-CSS).

It demonstrates how a backend server securely handles user passwords by applying both a unique **Salt** (stored in the database) and a secret **Pepper** (stored only on the server) before cryptographically hashing the result.

## 🧠 Backend Thought Process & Architecture

The core philosophy of this implementation is that **the database should never contain enough information to compromise a password**, even if it is completely stolen by an attacker. 

To achieve this, the backend separates the cryptographic variables:
1. **The Password**: Exists only in the user's mind (and temporarily in memory during login).
2. **The Salt**: A uniquely generated random value stored in the database alongside the hash. This prevents "rainbow table" attacks and ensures that two users with the identical password will have completely different hashes.
3. **The Pepper**: A global, server-side secret key (loaded via `.env`). It is **never** stored in the database. If an attacker steals the database, they still cannot crack the hashes because they do not have the server's pepper.

---

## 📝 Step-by-Step Flow (Matching the Lab Diagram)

Here is the exact step-by-step algorithm executed by the Node.js / Express backend.

### 🟢 REGISTRATION PHASE

When a user submits the registration form, the backend executes the following thought process:

**Step 1. Receive Password**
* Action: The backend receives the plaintext password securely via HTTPS.
* Rule: *Never write this plaintext password to the database or logs.*

**Step 2. Generate Random Salt**
* Action: The backend generates a cryptographically secure 16-byte random salt unique to this specific user.
* Code: `crypto.randomBytes(16).toString("hex")`

**Step 3. Retrieve Server Pepper**
* Action: The backend loads the secret pepper key from the environment variables.
* Code: `process.env.PEPPER`
* Rule: *Never store this value in the database.*

**Step 4. Combine Variables**
* Action: The backend concatenates the three elements together.
* Result: `Password` + `Salt` + `Pepper`

**Step 5. Apply Hash Function**
* Action: The backend passes the combined string into a strong, slow hashing algorithm (in this project, we use **scrypt**).
* Result: An unreadable, fixed-length cryptographic hash.

**Step 6. Store in Database**
* Action: The backend saves the user record to MongoDB.
* **STORED:** Hashed Password, Salt, Username, Email
* **NOT STORED:** Plaintext Password, Pepper

---

### 🔵 LOGIN PHASE

When a user attempts to log in, the backend executes the following thought process:

**Step 1. Receive Password**
* Action: The backend receives the plaintext login attempt.

**Step 2. Retrieve Stored Salt**
* Action: The backend queries the database for the user's email and retrieves the **existing salt** generated during their registration.
* Rule: *Do not generate a new salt during login.*

**Step 3. Retrieve Server Pepper**
* Action: The backend loads the secret pepper key from the environment variables again.

**Step 4. Combine Variables**
* Action: The backend concatenates the elements exactly as it did during registration.
* Result: `Entered Password` + `Stored Salt` + `Pepper`

**Step 5. Apply Hash Function**
* Action: The backend applies the exact same **scrypt** hashing algorithm to the combined string.
* Result: A newly generated Hash.

**Step 6. Compare with Stored Hash**
* Action: The backend retrieves the original `passwordHash` from the database and compares it to the newly generated hash.
* Code: `crypto.timingSafeEqual()` (to prevent timing attacks).

**Step 7. Match / Not Match**
* **If Match:** The entered password was correct. Access Granted.
* **If Not Match:** The entered password was wrong. Access Denied.

---

## 🚀 How to Run the Project

### 1. Start the Database
Ensure MongoDB is running on your machine:
```bash
brew services start mongodb-community
```

### 2. Start the Backend
```bash
cd backend
npm install

# Create the environment file and add a long, random secret for the PEPPER
cp .env.example .env

# Start the server (runs on port 5001)
npm run dev
```

### 3. Start the Frontend
```bash
cd frontend
npm install

# Start the React app (runs on port 5173)
npm run dev
```

### 4. View the App
Open your browser to: **http://localhost:5173**

You can test the exact flow detailed above by navigating to the **Hash Cases Demo** page (linked at the bottom of the app) to see the backend computations happen in real-time.
