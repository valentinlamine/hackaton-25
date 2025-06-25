/**
 * ÉcoDécisions - Quiz écologique interactif avancé
 * 20 questions réparties en 5 catégories avec scoring détaillé
 */

// Configuration du jeu
const GAME_CONFIG = {
  totalQuestions: 20,
  questionsPerCategory: 4,
  minScore: -60,
  maxScore: 60,
}

// Variables globales pour les données
let QUIZ_QUESTIONS = []
let CATEGORIES = []

// État du jeu
let gameState = {
  currentQuestion: 0,
  score: 0,
  answers: [],
  categoryScores: {},
  startTime: null,
}

/**
 * Charge les données depuis le fichier JSON
 */
async function loadQuizData() {
  try {
    const response = await fetch("questions.json")
    const data = await response.json()
    QUIZ_QUESTIONS = data.questions
    CATEGORIES = data.categories
    return true
  } catch (error) {
    console.error("Erreur lors du chargement des questions:", error)
    return false
  }
}

/**
 * Mélange un tableau de manière aléatoire (algorithme Fisher-Yates)
 */
function shuffleArray(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Initialisation du jeu
 */
document.addEventListener("DOMContentLoaded", async () => {
  const dataLoaded = await loadQuizData()
  if (dataLoaded) {
    initializeGame()
    setupEventListeners()
  } else {
    alert("Erreur lors du chargement du quiz. Veuillez recharger la page.")
  }
})

/**
 * Configuration des écouteurs d'événements
 */
function setupEventListeners() {
  // Écran d'accueil
  document.getElementById("start-btn").addEventListener("click", startQuiz)
  document.getElementById("rules-btn").addEventListener("click", showRules)
  document.getElementById("close-rules").addEventListener("click", hideRules)

  // Quiz
  document.getElementById("next-btn").addEventListener("click", nextQuestion)

  // Résultats
  document.getElementById("restart-btn").addEventListener("click", restartGame)
  document.getElementById("share-btn").addEventListener("click", shareResults)

  // Modal (clic en dehors pour fermer)
  document.getElementById("rules-modal").addEventListener("click", (e) => {
    if (e.target.id === "rules-modal") {
      hideRules()
    }
  })

  // Gestion du clavier
  document.addEventListener("keydown", handleKeyboard)
}

/**
 * Gestion des événements clavier
 */
function handleKeyboard(event) {
  if (event.key === "Escape") {
    hideRules()
  }
}

/**
 * Initialise l'état du jeu
 */
function initializeGame() {
  gameState = {
    currentQuestion: 0,
    score: 0,
    answers: [],
    categoryScores: {},
    startTime: null,
  }

  // Initialise les scores par catégorie
  CATEGORIES.forEach((category) => {
    gameState.categoryScores[category.id] = {
      score: 0,
      maxScore: GAME_CONFIG.questionsPerCategory * 3,
      minScore: GAME_CONFIG.questionsPerCategory * -3,
    }
  })

  showScreen("welcome-screen")
}

/**
 * Affiche/cache les écrans
 */
function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.remove("active")
  })
  document.getElementById(screenId).classList.add("active")
}

/**
 * Affiche les règles
 */
function showRules() {
  document.getElementById("rules-modal").style.display = "grid"
}

/**
 * Cache les règles
 */
function hideRules() {
  document.getElementById("rules-modal").style.display = "none"
}

/**
 * Démarre le quiz
 */
function startQuiz() {
  gameState.startTime = Date.now()
  showScreen("quiz-screen")
  loadQuestion(0)
}

/**
 * Charge une question
 */
function loadQuestion(questionIndex) {
  const question = QUIZ_QUESTIONS[questionIndex]
  const category = CATEGORIES.find((cat) => cat.id === question.category)

  // Met à jour l'interface
  updateQuizHeader(questionIndex + 1)
  updateEcoGauge()

  // Affiche la question
  document.getElementById("category-badge").textContent = `${category.icon} ${category.name}`
  document.getElementById("question-text").textContent = question.question

  // Génère les choix
  generateChoices(question.choices)

  // Cache le feedback
  document.getElementById("feedback-card").style.display = "none"
  document.getElementById("question-card").style.display = "block"
}

/**
 * Met à jour l'en-tête du quiz
 */
