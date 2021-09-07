'use strict'

// Globals
const maxQuestions = 10
let verbs
let score = 0
let questionCount = 0
let currentVerb
let currentRun
let uiState

// Read JSON file from server
function getData(url) {
    return fetch(url).then(response => {
      	return response.json()
    })
}

// Main entry point
async function main() {
    // Get verbs list
    verbs = await getData('js/verbs-list.json')
    console.log('Loaded ' + verbs.length + ' verbs.')

    // Globally assign the Enter key to the button click event
    window.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault()
            onClick()
        }
    })

    document.getElementById('button').addEventListener('click', onClick)
    newGame()
}

// Handle button click based on UI state
function onClick() {
    switch(uiState) {
        case 'start':
            newGame()
            break;
        case 'check':
            checkVerb()
            break;
        case 'next':
            nextVerb()
            break;
        default:
            throw 'Undefined game state.'
    }
}

// Update the UI state and the button text
function setUIState(state) {
    uiState = state
    document.getElementById('button').value = uiState
}

// Initialize game data
function newGame() {
    document.getElementById('message').innerHTML = ''
    score = 0
    questionCount = 0
    currentRun = []
    initProgressBar()
    setButtonHighlight(false)
    nextVerb()
}

// Display the next random verb
function nextVerb() {
    currentVerb = verbs.splice(Math.floor(Math.random() * verbs.length), 1)[0]
    currentRun.push(currentVerb)
    let present = currentVerb[0]
    document.getElementById('present').innerHTML = present
    questionCount += 1

    // Update the UI
    updateScore()
    clearStepInfo()
    resetInputForm()
    setUIState('check')
}

// Initialize the Progress Bar buttons
function initProgressBar() {
    let div = document.getElementById('progress')
    div.innerHTML = ''
    for (let i=0; i < maxQuestions; i++) {
        let el = document.createElement('div')
        let id = 'progress-item-' + String(i)
        el.setAttribute('id', id)
        el.setAttribute('class', 'progress-item')
        el.setAttribute('style', 'grid-column: ' + String(i+1))
        el.classList.add('hidden')
        div.appendChild(el)
        el.innerHTML = ''
    }
    clearStepInfo()
}

function getUserInputFields() {
    return [
        document.getElementById('preterit'),
        document.getElementById('participle')
    ]
}

function bothInputsFieldsFilled(fields) {
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

// Check for correct answer
function checkVerb() {
    clearStepInfo()
    let currentAnswerScore = 0
    let user_input = getUserInputFields()

    // Only perform check if none of the fields are empty
    if (!bothInputsFieldsFilled(user_input)) { return }

    // Convert the answer string to an array
    // if there are two possible options separated by a slash
    let correctAnswer = [currentVerb[1].split('/'), currentVerb[2].split('/')]

    // Unhide corresponding progress bar step
    let gridID = 'progress-item-' + String(questionCount - 1)
    let progressStep = document.getElementById(gridID)
    progressStep.classList.remove('hidden')
    progressStep.addEventListener('click', onDisplayStepInfo)

    // Check both answers
    for (let i = 0; i < 2; i++) {
        user_input[i].classList.remove('default')
        if (correctAnswer[i].includes(user_input[i].value.toLowerCase())) {
            currentAnswerScore += 1
            user_input[i].classList.add('correct')
        } else {
            user_input[i].classList.add('incorrect')
        }
        user_input[i].value = correctAnswer[i]
    }

    if (currentAnswerScore === 2) {
        document.getElementById(gridID).classList.add('correct')
    } else if (currentAnswerScore == 1) {
        document.getElementById(gridID).classList.add('half-correct')
    } else {
        document.getElementById(gridID).classList.add('incorrect')
    }

    score += currentAnswerScore
    updateScore()
    disableInputFields(true)

    // Needed for Firefox for the Enter key to work
    document.getElementById('button').focus()

    if (questionCount < maxQuestions) {
        setUIState('next')
    } else {
        gameOver()
    }
}

function disableInputFields(value) {
    document.getElementById('preterit').disabled = value
    document.getElementById('participle').disabled = value
}

function updateScore() {
    document.getElementById('score').innerHTML = score
}

// Show Step Info
function onDisplayStepInfo(e) {
    let step = getProgressStepIndex(e.target)

    // Deselect step if it's selected
    if (e.target.classList.contains('selected')) {
        clearStepInfo()
        return
    }

    // Select the step
    clearStepInfo()
    document.querySelector('#progress-item-' + String(step)).classList.add('selected')

    // Build the message to be displayed depending on user answer
    let verb = currentRun[step]
    let answer = `${verb[0]} : ${verb[1]}, ${verb[2]}`
    let isCorrect = e.target.classList.contains('correct')
    let html

    if (isCorrect) {
        html = '<span>' + answer + '</span>' + ' — You got that right!'
    } else {
        html = 'Remember, it\'s — ' + '<span>' + answer + '</span>'
    }

    document.getElementById('step-info').innerHTML = html
}

// Clear Step Info
function clearStepInfo() {
    document.getElementById('step-info').innerHTML = ''
    let steps = document.querySelectorAll('.progress-item')
    steps.forEach(function(step) {
        step.classList.remove('selected')
    })
}

// Get step index from the 'progress-item-xx' id attribute string
function getProgressStepIndex(target) {
    return Number(target.id.substr(14))
}

// Display end of round information
function gameOver() {
    let msg = '<p>Your score is ' + score
    msg += ' out of a possible ' + maxQuestions * 2 + '. '
    msg += getScoreEvaluation(score) + ' ' 
    msg += 'Press Start to play again.'
    document.getElementById('message').innerHTML = msg
    document.getElementById('present').innerHTML = ''
    setButtonHighlight(true)
    resetInputForm()
    disableInputFields(true)
    setUIState('start')
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
        return 'Pretty awful.'
    } else {
        return 'Quite the disaster, really.'
    }
}

function error() {
    console.log('Error loading JSON file.')
}

main()
