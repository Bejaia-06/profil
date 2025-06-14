firebase.firestore().enablePersistence()
  .catch((err) => {
    console.error("Erreur de persistance Firestore:", err);
  });

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

const storage = firebase.storage(); // Initialisation du stockage

db.collection("test").doc("connection").get()
  .then(() => console.log("Connecté à Firestore"))
  .catch(e => console.error("Erreur connexion Firestore:", e));

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

function saveProfile() {
    const lastname = document.getElementById('lastname').value.trim();
    const firstname = document.getElementById('firstname').value.trim();
    const status = document.getElementById('status').value;
    const classValue = document.getElementById('class').value.trim();
    const photoFile = document.getElementById('photo').files[0];

    if (!lastname || !firstname) {
        alert('Veuillez entrer au moins votre nom et prénom');
        return;
    }

    if (photoFile) {
        const storageRef = storage.ref(); // Utilisez la référence storage initialisée
        const fileRef = storageRef.child(`profiles/${Date.now()}_${photoFile.name}`);
        
        fileRef.put(photoFile).then((snapshot) => {
            return snapshot.ref.getDownloadURL();
        }).then((url) => {
            const profile = {
                lastname,
                firstname,
                status,
                class: classValue,
                photo: url
            };
            localStorage.setItem('schoolProfile', JSON.stringify(profile));
            checkExistingProfile(); // Actualiser l'affichage
        }).catch(error => {
            console.error("Erreur upload photo:", error);
            // Sauvegarde sans photo si échec
            saveProfileData(null, lastname, firstname, status, classValue);
        });
    } else {
        saveProfileData(null, lastname, firstname, status, classValue);
    }
}

function saveProfileData(photoUrl, lastname, firstname, status, classValue) {
    const profile = {
        lastname,
        firstname,
        status,
        class: classValue,
        photo: photoUrl || ''
    };
    localStorage.setItem('schoolProfile', JSON.stringify(profile));
    checkExistingProfile();
}

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
function addMessageToDisplay(message) {
    const chatMessages = document.getElementById('chatMessages');
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    
    const senderClass = message.senderStatus === 'prof' ? 'prof-message' : 
                       message.senderStatus === 'admin' ? 'admin-message' : 'eleve-message';
    
    // Gestion des dates Firestore
    const timestamp = message.timestamp?.toDate 
        ? new Date(message.timestamp.toDate()).toLocaleString() 
        : 'Maintenant';

    messageElement.innerHTML = `
        <strong class="${senderClass}">${message.sender}</strong>
        <span class="message-time">(${timestamp})</span>:
        ${message.text}
    `;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