function updateQuizHeader(currentQuestionNumber) {
  const progressPercentage = (currentQuestionNumber / GAME_CONFIG.totalQuestions) * 100

  document.getElementById("question-counter").textContent =
    `Question ${currentQuestionNumber}/${GAME_CONFIG.totalQuestions}`
  document.getElementById("current-score").textContent = `Score: ${gameState.score}`
  document.getElementById("progress-fill").style.width = `${progressPercentage}%`
}

/**
 * Met à jour la jauge écologique
 */
function updateEcoGauge() {
  // Calcule la position sur la jauge (0% = très négatif, 100% = très positif)
  const normalizedScore =
    ((gameState.score - GAME_CONFIG.minScore) / (GAME_CONFIG.maxScore - GAME_CONFIG.minScore)) * 100
  const clampedScore = Math.max(0, Math.min(100, normalizedScore))

  document.getElementById("gauge-fill").style.width = `${clampedScore}%`
  document.getElementById("gauge-indicator").style.left = `${clampedScore}%`
}

/**
 * Génère les choix pour une question
 */
function generateChoices(choices) {
  const container = document.getElementById("choices-container")
  container.innerHTML = ""

  // Mélange les choix pour éviter que les mauvaises réponses soient toujours en premier
  const shuffledChoices = shuffleArray(choices)

  shuffledChoices.forEach((choice, index) => {
    const choiceElement = document.createElement("div")
    choiceElement.className = "choice"
    choiceElement.innerHTML = `<span class="choice-text">${choice.text}</span>`

    choiceElement.addEventListener("click", () => selectChoice(index, choice))
    container.appendChild(choiceElement)
  })
}

/**
 * Gère la sélection d'un choix
 */
function selectChoice(choiceIndex, choice) {
  // Marque le choix sélectionné
  document.querySelectorAll(".choice").forEach((el, index) => {
    el.classList.toggle("selected", index === choiceIndex)
  })

  // Enregistre la réponse
  const currentQuestion = QUIZ_QUESTIONS[gameState.currentQuestion]
  gameState.answers.push({
    questionId: currentQuestion.id,
    category: currentQuestion.category,
    choice: choice,
    points: choice.points,
  })

  // Met à jour les scores
  gameState.score += choice.points
  gameState.categoryScores[currentQuestion.category].score += choice.points

  // Met à jour l'interface
  updateQuizHeader(gameState.currentQuestion + 1)
  updateEcoGauge()

  // Affiche le feedback après un délai
  setTimeout(() => {
    showFeedback(choice.feedback)
  }, 800)
}

/**
 * Affiche le feedback
 */
function showFeedback(feedback) {
  // Détermine l'icône selon le type de feedback
  let icon = "💡"
  if (
    feedback.title.includes("excellent") ||
    feedback.title.includes("parfait") ||
    feedback.title.includes("exemplaire")
  ) {
    icon = "🌟"
  } else if (feedback.title.includes("bon") || feedback.title.includes("bonne")) {
    icon = "👍"
  } else if (
    feedback.title.includes("élevé") ||
    feedback.title.includes("important") ||
    feedback.title.includes("majeur")
  ) {
    icon = "⚠️"
  }

  document.getElementById("feedback-icon").textContent = icon
  document.getElementById("feedback-title").textContent = feedback.title
  document.getElementById("feedback-fact").textContent = feedback.fact

  // Affiche le feedback
  document.getElementById("question-card").style.display = "none"
  document.getElementById("feedback-card").style.display = "block"

  // Scroll vers le feedback
  document.getElementById("feedback-card").scrollIntoView({
    behavior: "smooth",
    block: "center",
  })
}

/**
 * Passe à la question suivante
 */
function nextQuestion() {
  gameState.currentQuestion++

  if (gameState.currentQuestion < GAME_CONFIG.totalQuestions) {
    // Question suivante
    setTimeout(() => {
      loadQuestion(gameState.currentQuestion)
    }, 300)
  } else {
    // Quiz terminé
    setTimeout(() => {
      showResults()
    }, 500)
  }
}

/**
 * Affiche les résultats
 */
function showResults() {
  document.body.style.height = "auto"
  document.body.style.minHeight = "100vh"
  const resultContainers = document.querySelectorAll("#results-screen .container");
  resultContainers.forEach(container => {
    container.style.height    = "auto";
    container.style.minHeight = "100vh";
  })
  showScreen("results-screen")

  // Calcule et affiche le score final
  const finalScore = calculateFinalScore()
  animateScore(finalScore)

  // Affiche la catégorie de score
  displayScoreCategory(finalScore)

  // Génère le graphique par catégorie
  generateCategoryChart()

  // Génère les recommandations
  generateRecommendations()
}

