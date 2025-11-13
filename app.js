// =============================
//  CONFIGURAÇÕES GLOBAIS
// =============================
const CONFIG = {
    API_BASE_URL: 'https://quiz-pibid-funcoes.onrender.com',
    SOUND_ENABLED: false,
    TRANSITION_DURATION: 600
};

// =============================
//  ESTADO GLOBAL DA APLICAÇÃO
// =============================
const state = {
    currentScreen: 'welcome',
    player: { name: '', email: '' },
    questions: [],
    currentQuestionIndex: 0,
    quizStarted: false,
    startTime: null,
    questionStartTime: null,
    answers: [],
    hasCompleted: false,
    totalScore: 3.0,
    totalPointsEarned: 0,
    timerInterval: null
};

// =============================
//  ELEMENTOS DOM
// =============================
const elements = {
    screens: {
        welcome: document.getElementById('welcome-screen'),
        tutorial: document.getElementById('tutorial-screen'),
        quiz: document.getElementById('quiz-screen'),
        completion: document.getElementById('completion-screen')
    },
    player: {
        name: document.getElementById('player-name'),
        email: document.getElementById('player-email')
    },
    quiz: {
        currentQuestion: document.getElementById('current-question'),
        totalQuestions: document.getElementById('total-questions'),
        questionText: document.getElementById('question-text'),
        questionContent: document.getElementById('question-content'),
        optionsContainer: document.getElementById('options-container'),
        fillBlankContainer: document.getElementById('fill-blank-container'),
        blankAnswer: document.getElementById('blank-answer'),
        submitButton: document.getElementById('submit-answer'),
        progressFill: document.getElementById('progress-fill'),
        questionType: document.getElementById('question-type'),
        currentPlayer: document.getElementById('current-player'),
        timer: document.getElementById('timer')
    },
    completion: {
        name: document.getElementById('completion-name'),
        total: document.getElementById('completion-total'),
        time: document.getElementById('completion-time')
    },
    buttons: {
        startTutorial: document.getElementById('start-tutorial'),
        startQuiz: document.getElementById('start-quiz'),
        restartQuiz: document.getElementById('restart-quiz')
    }
};

// =============================
//  FUNÇÕES DE TELA CHEIA
// =============================
function enterFullscreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) { /* Safari */
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE11 */
        elem.msRequestFullscreen();
    }
}

function exitFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) { /* Safari */
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { /* IE11 */
        document.msExitFullscreen();
    }
}

// =============================
//  INICIALIZAÇÃO
// =============================
document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
});

async function initializeApp() {
    await loadQuestions();
    setupEventListeners();
    setupQuizProtection();
    checkPreviousAttempt();
}

// =============================
//  EVENTOS PRINCIPAIS
// =============================
function setupEventListeners() {
    elements.buttons.startTutorial.addEventListener('click', startTutorial);
    elements.buttons.startQuiz.addEventListener('click', startQuiz);
    elements.buttons.restartQuiz.addEventListener('click', restartQuiz);
    elements.quiz.submitButton.addEventListener('click', submitAnswer);
    document.addEventListener('keydown', handleKeyboard);
    
    // NOVO: Monitora se o usuário sai do modo tela cheia. Se sair, para o quiz!
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
}

function handleFullscreenChange() {
    // Se o quiz começou E o documento não estiver mais em tela cheia
    if (state.quizStarted && !document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
        if (!state.hasCompleted) {
            console.error('ALERTA DE SEGURANÇA: Usuário saiu do modo tela cheia. Quiz encerrado.');
            // Implemente uma função para penalizar/encerrar o quiz aqui se for crítico
            alert('Atenção: A saída do modo tela cheia encerra o quiz para fins de avaliação.');
            window.location.reload(); // Recarrega a página para reiniciar e bloquear
        }
    }
}

function handleKeyboard(e) {
    if (state.currentScreen === 'quiz' && e.key === 'Enter' && !elements.quiz.submitButton.disabled) {
        submitAnswer();
    }
}

