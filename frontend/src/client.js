const STATUSES = { READY: 'READY', WAITING_FOR_AI: 'WAITING_FOR_AI', ERROR: 'ERROR' }
const history = []

const askQuestion = async (question) => {
  try {
    stopPlaceHolderAnimation()
    const qs = document.querySelector('.sample-questions')
    if (qs) qs.remove()
    const res = await getQuestionResponse(
      JSON.stringify({
        question,
        history: history.slice(0, -1).map(h => `HUMAN: ${h.human}\nAI: ${h.ai}`).join('\n\n')
      }))
    console.log('res', res)
    if (res.error) {
      setStatus(STATUSES.ERROR)
    }
    const lastHistoryItem = history[history.length - 1]
    if (res.answer && lastHistoryItem) {
      lastHistoryItem.ai = res.answer
      if (res.relevantURLs) {
        lastHistoryItem.relevantURLs = res.relevantURLs
      }
      setStatus(STATUSES.READY)
      document.querySelector('form.ask input.question').value = ''
      renderHistory()
      document.querySelector('input.question').focus()
    }
  } catch (error) {
    console.error(error)
    setStatus(STATUSES.ERROR)
  }
}
const scrollToBottom = () => {
  window.scrollTo(0, document.body.scrollHeight)
}
const setStatus = (newStatus) => {
  if (newStatus === STATUSES.READY) {
    document.querySelector('form.ask fieldset').removeAttribute('disabled')
    document.querySelector('.status').innerHTML = ''
  } else if (newStatus === STATUSES.WAITING_FOR_AI) {
    document.querySelector('form.ask fieldset').setAttribute('disabled', 'disabled')
    document.querySelector('.status').innerHTML = ''
    // document.querySelector('.status').innerHTML = '<div class="alert alert-info" role="alert"><i class="bi bi-info-circle-fill pe-2"></i> ...Waiting for AI...</div>'
  } else {
    document.querySelector('form.ask fieldset').setAttribute('disabled', 'disabled')
    document.querySelector('.status').innerHTML = '<div class="alert alert-danger" role="alert"><i class="bi bi-exclamation-triangle-fill pe-2"></i> ERROR - Please contact us in discord</div>'
  }
}
const renderHistory = () => {
  let html = ''
  for (const historyItem of history) {
    if (historyItem.human) {
    //   html += `<p class="text-primary">HUMAN: ${historyItem.human}</p>`
      html += `<div class="d-flex justify-content-end mb-4">
                    <p class="message m-0 shadow">${historyItem.human}</p>
                    <span class="eve-icon mt-2 ms-2 shadow"><img src="player.svg"/></span>
                </div>`
    }
    if (historyItem.ai) {
    //   html += `<p class="text-success">AI: ${historyItem.ai}</p>`
      console.log('ai', historyItem.ai)
      html += `<div class="d-flex justify-content-start mb-4">
                    <span class="eve-icon mt-2 me-2 shadow"><img src="aura.svg"/></span>
                    <p class="message m-0 ai shadow">${historyItem.ai}</p>
                </div>`
    }
    if (historyItem.relevantURLs) {
      html += `<p class="text-info mb-4">${historyItem.relevantURLs.map(url => {
        const urlSplit = url.split('/')
        return `<a href="${url}" target="_blank" class="btn btn-outline-info me-2 mb-2">${urlSplit[urlSplit.length - 1].replace(/-/g, ' ')} <i class="bi bi-box-arrow-up-right text-dark"></i></a>`
      }).join('')}</p>`
    }
  }
  document.querySelector('.history').innerHTML = html
  scrollToBottom()
}
const addStreamingDataStart = () => {
  document.querySelector('.history').innerHTML += `<div class="d-flex justify-content-start mb-4">
                    <span class="eve-icon mt-2 me-2 shadow"><img src="aura.svg"/></span>
                    <p class="message m-0 ai shadow"><span class="loader-a d-inline-block"></span></p>
                </div>`
  return document.querySelector('.history').lastChild.querySelector('p.message')
}
const bindFormSubmit = async () => {
  document.querySelector('form.ask').addEventListener('submit', (e) => {
    e.preventDefault()
    const question = document.querySelector('form.ask input.question').value
    if (question.length === 0) return
    console.log('question', question)
    setStatus(STATUSES.WAITING_FOR_AI)
    history.push({ human: question })
    renderHistory()
    askQuestion(question)
  })
}

