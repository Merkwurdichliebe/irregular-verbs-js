'use strict'

const maxQuestions = 10
let score = 0
let questionCount = 0
let verbs
let currentVerb
let currentRun
let uiState

function getJSONData(url) {
    return fetch(url).then(response => {
      	return response.json()
    })
}

async function main() {
    verbs = await getJSONData('js/verbs-list.json')
    console.log('Loaded ' + verbs.length + ' verbs.')

    // Globally assign the Enter key to the button click event
    window.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault()
            onButtonClick()
        }
    })

    document.getElementById('button').addEventListener('click', onButtonClick)
    document.getElementById('progress-bar').addEventListener('click', onStepSelected)
    startNewGame()
}

function onButtonClick() {
    switch(uiState) {
        case 'start':
            startNewGame()
            break;
        case 'check':
            checkUserAnswer()
            break;
        case 'next':
            showNextVerb()
            break;
        default:
            throw 'Undefined game state.'
    }
}

function setUIState(state) {
    uiState = state
    document.getElementById('button').value = uiState
}

function startNewGame() {
    document.getElementById('message').innerHTML = ''
    score = 0
    questionCount = 0
    currentRun = []
    initProgressBar()
    setButtonHighlight(false)
    showNextVerb()
}

function showNextVerb() {
    currentVerb = verbs.splice(Math.floor(Math.random() * verbs.length), 1)[0]
    currentRun.push(currentVerb)
    let presentForm = currentVerb[0]
    document.getElementById('present').innerHTML = presentForm
    questionCount += 1

    updateScoreDisplay()
    clearStepInfoDisplay()
    resetInputForm()
    setUIState('check')
}

function initProgressBar() {
    let div = document.getElementById('progress-bar')
    div.innerHTML = ''
    for (let i=0; i < maxQuestions; i++) {
        let el = document.createElement('div')
        let id = 'step-' + String(i)
        el.setAttribute('id', id)
        el.setAttribute('class', 'step')
        el.setAttribute('style', 'grid-column: ' + String(i+1))
        el.classList.add('hidden')
        div.appendChild(el)
        el.innerHTML = ''
    }
    clearStepInfoDisplay()
}

function checkUserAnswer() {
    clearStepInfoDisplay()
    let userInput = getUserInputFields()
    if (!areBothInputFieldsFilled(userInput)) return
    
    let answerScore = getAnswerScore(userInput)
    showStepInfoButton(answerScore)
    score += answerScore
    updateScoreDisplay()
    disableInputFields(true)

    if (questionCount < maxQuestions) {
        setUIState('next')
    } else {
        gameOver()
    }
}

function getUserInputFields() {
    return [
        document.getElementById('preterit'),
        document.getElementById('participle')
    ]
}

function areBothInputFieldsFilled(fields) {
    let result = true
    fields.forEach(function(field, i, array) {
        if (field.value.length == 0) { 
            result = false
        } else if (array[1-i].value.length == 0) {
            array[1-i].focus()
            result = false
        }
    })
    return result
}

function getAnswerScore(userInput) {
    let answerScore = 0
    let correctAnswer = [currentVerb[1].split('/'), currentVerb[2].split('/')]

    for (let i = 0; i < 2; i++) {
        userInput[i].classList.remove('default')
        if (correctAnswer[i].includes(userInput[i].value.trim().toLowerCase())) {
            answerScore += 1
            userInput[i].classList.add('correct')
        } else {
            userInput[i].classList.add('incorrect')
        }
        userInput[i].value = correctAnswer[i]
    }

    return answerScore
}

function showStepInfoButton(answerScore) {
    let gridID = 'step-' + String(questionCount - 1)
    document.getElementById(gridID).classList.remove('hidden')

    if (answerScore === 2) {
        document.getElementById(gridID).classList.add('correct')
    } else if (answerScore == 1) {
        document.getElementById(gridID).classList.add('half-correct')
    } else {
        document.getElementById(gridID).classList.add('incorrect')
    }
}

function disableInputFields(value) {
    document.getElementById('preterit').disabled = value
    document.getElementById('participle').disabled = value
    document.getElementById('button').focus() // Firefox needs this for Enter key
}

function updateScoreDisplay() {
    document.getElementById('score').innerHTML = score
}

function onStepSelected(e) {
    if (isNotDelegatingButton(e.target)) {
        return
    } else if (isStepButtonSelected(e.target)) {
        clearStepInfoDisplay()
        return
    } else {
        showStepInfoText(e.target)
    }
}

function isStepButtonSelected(button) {
    return button.classList.contains('selected')
}

function isNotDelegatingButton(button) {
    return !button.classList.contains('step')
}

function showStepInfoText(button) {
    let step = getStepIndex(button)
    clearStepInfoDisplay()
    document.querySelector('#step-' + String(step)).classList.add('selected')

    let verb = currentRun[step]
    let correctAnswer = `${verb[0]} : ${verb[1]}, ${verb[2]}`
    let isUserCorrect = button.classList.contains('correct')

    let html = getStepInfoHTML(correctAnswer, isUserCorrect)
    document.getElementById('step-info').innerHTML = html
}

function getStepInfoHTML(correctAnswer, isUserCorrect) {
    if (isUserCorrect) {
        return '<span>' + correctAnswer + '</span>' + ' — You got that right!'
    } else {
        return 'Remember, it\'s — ' + '<span>' + correctAnswer + '</span>'
    }
}

function clearStepInfoDisplay() {
    document.getElementById('step-info').innerHTML = ''
    let steps = document.querySelectorAll('.step')
    steps.forEach(function(step) {
        step.classList.remove('selected')
    })
}

function getStepIndex(target) {
    // We get the progress bar step index
    // from the 'step-xx' id attribute string
    return Number(target.id.substr(5))
}

function gameOver() {
    showGameOverMessage()
    document.getElementById('present').innerHTML = ''
    setButtonHighlight(true)
    document.activeElement.blur()  // Hide mobile keyboard
    setUIState('start')
}

function showGameOverMessage() {
    let msg = '<p>Your score is ' + score
    msg += ' out of a possible ' + maxQuestions * 2 + '. '
    msg += getScoreEvaluation(score) + '<br>' 
    msg += 'Press Start to play again.'
    document.getElementById('message').innerHTML = msg
}

function setButtonHighlight(value) {
    let button = document.getElementById('button')
    if (value) {
        button.classList.add('highlight')
    } else {
        button.classList.remove('highlight')
    }
}

function resetInputForm() {
    let user_input = getUserInputFields()
    user_input.forEach(item => {
        item.classList.remove('correct')
        item.classList.remove('incorrect')
        item.classList.add('default')
        item.value = ''
        item.disabled = false
    })
    user_input[0].focus()
}

function getScoreEvaluation(score) {
    let maxScore = maxQuestions * 2
    if (score == maxScore) {
        return 'Perfect score! Well done indeed.'
    } else if (score > maxScore * 0.8) {
        return 'That was pretty good!'
    } else if (score > maxScore * 0.6) {
        return 'You can do better that this.'
    } else if (score > maxScore * 0.4) {
        return 'Well, that was pretty bad.'
    } else if (score > maxScore * 0.2) {
        return 'Rather awful.'
    } else {
        return 'Quite the disaster, really.'
    }
}

main()