/**
 * Calcule le score final en pourcentage
 */
function calculateFinalScore() {
  // Transforme le score de [-60, 60] vers [0, 100]
  return Math.round(((gameState.score - GAME_CONFIG.minScore) / (GAME_CONFIG.maxScore - GAME_CONFIG.minScore)) * 100)
}

/**
 * Anime l'affichage du score
 */
function animateScore(targetScore) {
  const scoreElement = document.getElementById("final-score")
  let currentScore = 0
  const increment = Math.ceil(targetScore / 60)

  const animation = setInterval(() => {
    currentScore += increment
    if (currentScore >= targetScore) {
      currentScore = targetScore
      clearInterval(animation)
    }
    scoreElement.textContent = currentScore
  }, 30)
}

/**
 * Affiche la catégorie de score avec nouveau système de couleurs
 */
function displayScoreCategory(score) {
  const categoryElement = document.getElementById("score-category")
  const scoreCircle = document.getElementById("final-score").parentElement
  let category, background, scoreClass

  // Supprime toutes les classes de score existantes
  scoreCircle.classList.remove("score-excellent", "score-good", "score-neutral", "score-warning", "score-danger")

  if (score >= 80) {
    category = "🌟 Éco-champion ! Impact très positif"
    background = "linear-gradient(135deg, #1e8449, #27ae60)"
    scoreClass = "score-excellent"
  } else if (score >= 60) {
    category = "🌱 Bon éco-citoyen ! Impact positif"
    background = "linear-gradient(135deg, #27ae60, #58d68d)"
    scoreClass = "score-good"
  } else if (score >= 40) {
    category = "⚖️ Impact neutre, des améliorations possibles"
    background = "linear-gradient(135deg, #f1c40f, #f4d03f)"
    scoreClass = "score-neutral"
  } else if (score >= 20) {
    category = "⚠️ Impact négatif, changements nécessaires"
    background = "linear-gradient(135deg, #f39c12, #f1c40f)"
    scoreClass = "score-warning"
  } else {
    category = "🚨 Impact très négatif, action urgente requise"
    background = "linear-gradient(135deg, #e74c3c, #f39c12)"
    scoreClass = "score-danger"
  }

  categoryElement.textContent = category
  categoryElement.style.background = background
  scoreCircle.classList.add(scoreClass)
}

/**
 * Génère le graphique par catégorie avec barres Rouge-Vert synchronisées
 */
function generateCategoryChart() {
  const chartContainer = document.getElementById("category-chart")
  chartContainer.innerHTML = ""

  // Calcule la largeur du texte le plus long pour synchroniser les barres
  const tempDiv = document.createElement("div")
  tempDiv.style.visibility = "hidden"
  tempDiv.style.position = "absolute"
  tempDiv.style.fontSize = "0.9rem"
  tempDiv.style.fontWeight = "600"
  document.body.appendChild(tempDiv)

  let maxTextWidth = 0
  CATEGORIES.forEach((category) => {
    tempDiv.textContent = `${category.icon} ${category.name}`
    maxTextWidth = Math.max(maxTextWidth, tempDiv.offsetWidth)
  })
  document.body.removeChild(tempDiv)

  CATEGORIES.forEach((category) => {
    const categoryScore = gameState.categoryScores[category.id]
    const percentage = Math.round(
      ((categoryScore.score - categoryScore.minScore) / (categoryScore.maxScore - categoryScore.minScore)) * 100,
    )

    const categoryItem = document.createElement("div")
    categoryItem.className = "category-item"

    categoryItem.innerHTML = `
      <div class="category-name" style="width: ${maxTextWidth + 10}px;">${category.icon} ${category.name}</div>
      <div class="category-bar">
        <div class="category-bar-fill" style="width: ${percentage}%;"></div>
      </div>
      <div class="category-score">${percentage}%</div>
    `

    chartContainer.appendChild(categoryItem)
  })
}

/**
 * Génère les recommandations personnalisées
 */
