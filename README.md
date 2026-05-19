# 🌟 **SyntX-26: Revolutionizing Education with AI** 🌟

Welcome to **SyntX-26**, an advanced AI-powered educational platform designed to transform the way students learn and educators teach. Built with cutting-edge technologies, SyntX-26 offers personalized, efficient, and scalable tools to enhance the learning experience.

---

## 🚀 **Project Highlights**

- **Hackathon Theme**: Leveraging AI to solve real-world educational challenges.
- **Core Focus**: Study planning, flashcards, quizzes, past paper analysis, and subject management.
- **Live Demo**: [Explore the platform here!](http://136.243.35.104:3000/)
- **Team Vision**: Empower learners with intelligent tools for success.

---

## 🧠 **Core Functionalities**

### 🔹 **Backend Intelligence**

- **Dynamic Agents**:
  - 📄 **Document Agent**: Extracts insights from uploaded documents.
  - 🖼️ **Image Agent**: Processes images for educational content.
  - 🃏 **Flashcard Agent**: Creates flashcards using AI analysis.
  - ❓ **Quiz Agent**: Generates personalized quizzes.
  - 📑 **Past Paper Agent**: Analyzes past papers for practice questions.
- **AI-Powered Features**:
  - **Embeddings**: Converts text into vectors for similarity search.
  - **LLM Integration**: Provides intelligent, natural language responses.
  - **Vector Store**: Enables fast and efficient data retrieval.
- **Robust APIs**: Secure and scalable RESTful APIs for seamless communication.

### 🔹 **Frontend Excellence**

- **Interactive Study Planner**: Manage tasks, track progress, and stay organized.
- **Flashcards & Quizzes**: Intuitive interfaces for learning and self-assessment.
- **Responsive Design**: Accessible across all devices.
- **Real-Time Updates**: Instant synchronization with backend APIs.

---

## 🏗️ **System Architecture**

### **Modular Design**

- **Frontend**: Built with modern JavaScript frameworks (React).
- **Backend**: Python-based Flask application with modular components.
- **Database**: Relational database (MySQL) with optimized queries.
- **AI Integration**: Pre-trained and fine-tuned models for domain-specific tasks.


### **Workflow**

1. **User Interaction**: Frontend captures user input.
2. **API Requests**: Backend processes requests and interacts with the database.
3. **AI Processing**: AI components handle tasks like embedding generation and document analysis.
4. **Data Delivery**: Processed data is sent back to the frontend for display.
5. **Background Tasks**: Asynchronous processing for heavy computations.

---

## 📊 **Database Schema**

| **Table**       | **Description**                                                                 |
|------------------|---------------------------------------------------------------------------------|
| **Users**        | Stores user credentials and metadata.                                           |
| **Flashcards**   | Links to users and contains flashcard content.                                  |
| **Quizzes**      | Stores quiz questions, results, and user scores.                                |
| **Past Papers**  | Stores uploaded documents and analysis results.                                 |
| **Study Plans**  | Tracks user tasks, progress, and schedules.                                     |

---

## 🌐 **API Endpoints**

### **Authentication**

- `POST /auth/register`: Register a new user.
- `POST /auth/login`: Authenticate user and return a JWT token.
- `POST /auth/forgot-password`: Request a password reset email.
- `POST /auth/reset-password/{token}`: Reset user password.
- `GET /auth/getuserid?mongo_id={mongoId}`: Retrieve SQL user ID from MongoDB ID.
- `PUT /auth/profile`: Update user profile.

### **Chat**

- `POST /chat/message`: Send a chat message. Supports new and existing chat sessions.

### **Flashcards**

- `GET /flashcards/decks`: Retrieve all flashcard decks.
- `POST /flashcards/decks`: Create a new flashcard deck.
- `DELETE /flashcards/decks/{id}`: Delete a flashcard deck.
- `GET /flashcards/decks/{deckId}/cards`: Retrieve all cards in a deck.
- `POST /flashcards/decks/{deckId}/cards`: Add a new card to a deck.
- `DELETE /flashcards/cards/{id}`: Delete a flashcard.
- `POST /flashcards/cards/{id}/review`: Review a flashcard with a rating.
- `GET /flashcards/stats`: Retrieve flashcard statistics.
- `POST /flashcards/generate`: Generate flashcards using AI.

### **Past Papers**

- `POST /pastpapers/analyze`: Analyze uploaded past papers.
- `GET /pastpapers/analyses`: Retrieve all past paper analyses.
- `GET /pastpapers/analyses/{id}`: Retrieve details of a specific past paper analysis.

### **Quizzes**

- `POST /quiz/generate`: Generate a new quiz.
- `POST /quiz/submit`: Submit quiz answers.

### **Study Planner**

- `GET /studyplanner/deadlines`: Retrieve all deadlines.
- `POST /studyplanner/deadlines`: Add a new deadline.
- `PUT /studyplanner/deadlines/{id}`: Update an existing deadline.
- `DELETE /studyplanner/deadlines/{id}`: Delete a deadline.
- `GET /studyplanner/sessions`: Retrieve all study sessions.
- `POST /studyplanner/sessions`: Add a new study session.

### **Subjects**

- `POST /subjects`: Add a new subject.
- `GET /subjects`: Retrieve all subjects for the user.
- `POST /subjects/{subject_id}/documents`: Upload documents to a subject.
- `GET /subjects/with-documents`: Retrieve subjects with document names.

---

## 🛠️ **Agent Management and Workflow**

### **Agent Orchestration**
The system employs a modular approach to manage agents, where specialized agents handle specific tasks. These agents are coordinated by orchestrators, which ensure seamless integration and execution of workflows.

#### **Key Orchestrators**
- **Document and Image Orchestrator**:
  - Routes files to appropriate agents (e.g., DocumentAgent, ImageAgent).
  - Extracts text from files and indexes them into FAISS for efficient retrieval.
  - Handles supported file types like PDFs, images, and text files.

- **Flashcard Orchestrator**:
  - Generates flashcards sequentially using AI models.
  - Writes progress to JSON files for real-time updates.
  - Ensures each flashcard uses a unique embedding context from the subject FAISS index.

- **Past Paper Orchestrator**:
  - Extracts text from past paper documents.
  - Analyzes content to predict exam questions and generate insights.
  - Combines multiple documents for comprehensive analysis.

- **Quiz Orchestrator**:
  - Coordinates the generation of quiz questions and answers.
  - Utilizes multiple agents for correct and incorrect answer generation.
  - Saves progress after each question to ensure reliability.

- **Subject Orchestrator**:
  - Extracts and chunks text from subject-related documents.
  - Indexes content into a per-subject FAISS store for efficient retrieval.

### **Workflow Management**
The system’s workflows are designed to ensure scalability, modularity, and efficiency. Each workflow is structured to handle specific user interactions and backend processes.

#### **General Workflow**
1. **User Interaction**:
   - Users interact with the frontend to upload files, generate flashcards, or take quizzes.
2. **Request Handling**:
   - The frontend sends API requests to the backend.
3. **Agent Invocation**:
   - Orchestrators route tasks to the appropriate agents based on the request type.
4. **AI Processing**:
   - AI components process the data, such as generating embeddings, analyzing documents, or creating questions.
5. **Data Storage**:
   - Results are stored in the database or FAISS index for future retrieval.
6. **Response Delivery**:
   - Processed data is sent back to the frontend for display or further interaction.

#### **Example: Flashcard Generation Workflow**
1. **Input**: User uploads a document and requests flashcard generation.
2. **Orchestration**: The Flashcard Orchestrator extracts text, chunks it, and invokes the Flashcard Agent.
3. **AI Processing**: The agent generates flashcards using embeddings and LLMs.
4. **Progress Tracking**: Progress is written to a JSON file for real-time updates.
5. **Output**: Generated flashcards are returned to the user.

#### **Example: Quiz Generation Workflow**
1. **Input**: User selects a subject and specifies quiz parameters (e.g., difficulty, number of questions).
2. **Orchestration**: The Quiz Orchestrator coordinates agents for question and answer generation.
3. **AI Processing**: Correct and incorrect answers are generated using LLMs.
4. **Progress Tracking**: Progress is saved after each question.
5. **Output**: The completed quiz is returned to the user.

---

## 🌟 **Live Demo**

🎉 **Experience the platform in action!** [Click here to explore SyntX-26](http://136.243.35.104:3000/)

---

## 👩‍💻 **Meet the Team**

- **Team SyntX-26**: A passionate group of developers, AI researchers, and educators dedicated to building innovative solutions for education.

---

## 🔮 **Future Enhancements**

- **AI Advancements**:
  - Integration with Ollama Model for advanced natural language understanding.
  - Adaptive learning algorithms for personalized education.
- **Feature Expansion**:
  - Collaborative study groups.
  - Gamification elements to boost engagement.


---

## 🏆 **Why SyntX-26 Stands Out**

- **Innovation**: Combines AI with education to create a unique learning experience.
- **Scalability**: Designed to handle thousands of users seamlessly.
- **User-Centric Design**: Focused on delivering value to learners and educators.
- **Hackathon Ready**: Built with precision, creativity, and a vision for the future.

---

Thank you for exploring **SyntX-26**! We hope to inspire and empower learners worldwide. 🌍