function setupQuizProtection() {
    // 1. Bloqueia menu de contexto (botão direito)
    document.addEventListener('contextmenu', e => {
        if (state.quizStarted) e.preventDefault();
    });
    // 2. Bloqueia cópia (Ctrl+C)
    document.addEventListener('copy', e => {
        if (state.quizStarted) e.preventDefault();
    });
    
    // 3. Bloqueia navegação para outras páginas (popup de aviso ao tentar sair/fechar)
    window.addEventListener('beforeunload', e => {
        if (state.quizStarted && !state.hasCompleted) {
            e.preventDefault();
            e.returnValue = 'Você tem certeza que deseja sair? Seu progresso será perdido.';
            return e.returnValue;
        }
    });
    
    // 4. Bloqueia teclas de atalho comuns que abrem novas abas/janelas (Ctrl+T, Ctrl+N, Ctrl+W)
    document.addEventListener('keydown', e => {
        if (state.quizStarted && !state.hasCompleted) {
            if ((e.ctrlKey || e.metaKey)) {
                // Bloquear Ctrl+T, Ctrl+N, Ctrl+W, Ctrl+R (recarregar)
                if (e.key === 't' || e.key === 'n' || e.key === 'w' || e.key === 'r') { 
                    e.preventDefault();
                    console.warn('Navegação bloqueada durante o quiz.'); 
                }
            }
        }
    });
}

// =============================
//  BLOQUEIO DE REFAZER QUIZ
// =============================
function checkPreviousAttempt() {
    const completed = localStorage.getItem('quizCompleted');
    const studentEmail = localStorage.getItem('studentEmail');
    if (completed === 'true' && studentEmail) {
        state.hasCompleted = true;
        showAlreadyCompletedMessage(studentEmail);
    }
}

function showAlreadyCompletedMessage(email) {
    const welcomeScreen = elements.screens.welcome;
    welcomeScreen.innerHTML = `
        <div class="header">
            <h1 class="title-glitch">QUIZ CONCLUÍDO</h1>
            <div class="subtitle">Funções da Linguagem</div>
        </div>
        <div class="theme-card" style="border-color: var(--accent);">
            <div class="theme-icon">✅</div>
            <h3>Quiz Já Realizado</h3>
            <p>O e-mail <strong>${email}</strong> já completou este quiz.</p>
            <p style="color: var(--accent); margin-top: 1rem;">Cada aluno pode fazer o quiz apenas uma vez.</p>
        </div>
    `;
}

// =============================
//  CARREGAMENTO DAS QUESTÕES
// =============================
async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        const data = await response.json();

        // Implementa o embaralhamento para garantir a aleatoriedade na ordem inicial
        const shuffledQuestions = [...data.questions].sort(() => Math.random() - 0.5);
        state.questions = shuffledQuestions;

        elements.quiz.totalQuestions.textContent = state.questions.length;
        state.totalScore = data.total_score || 3.0;
    } catch (error) {
        console.error('Erro ao carregar questões:', error);
    }
}

// =============================
//  TIMER
// =============================
function startTimer() {
    let seconds = 0;
    state.timerInterval = setInterval(() => {
        seconds++;
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        elements.quiz.timer.textContent = `${mins}:${secs}`;
    }, 1000);
}

function stopTimer() {
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
    }
}

function resetTimer() {
    stopTimer();
    elements.quiz.timer.textContent = '00:00';
}

// =============================
//  TELAS E FLUXO
// =============================
function showScreen(screenName) {
    Object.values(elements.screens).forEach(s => s.classList.remove('active'));
    elements.screens[screenName].classList.add('active', 'fade-in');
    state.currentScreen = screenName;
}

function startTutorial() {
    if (state.hasCompleted) return console.warn('Usuário já completou o quiz. Acesso bloqueado.');
    const name = elements.player.name.value.trim();
    const email = elements.player.email.value.trim();
    if (!name || !email) return console.warn('Preencha seu nome e e-mail.');
    if (!email.includes('@')) return console.warn('Digite um e-mail válido.');
    state.player.name = name;
    state.player.email = email;
    showScreen('tutorial');
    startTutorialAnimation();
}

function startTutorialAnimation() {
    const steps = document.querySelectorAll('.step');
    let currentStep = 0;
    
    // Função para alternar entre os passos
    function cycleSteps() {
        // Remover classe active de todos os passos
        steps.forEach(step => step.classList.remove('active'));
        
        // Adicionar classe active ao passo atual
        steps[currentStep].classList.add('active');
        
        // Avançar para o próximo passo (circular)
        currentStep = (currentStep + 1) % steps.length;
    }
    
    // Iniciar com o primeiro passo ativo
    cycleSteps();
    
    // Alternar a cada 3 segundos
    const tutorialInterval = setInterval(cycleSteps, 3000);
    
    // Limpar o intervalo quando sair do tutorial
    elements.buttons.startQuiz.addEventListener('click', () => {
        clearInterval(tutorialInterval);
    }, { once: true });
}