const getQuestionResponse = (body) => {
  // TODO - This is a real mess - Improve
  return new Promise((resolve) => {
    const streamingAnswerEle = addStreamingDataStart()
    scrollToBottom()
    console.log('streamingAnswerEle', streamingAnswerEle)
    console.log('askQuestion', body)
    fetch('/ask-question', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/stream'
      },
      body
    }).then(response => {
      console.log('RESPONSE')
      const reader = response.body.getReader()
      let text = ''
      const stream = new ReadableStream({
        start (controller) {
          function push () {
            reader.read().then(({ done, value }) => {
              if (done) {
                controller.close()
                const textSplit = text.split('|||||')
                const answer = textSplit[0]
                const relevantURLs = textSplit.length > 1 ? textSplit[1].split('|||') : []
                console.log('END', answer, relevantURLs)
                resolve({ answer, relevantURLs })
                return
              }

              controller.enqueue(value)
              const chunk = new TextDecoder('utf-8').decode(value)
              console.log(chunk)
              if (text === '') {
                streamingAnswerEle.innerHTML = ''
              }
              text += chunk

              if (!chunk.startsWith('|||||')) {
                streamingAnswerEle.innerHTML += chunk
                scrollToBottom()
              }

              return push()
            })
          };
          console.log('START')
          push()
        }
      })

      return new Response(stream, { headers: { 'Content-Type': 'text/html' } })
    })
  })
}
const slideInAnimations = () => {
  setTimeout(() => {
    document.querySelectorAll('.slide-in-element').forEach((element, index) => {
      setTimeout(() => {
        element.classList.add('active')
      }, index * 50)
    })
  }, 10)
}
const potentialQuestions =
    `What is the backstory of the EVE Online universe?
    Who are the major factions and empires in the EVE Online universe?
    Can you explain the history of the Amarr Empire in EVE Online?
    What is the role of the Gallente Federation in the game's lore?
    Tell me about the Minmatar Republic and its history.
    Who are the Caldari State, and what's their place in the lore of EVE Online?
    What caused the collapse of the EVE Gate, and how did it impact the game's lore?
    What is the Jovian race, and how do they fit into the story of EVE Online?
    What is the significance of the Amarr-Jove War in the lore of EVE Online?
    Can you explain the backstory of the Drifters and their connection to the Jove?
    How did the Terran Federation factor into the lore of EVE Online?
    What is the backstory of the Sansha's Nation and their leader, Sansha Kuvakei?
    Tell me about the Sisters of EVE and their role in the lore.
    How do the Blood Raiders fit into the storyline of EVE Online?
    What are the Yan Jung and their history in the EVE universe?
    Can you provide insights into the mysterious Sleepers and their technology?
    What is the lore behind the four main playable races in EVE Online?
    How do capsuleers fit into the lore and storyline of EVE Online?
    What is the backstory of the infamous pirate faction, the Guristas?
    Tell me about the Serpentis Corporation and their involvement in the lore.
    How do the pirate factions like the Angel Cartel influence the game's narrative?
    What role did the Empyrean War play in the history of the Caldari and Gallente?
    What is the background of the Amarr-Minmatar conflict and the Great Rebellion?
    Explain the history and motivations of the Sisters of the Wyrm.
    What caused the Cataclysm and the ensuing Dark Age in the EVE universe?
    How does the ongoing struggle for wormhole space factor into the lore of EVE Online?
    Can you provide insights into the mysterious and ancient Talocan civilization?
    What is the lore behind the Drifters' invasion of New Eden?
    Tell me about the history of the Upwell Consortium and their structures.
    How has the Triglavian Collective's emergence impacted the EVE Online storyline?`.split('\n').map(q => q.trim())

let stopPlaceHolderAnimation
const typePlaceholderText = () => {
  const inputElement = document.querySelector('input.question')
  const typingSpeed = 50
  const eraseSpeed = 10
  const pauseDuration = 2000
  let textIndex = 0
  let charIndex = 0
  let typingTimeout
  let erasingTimeout

  const addText = () => {
    const text = potentialQuestions[Math.floor(Math.random() * potentialQuestions.length)]
    charIndex = 0

    const typeChar = () => {
      inputElement.placeholder = text.substr(0, charIndex)
      charIndex++

      if (charIndex <= text.length) {
        typingTimeout = setTimeout(typeChar, typingSpeed)
      } else {
        erasingTimeout = setTimeout(eraseText, pauseDuration)
      }
    }

    typingTimeout = setTimeout(typeChar, typingSpeed)
  }

  const eraseText = () => {
    const text = inputElement.placeholder

    const eraseChar = () => {
      inputElement.placeholder = text.substr(0, charIndex)
      charIndex--

      if (charIndex >= 0) {
        erasingTimeout = setTimeout(eraseChar, eraseSpeed)
      } else {
        textIndex = (textIndex + 1) % potentialQuestions.length
        addText()
      }
    }

    erasingTimeout = setTimeout(eraseChar, eraseSpeed)
  }

  addText()

  // Function to stop the animation
  const stopAnimation = () => {
    clearTimeout(typingTimeout)
    clearTimeout(erasingTimeout)
    inputElement.placeholder = 'Ask a question about EVE online'
  }

  // Return the stopAnimation function, allowing you to stop the animation externally
  return stopAnimation
}

const renderSampleQuestions = () => {
  const sampleQuestions = Array.from({ length: 16 }, () => potentialQuestions[Math.floor(Math.random() * potentialQuestions.length)])
  console.log('sampleQuestions', sampleQuestions)
  document.querySelector('.sample-questions .row').innerHTML = sampleQuestions.map(q => `
    <div class="col-md-3 mb-2">
      <div class="d-flex flex-column h-100">
        <button class="btn btn-card flex-grow-1 sample-question">${q}</button>
      </div>
    </div>`).join('')
  for (const qEle of [...document.querySelectorAll('.sample-question')]) {
    qEle.addEventListener('click', () => {
      document.querySelector('input.question').value = qEle.textContent
      document.querySelector('input.question').focus()
      console.log(qEle.textContent)
    })
  }
}
const init = async () => {
  console.log('init')
  renderSampleQuestions()
  slideInAnimations()
  bindFormSubmit()
  setStatus(STATUSES.READY)
  stopPlaceHolderAnimation = typePlaceholderText()
}
init()
