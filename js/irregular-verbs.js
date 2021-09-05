'use strict'

// Globals
let score = 0
let questionCount = 0
let maxQuestions = 10
let verbs
let currentVerb

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

    // Globally assign the Enter key to the button click event
    window.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            // Cancel the default action, if needed
            event.preventDefault();
            // Trigger the button element with a click
            document.getElementById('button').click();
        }
    })

    // Start a new game
    newGame()
}

// Initialize game data and document
function newGame() {
    document.getElementById('button').removeEventListener('click', newGame)
    document.getElementById('message').innerHTML = ''
    score = 0
    questionCount = 0
    nextVerb()
}

// Display the next random verb
function nextVerb() {
    updateScore()
    currentVerb = verbs.splice(Math.floor(Math.random() * verbs.length), 1)[0]
    let present = currentVerb[0]
    document.getElementById('present').innerHTML = present
    resetInputForm()
    questionCount += 1

    // Switch the button from "next" to "check"
    document.getElementById('button').removeEventListener('click', nextVerb)
    document.getElementById('button').value = 'Check'
    document.getElementById('button').addEventListener('click', check)
}

function getUserInputFields() {
    return [
        document.getElementById('preterit'),
        document.getElementById('participle')
    ]
}

// Check for correct answer
function check() {
    let user_input = getUserInputFields()

    // Move the focus to the second field if Enter was pressed
    if (user_input[0].value.length !== 0 && document.activeElement == user_input[0]) {
        user_input[1].focus()
        return
    }

    // Don't perform the check if any of the two fields is empty
    if (user_input[0].value.length == 0 || user_input[1].value.length == 0 ) return

    // Convert the answer string to an array if there are two possible options
    // separated by a slash
    let correctAnswer = [currentVerb[1].split('/'), currentVerb[2].split('/')]

    // Check both answers
    for (let i = 0; i < 2; i++) {
        user_input[i].classList.remove('default')
        if (correctAnswer[i].includes(user_input[i].value.toLowerCase())) {
            score += 1
            user_input[i].classList.add('correct')
        } else {
            user_input[i].classList.add('incorrect')
        }
        user_input[i].value = correctAnswer[i]
    }

    updateScore()

    // Disable the input fields
    document.getElementById('preterit').disabled = true
    document.getElementById('participle').disabled = true

    // Needed for Firefox for the Enter key to work
    document.getElementById('button').focus()

    if (questionCount < maxQuestions) {
        pause()
    } else {
        gameOver()
    }
}

function updateScore() {
    document.getElementById('score').innerHTML = 'Score : ' + score
}

function pause() {
    let button = document.getElementById('button')
    button.removeEventListener('click', check)
    button.value = 'Next'
    button.addEventListener('click', nextVerb)
}

function gameOver() {
    let msg = '<p>Your score is ' + score + '. '
    if (score == maxQuestions * 2) {
        msg += 'Well done! '
    }
    msg += 'Press Start to play again.'
    document.getElementById('score').innerHTML = msg
    let button = document.getElementById('button')
    button.removeEventListener('click', nextVerb)
    button.value = 'Start'
    button.addEventListener('click', newGame)
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

function error() {
    console.log('Error loading JSON file.')
}

main()