function startQuiz() {
    if (state.hasCompleted) return console.warn('Quiz já realizado. Acesso bloqueado.');
    state.quizStarted = true;
    state.startTime = new Date();
    state.currentQuestionIndex = 0;
    state.totalPointsEarned = 0;
    elements.quiz.currentPlayer.textContent = state.player.name;
    
    // NOVO: Entra no modo tela cheia para maximizar o bloqueio
    enterFullscreen();

    showScreen('quiz');
    startTimer();
    loadQuestion(0);
}

function restartQuiz() {
    if (state.hasCompleted) return console.warn('Não é possível reiniciar.');
    state.quizStarted = false;
    stopTimer();
    resetTimer();
    exitFullscreen(); // Sai da tela cheia ao reiniciar
    showScreen('welcome');
}

// =============================
//  QUESTÕES
// =============================
function loadQuestion(i) {
    if (i >= state.questions.length) return completeQuiz();
    const q = state.questions[i];
    state.currentQuestionIndex = i;

    const card = document.querySelector('.question-card');
    if (card) {
        card.classList.remove('card-anim-leave');
        void card.offsetWidth;
        card.classList.add('card-anim-enter');
        setTimeout(() => card.classList.remove('card-anim-enter'), 300);
    }

    elements.quiz.currentQuestion.textContent = i + 1;
    elements.quiz.questionText.innerHTML = q.question;
    
    // Exibir contexto se existir
    if (q.context) {
        elements.quiz.questionContent.innerHTML = `<p>${q.context}</p>`;
        elements.quiz.questionContent.style.display = 'block';
    } else {
        elements.quiz.questionContent.style.display = 'none';
    }
    
    elements.quiz.progressFill.style.width = `${((i + 1) / state.questions.length) * 100}%`;
    elements.quiz.optionsContainer.innerHTML = '';
    elements.quiz.fillBlankContainer.innerHTML = '';
    elements.quiz.fillBlankContainer.style.display = 'none';
    elements.quiz.submitButton.disabled = true;
    state.questionStartTime = new Date();

    switch (q.type) {
        case 'multiple_choice': setupMultipleChoice(q); break;
        case 'true_false': setupTrueFalse(q); break;
        case 'fill_blank': setupFillBlankDragDrop(q); break;
        case 'drag_drop': setupDragDrop(q); break;
    }
}

function setupMultipleChoice(q) {
    elements.quiz.questionType.textContent = 'MÚLTIPLA ESCOLHA';
    q.options.forEach(opt => {
        const el = document.createElement('div');
        el.className = 'option';
        el.innerHTML = opt;
        el.addEventListener('click', () => {
            document.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
            el.classList.add('selected');
            elements.quiz.submitButton.disabled = false;
        });
        elements.quiz.optionsContainer.appendChild(el);
    });
}

function setupTrueFalse(q) {
    elements.quiz.questionType.textContent = 'VERDADEIRO OU FALSO';
    ['Verdadeiro', 'Falso'].forEach(opt => {
        const el = document.createElement('div');
        el.className = 'option';
        el.textContent = opt;
        el.addEventListener('click', () => {
            document.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
            el.classList.add('selected');
            elements.quiz.submitButton.disabled = false;
        });
        elements.quiz.optionsContainer.appendChild(el);
    });
}

function setupFillBlankDragDrop(q) {
    elements.quiz.questionType.textContent = 'ARRASTE OU CLIQUE PARA COMPLETAR';
    elements.quiz.fillBlankContainer.style.display = 'block';

    const dropZone = document.createElement('div');
    dropZone.className = 'drop-zone';
    dropZone.textContent = 'Arraste ou clique na resposta';
    dropZone.addEventListener('dragover', e => e.preventDefault());
    dropZone.addEventListener('drop', e => {
        e.preventDefault();
        const data = e.dataTransfer.getData('text');
        dropZone.textContent = data;
        dropZone.dataset.value = data;
        dropZone.classList.add('filled');
        elements.quiz.submitButton.disabled = false;
    });

    const options = document.createElement('div');
    options.className = 'drag-options';
    const opts = q.alternatives && q.alternatives.length >= 3 ? q.alternatives : [q.correct_answer, 'Função Poética', 'Função Fática'];
    opts.sort(() => Math.random() - 0.5);
    opts.forEach(opt => {
        const div = document.createElement('div');
        div.className = 'drag-item';
        div.textContent = opt;
        div.draggable = true;
        
        // Adicionar funcionalidade de clique como alternativa ao arrastar
        div.addEventListener('click', () => {
            dropZone.textContent = opt;
            dropZone.dataset.value = opt;
            dropZone.classList.add('filled');
            elements.quiz.submitButton.disabled = false;
            // Destacar visualmente a opção selecionada
            document.querySelectorAll('.drag-item').forEach(item => item.classList.remove('selected'));
            div.classList.add('selected');
        });
        
        div.addEventListener('dragstart', e => {
            e.dataTransfer.setData('text', opt);
            div.classList.add('dragging');
        });
        div.addEventListener('dragend', e => {
            div.classList.remove('dragging');
        });
        options.appendChild(div);
    });

    elements.quiz.fillBlankContainer.appendChild(dropZone);
    elements.quiz.fillBlankContainer.appendChild(options);
}

