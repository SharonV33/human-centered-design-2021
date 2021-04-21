const socket = io()
const messages = document.querySelector('section ul')
const input = document.querySelector('input')
const video = document.querySelector('video')
const canvas = document.querySelector('canvas')
let emotion = 'neutral'

window.addEventListener('load', () => {
    // loadFacialRecognition()
    storeUsername()
})

document.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault()
    let user = localStorage.getItem('currentUser')
    if (input.value && user) {
        socket.emit('message', { user: user , content : input.value, emotion,  })
        input.value = ''
    }
    else if (input.value && !user) {
        storeUsername()
    }
})

document.querySelector(".collapse").addEventListener("click", function () {
        this.classList.toggle("active")
        const content = document
            .querySelector('.learningMessages')
        if (content.style.display === "flex") {
            content.style.display = "none"
        } else {
            content.style.display = "flex"
        }
    })

socket.on('message', function(message) {
    const element = document.createElement('li')
    const user = localStorage.getItem('currentUser')
    element.textContent = `${message.user}: ${message.content}`
    element.style.setProperty('--background', `var(--${message.emotion}color)`)
    element.style.setProperty('--font', `var(--${message.emotion}font)`)
    if (message.user === user) {
        element.classList.add('ownMessage')
    }
    messages.appendChild(element)
    messages.scrollTop = messages.scrollHeight
})

function storeUsername () {
    //check if username is stored in the browsers localstorage
    if (!localStorage.getItem('currentUser')) {
        //give the user a prompt to enter it and store it into locatsorage
        const username = prompt("Voer uw naam in:", "")
        if (username == null || username == "") {

        } else {
            localStorage.setItem('currentUser', username)
        }
    }
        console.log('current user', localStorage.getItem('currentUser'))
}

async function loadFacialRecognition() {
    await Promise.all([faceapi.nets.tinyFaceDetector.loadFromUri('./models'), faceapi.nets.faceLandmark68Net.loadFromUri('./models'), faceapi.nets.faceRecognitionNet.loadFromUri('./models'), faceapi.nets.faceExpressionNet.loadFromUri('./models')])
    /** @type MediaStream */
    let stream
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
                width: {min: 1024, ideal: 1280, max: 1920},
                height: {min: 576, ideal: 1280, max: 1920},
                facingMode: 'user',
            },
        })
    } catch (err) {
        console.error(err)
    }

    video.srcObject = stream
    video.onloadedmetadata = function(e) {
        video.play()
    };
}

video.addEventListener('play', detectEmotion)

function detectEmotion() {
    const displaySize = { width: video.width, height: video.height }
    faceapi.matchDimensions(canvas, displaySize)

    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions()
        const resizedDetections = faceapi.resizeResults(detections, displaySize)
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
        faceapi.draw.drawDetections(canvas, resizedDetections)
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections)

        if (detections.length > 0) {
            //For each face detection
            detections.forEach((element) => {
                let status = ''
                let valueStatus = 0.0
                for (const [key, value] of Object.entries(element.expressions)) {
                    if (value > valueStatus) {
                        status = key
                        valueStatus = value
                    }
                }
                emotion = status

            })
        } else {
            emotion = 'neutral'
        }
        input.style.setProperty('--border', `var(--${emotion}color)`)
    }, 1000)
}