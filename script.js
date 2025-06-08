// Configuration Firebase (à garder telle quelle)
const firebaseConfig = {
  apiKey: "AIzaSyBkHh32VjRZAWo2uaYIx9QemzYvmIWPz0Q",
  authDomain: "profil-90b26.firebaseapp.com",
  projectId: "profil-90b26",
  storageBucket: "profil-90b26.firebasestorage.app",
  messagingSenderId: "1019493025239",
  appId: "1:1019493025239:web:59bc038a3d4e0d6b3e3792",
  measurementId: "G-8K3RRYYCZ3"
};

// Initialisation Firebase (version simplifiée)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Références aux collections
const messagesRef = db.collection("messages");
const questionsRef = db.collection("questions");

document.addEventListener('DOMContentLoaded', function() {
    checkExistingProfile();
    document.getElementById('saveProfile').addEventListener('click', saveProfile);
    document.getElementById('sendMessage').addEventListener('click', sendMessage);
    document.getElementById('postQuestion').addEventListener('click', postQuestion);
    
    // Écouter les nouveaux messages en temps réel
    loadChatMessages();
    loadQuestions();
});

// [Les fonctions checkExistingProfile, getStatusText et saveProfile restent identiques]

function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    const profile = JSON.parse(localStorage.getItem('schoolProfile'));
    if (!profile) {
        alert('Veuillez créer un profil avant d\'envoyer un message');
        return;
    }
    
    // Ajouter le message à Firestore
    messagesRef.add({
        sender: `${profile.firstname} ${profile.lastname}`,
        senderStatus: profile.status,
        text: message,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        messageInput.value = '';
    }).catch(error => {
        console.error("Erreur d'envoi: ", error);
    });
}

function loadChatMessages() {
    messagesRef
        .orderBy("timestamp")
        .onSnapshot(snapshot => {
            const chatMessages = document.getElementById('chatMessages');
            chatMessages.innerHTML = '';
            
            snapshot.forEach(doc => {
                const message = doc.data();
                addMessageToDisplay(message);
            });
        });
}

function postQuestion() {
    const questionInput = document.getElementById('questionInput');
    const questionText = questionInput.value.trim();
    
    if (!questionText) return;
    
    const profile = JSON.parse(localStorage.getItem('schoolProfile'));
    if (!profile) {
        alert('Veuillez créer un profil avant de poster une question');
        return;
    }
    
    // Ajouter la question à Firestore
    questionsRef.add({
        author: `${profile.firstname} ${profile.lastname}`,
        authorStatus: profile.status,
        text: questionText,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        answers: []
    }).then(() => {
        questionInput.value = '';
    }).catch(error => {
        console.error("Erreur: ", error);
    });
}

function loadQuestions() {
    questionsRef
        .orderBy("timestamp", "desc")
        .onSnapshot(snapshot => {
            const questionsList = document.getElementById('questionsList');
            questionsList.innerHTML = '';
            
            snapshot.forEach(doc => {
                const question = {
                    id: doc.id,
                    ...doc.data()
                };
                addQuestionToDisplay(question);
            });
        });
}

function addQuestionToDisplay(question) {
    const questionsList = document.getElementById('questionsList');
    const questionElement = document.createElement('div');
    questionElement.className = 'question';
    questionElement.dataset.id = question.id;
    
    let answersHTML = '';
    if (question.answers && question.answers.length > 0) {
        answersHTML = question.answers.map(answer => `
            <div class="answer">
                <strong>${answer.author}</strong> (${new Date(answer.timestamp?.toDate()).toLocaleString()}):
                <p>${answer.text}</p>
            </div>
        `).join('');
    }
    
    questionElement.innerHTML = `
        <div>
            <strong>${question.author}</strong> (${new Date(question.timestamp?.toDate()).toLocaleString()}):
            <p>${question.text}</p>
        </div>
        ${answersHTML}
        <div class="answer-form">
            <input type="text" class="answer-input" placeholder="Répondre...">
            <button class="send-answer">Envoyer</button>
        </div>
    `;
    
    questionsList.appendChild(questionElement);
    
    // Gestion des réponses
    questionElement.querySelector('.send-answer').addEventListener('click', function() {
        const answerInput = questionElement.querySelector('.answer-input');
        const answerText = answerInput.value.trim();
        
        if (!answerText) return;
        
        const profile = JSON.parse(localStorage.getItem('schoolProfile'));
        if (!profile) return;
        
        const newAnswer = {
            author: `${profile.firstname} ${profile.lastname}`,
            authorStatus: profile.status,
            text: answerText,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Mettre à jour la question dans Firestore
        questionsRef.doc(question.id).update({
            answers: firebase.firestore.FieldValue.arrayUnion(newAnswer)
        }).then(() => {
            answerInput.value = '';
        }).catch(error => {
            console.error("Erreur: ", error);
        });
    });
}

// [La fonction addMessageToDisplay reste identique]
