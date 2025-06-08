// Stockage des données en local (pour une vraie appli, utiliser une base de données)
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si un profil existe déjà
    checkExistingProfile();
    
    // Gestion du profil
    document.getElementById('saveProfile').addEventListener('click', saveProfile);
    
    // Gestion du chat
    document.getElementById('sendMessage').addEventListener('click', sendMessage);
    document.getElementById('messageInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') sendMessage();
    });
    
    // Gestion des questions
    document.getElementById('postQuestion').addEventListener('click', postQuestion);
});

function checkExistingProfile() {
    const profile = JSON.parse(localStorage.getItem('schoolProfile'));
    
    if (profile) {
        // Afficher le profil existant
        document.getElementById('profileDisplay').style.display = 'block';
        document.querySelector('.profile-form').style.display = 'none';
        
        document.getElementById('displayName').textContent = `${profile.firstname} ${profile.lastname}`;
        document.getElementById('displayStatus').textContent = getStatusText(profile.status);
        
        if (profile.status === 'eleve' && profile.class) {
            document.getElementById('displayClass').textContent = `Classe : ${profile.class}`;
        } else {
            document.getElementById('displayClass').textContent = '';
        }
        
        if (profile.photo) {
            document.getElementById('profilePhoto').src = profile.photo;
        }
        
        // Charger les messages et questions
        loadChatMessages();
        loadQuestions();
    }
}

function getStatusText(status) {
    const statusMap = {
        'eleve': 'Élève',
        'prof': 'Professeur',
        'admin': 'Administration',
        'autre': 'Autre'
    };
    return statusMap[status] || '';
}

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
    
    const profile = {
        lastname,
        firstname,
        status,
        class: classValue
    };
    
    // Gestion de la photo
    if (photoFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            profile.photo = e.target.result;
            localStorage.setItem('schoolProfile', JSON.stringify(profile));
            checkExistingProfile();
        };
        reader.readAsDataURL(photoFile);
    } else {
        localStorage.setItem('schoolProfile', JSON.stringify(profile));
        checkExistingProfile();
    }
}

function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    const profile = JSON.parse(localStorage.getItem('schoolProfile'));
    if (!profile) {
        alert('Veuvez créer un profil avant d\'envoyer un message');
        return;
    }
    
    const chatMessage = {
        sender: `${profile.firstname} ${profile.lastname}`,
        senderStatus: profile.status,
        text: message,
        timestamp: new Date().toLocaleTimeString()
    };
    
    // Récupérer les messages existants ou créer un nouveau tableau
    let messages = JSON.parse(localStorage.getItem('chatMessages')) || [];
    messages.push(chatMessage);
    localStorage.setItem('chatMessages', JSON.stringify(messages));
    
    // Ajouter le message à l'affichage
    addMessageToDisplay(chatMessage);
    
    // Effacer le champ de saisie
    messageInput.value = '';
}

function loadChatMessages() {
    const messages = JSON.parse(localStorage.getItem('chatMessages')) || [];
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = '';
    
    messages.forEach(message => {
        addMessageToDisplay(message);
    });
}

function addMessageToDisplay(message) {
    const chatMessages = document.getElementById('chatMessages');
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    
    const senderClass = message.senderStatus === 'prof' ? 'prof-message' : 
                       message.senderStatus === 'admin' ? 'admin-message' : 'eleve-message';
    
    messageElement.innerHTML = `
        <strong class="${senderClass}">${message.sender}</strong> 
        <span class="message-time">(${message.timestamp})</span>: 
        ${message.text}
    `;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function postQuestion() {
    const questionInput = document.getElementById('questionInput');
    const questionText = questionInput.value.trim();
    
    if (!questionText) return;
    
    const profile = JSON.parse(localStorage.getItem('schoolProfile'));
    if (!profile) {
        alert('Veuvez créer un profil avant de poster une question');
        return;
    }
    
    const question = {
        id: Date.now(),
        author: `${profile.firstname} ${profile.lastname}`,
        authorStatus: profile.status,
        text: questionText,
        timestamp: new Date().toLocaleString(),
        answers: []
    };
    
    // Récupérer les questions existantes ou créer un nouveau tableau
    let questions = JSON.parse(localStorage.getItem('schoolQuestions')) || [];
    questions.push(question);
    localStorage.setItem('schoolQuestions', JSON.stringify(questions));
    
    // Ajouter la question à l'affichage
    addQuestionToDisplay(question);
    
    // Effacer le champ de saisie
    questionInput.value = '';
}

function loadQuestions() {
    const questions = JSON.parse(localStorage.getItem('schoolQuestions')) || [];
    const questionsList = document.getElementById('questionsList');
    questionsList.innerHTML = '';
    
    questions.forEach(question => {
        addQuestionToDisplay(question);
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
                <strong>${answer.author}</strong> (${answer.timestamp}):
                <p>${answer.text}</p>
            </div>
        `).join('');
    }
    
    questionElement.innerHTML = `
        <div>
            <strong>${question.author}</strong> (${question.timestamp}):
            <p>${question.text}</p>
        </div>
        ${answersHTML}
        <div class="answer-form">
            <input type="text" class="answer-input" placeholder="Répondre...">
            <button class="send-answer">Envoyer</button>
        </div>
    `;
    
    questionsList.appendChild(questionElement);
    
    // Ajouter l'événement pour répondre
    questionElement.querySelector('.send-answer').addEventListener('click', function() {
        const answerInput = questionElement.querySelector('.answer-input');
        const answerText = answerInput.value.trim();
        
        if (!answerText) return;
        
        const profile = JSON.parse(localStorage.getItem('schoolProfile'));
        if (!profile) return;
        
        const answer = {
            author: `${profile.firstname} ${profile.lastname}`,
            authorStatus: profile.status,
            text: answerText,
            timestamp: new Date().toLocaleString()
        };
        
        // Mettre à jour les questions dans le localStorage
        let questions = JSON.parse(localStorage.getItem('schoolQuestions'));
        const questionIndex = questions.findIndex(q => q.id === question.id);
        if (questionIndex !== -1) {
            if (!questions[questionIndex].answers) {
                questions[questionIndex].answers = [];
            }
            questions[questionIndex].answers.push(answer);
            localStorage.setItem('schoolQuestions', JSON.stringify(questions));
            
            // Recharger l'affichage
            loadQuestions();
        }
    });
}