function setupDragDrop(q) {
    setupFillBlankDragDrop(q);
}

// =============================
//  ENVIO E TRANSIÇÃO
// =============================
async function submitAnswer() {
    // Desabilitar botão imediatamente para evitar múltiplos cliques
    elements.quiz.submitButton.disabled = true;
    
    const q = state.questions[state.currentQuestionIndex];
    let answer = '';
    
    if (q.type === 'multiple_choice' || q.type === 'true_false') {
        const sel = document.querySelector('.option.selected');
        if (sel) answer = sel.textContent.trim();
    } else if (q.type === 'fill_blank' || q.type === 'drag_drop') {
        const drop = document.querySelector('.drop-zone');
        answer = drop.dataset.value || '';
    }
    
    if (!answer) {
        elements.quiz.submitButton.disabled = false;
        return console.warn('Selecione uma resposta.');
    }

    const correct = answer.toLowerCase().trim() === q.correct_answer.toLowerCase().trim();
    // O valor por questão é 0.2 pontos (3.0 / 15)
    const score = correct ? state.totalScore / state.questions.length : 0;
    state.totalPointsEarned += score;

    await sendResult({
        student_id: `${state.player.name} - ${state.player.email}`,
        question_id: q.id,
        answer,
        correct,
        score,
        start_ts: state.questionStartTime.toISOString(),
        submit_ts: new Date().toISOString(),
        time_spent: Math.floor((new Date() - state.questionStartTime) / 1000)
    });

    const hasNext = state.currentQuestionIndex + 1 < state.questions.length;

    const card = document.querySelector('.question-card');
    if (card) {
        card.classList.remove('card-anim-enter');
        void card.offsetWidth;
        card.classList.add('card-anim-leave');
    }

    if (hasNext) {
        showTransition(() => {
            if (card) card.classList.remove('card-anim-leave');
            loadQuestion(state.currentQuestionIndex + 1);
        });
    } else {
        setTimeout(() => {
            if (card) card.classList.remove('card-anim-leave');
            completeQuiz();
        }, 220);
    }
}

async function sendResult(data) {
    try {
        await fetch(`${CONFIG.API_BASE_URL}/api/results`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    } catch (err) {
        console.error('Erro ao enviar resultado', err);
    }
}

// =============================
//  FINALIZAÇÃO E ENVIO FINAL
// =============================
async function completeQuiz() {
    stopTimer();
    state.hasCompleted = true;
    localStorage.setItem('quizCompleted', 'true');
    localStorage.setItem('studentEmail', state.player.email);

    const totalTime = Math.floor((new Date() - state.startTime) / 1000);
    const mins = Math.floor(totalTime / 60);
    const secs = totalTime % 60;

    elements.completion.name.textContent = state.player.name;
    elements.completion.total.textContent = state.questions.length;
    elements.completion.time.textContent = `${mins}min ${secs}s`;

    // Sai da tela cheia na conclusão
    exitFullscreen();

    // Notifica o backend de que o quiz foi concluído
    try {
        await fetch(`${CONFIG.API_BASE_URL}/api/finish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: state.player.email })
        });
    } catch (err) {
        console.error('Erro ao finalizar quiz', err);
    }

    showScreen('completion');
}

// =============================
//  TRANSIÇÃO ANIMADA
// =============================
function showTransition(callback) {
    const overlay = document.createElement('div');
    overlay.className = 'transition-overlay';
    overlay.innerHTML = `<div class="robot-speech">🤖<br>Vamos para a próxima pergunta!</div>`;
    elements.screens.quiz.appendChild(overlay);
    setTimeout(() => {
        overlay.remove();
        callback();
    }, 900);
}