function generateRecommendations() {
  const recommendationsContainer = document.getElementById("recommendations-list")
  recommendationsContainer.innerHTML = ""

  // Trouve les catégories avec les scores les plus faibles
  const sortedCategories = CATEGORIES.map((category) => ({
    ...category,
    score: gameState.categoryScores[category.id].score,
    percentage: Math.round(
      ((gameState.categoryScores[category.id].score - gameState.categoryScores[category.id].minScore) /
        (gameState.categoryScores[category.id].maxScore - gameState.categoryScores[category.id].minScore)) *
        100,
    ),
  })).sort((a, b) => a.percentage - b.percentage)

  // Recommandations spécifiques par catégorie
  const recommendations = {
    transport: {
      title: "🚗 Optimisez vos déplacements",
      text: "Privilégiez les transports en commun, le vélo ou la marche pour les trajets courts. Considérez le covoiturage pour les longs trajets.",
    },
    alimentation: {
      title: "🍽️ Repensez votre alimentation",
      text: "Réduisez votre consommation de viande, privilégiez les produits locaux et de saison, et planifiez vos repas pour éviter le gaspillage.",
    },
    energie: {
      title: "⚡ Économisez l'énergie",
      text: "Baissez votre chauffage d'1°C, éteignez vos appareils en veille et passez aux ampoules LED pour réduire votre consommation.",
    },
    dechets: {
      title: "♻️ Améliorez votre gestion des déchets",
      text: "Triez rigoureusement, compostez vos déchets organiques et privilégiez les achats en vrac avec vos propres contenants.",
    },
    consommation: {
      title: "🛒 Consommez plus responsable",
      text: "Achetez moins mais mieux, privilégiez la seconde main, réparez vos objets et évitez les achats impulsifs.",
    },
  }

  // Génère 5 recommandations basées sur les scores les plus faibles
  sortedCategories.slice(0, 5).forEach((category) => {
    const recommendation = recommendations[category.id]
    if (recommendation) {
      const recommendationElement = document.createElement("div")
      recommendationElement.className = "recommendation-item"
      recommendationElement.innerHTML = `
        <h4>${recommendation.title}</h4>
        <p>${recommendation.text}</p>
      `
      recommendationsContainer.appendChild(recommendationElement)
    }
  })
}

/**
 * Redémarre le jeu
 */
function restartGame() {
  initializeGame()
}

/**
 * Partage les résultats
 */
function shareResults() {
  const finalScore = calculateFinalScore()
  const category = document.getElementById("score-category").textContent

  const shareText = `🌱 J'ai testé mon impact écologique avec EcologIA !

📊 Mon score : ${finalScore}/100
${category}

Et vous, quel est votre impact sur la planète ? 
Testez-vous sur : ${window.location.href}

#EcologIA #Écologie #DéveloppementDurable #TestÉcologique`

  // Utilise l'API Web Share si disponible
  if (navigator.share) {
    navigator
      .share({
        title: "Mes résultats ÉcoDécisions",
        text: shareText,
        url: window.location.href,
      })
      .catch((err) => {
        console.log("Erreur lors du partage:", err)
        fallbackShare(shareText)
      })
  } else {
    fallbackShare(shareText)
  }
}

/**
 * Partage de secours (copie dans le presse-papier)
 */
function fallbackShare(text) {
  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert("📋 Texte copié dans le presse-papier ! Vous pouvez maintenant le partager sur vos réseaux sociaux.")
      })
      .catch(() => {
        showShareModal(text)
      })
  } else {
    showShareModal(text)
  }
}

/**
 * Affiche le texte de partage dans une modal
 */
function showShareModal(text) {
  alert(`📱 Copiez ce texte pour le partager :\n\n${text}`)
}

/**
 * Fonctions utilitaires pour les performances et l'accessibilité
 */

// Gestion de la visibilité de la page
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    // Page cachée - on peut pauser les animations
    console.log("EcologIA - Quiz en pause")
  } else {
    // Page visible - on peut reprendre
    console.log("EcologIA - Quiz actif")
  }
})

// Gestion des erreurs JavaScript
window.addEventListener("error", (event) => {
  console.error("Erreur dans le quiz:", event.error)
  // En production, on pourrait envoyer l'erreur à un service de monitoring
})

// Analytics simulé (en production, intégrer Google Analytics ou similaire)
function trackQuizCompletion() {
  const completionData = {
    score: gameState.score,
    finalScore: calculateFinalScore(),
    duration: Date.now() - gameState.startTime,
    answers: gameState.answers.length,
    categoryScores: gameState.categoryScores,
  }

  console.log("Quiz complété:", completionData)
  // Ici on enverrait les données à un service d'analytics
}

// Appel du tracking quand on affiche les résultats
const originalShowResults = showResults
showResults = () => {
  originalShowResults()
  trackQuizCompletion()
}

// Export pour les tests (si nécessaire)
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    QUIZ_QUESTIONS,
    GAME_CONFIG,
    calculateFinalScore,
    gameState,
  }
}
