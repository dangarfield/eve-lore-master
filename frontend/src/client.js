const STATUSES = { READY: 'READY', WAITING_FOR_AI: 'WAITING_FOR_AI', ERROR: 'ERROR' }

const history = []

const PLAYER_SVG = '<span class="eve-icon mt-2 ms-2 shadow"><svg width="44" height="46" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.4525 0.651446V29.1032H0.75V24.9852C0.75 24.9852 6.70547 22.5669 9.11062 21.4185C11.0761 20.48 10.5773 17.1069 10.5773 17.1069C10.5773 17.1069 9.95391 16.5294 9.79969 15.5286C9.64219 14.5311 9.46828 13.3925 9.46828 13.3925C9.46828 13.3925 8.94328 13.491 8.68734 12.8314C8.43469 12.1719 8.37563 11.9324 8.22141 11.1941C8.06719 10.4558 7.79812 8.72988 8.45437 8.7791C8.52 8.78566 8.81531 8.9891 8.80219 8.58879C8.80219 8.58879 7.90969 1.0091 14.4525 0.651446ZM19.2891 17.1069C19.2891 17.1069 19.3219 17.0774 19.3645 17.0249V2.34785C19.0003 1.9541 18.5639 1.60301 18.0356 1.32738V29.1064H19.3645V19.3874C19.1217 18.2488 19.2891 17.1069 19.2891 17.1069ZM21.1791 12.8347C21.4317 12.1752 21.4908 11.9357 21.645 11.1974C21.8025 10.4591 22.0683 8.73316 21.412 8.78238C21.3464 8.78894 21.0511 8.99238 21.0642 8.59207C21.0642 8.59207 21.2841 6.72176 20.7066 4.79894V13.3597C20.8673 13.2941 21.0544 13.1563 21.1791 12.8347ZM24.4111 23.0329V29.1064H25.6612V23.5611C25.2544 23.3872 24.8344 23.21 24.4111 23.0329ZM20.7558 21.4185C20.7394 21.4086 20.723 21.3988 20.7066 21.3922V29.1064H22.0683V22.0189C21.5728 21.7958 21.1233 21.5924 20.7558 21.4185ZM15.1219 0.641602V29.1032H16.7002V0.828633C16.2277 0.71707 15.6994 0.654727 15.1219 0.641602ZM29.1164 24.9852C29.1164 24.9852 28.6833 24.808 28.0073 24.5324V29.1064H29.1164V24.9852Z" fill="#C0C0C0"></path></svg></span>'
const AURA_SVG = '<span class="eve-icon mt-2 me-2 shadow"><svg width="44" height="46" viewBox="0 0 44 46" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M33.586 21.19c-.82 1.775-1.43 2.5-2.09 2.65-.57 1.705-1.095 4.26-2.74 6.68L24.4 34.885h-4.71l-4.025-4.035c0-.02-.005-.045-.005-.065-1.795-2.495-2.325-5.18-2.915-6.945-.665-.15-1.275-.88-2.09-2.65-.935-2.02-1.79-4.08-.74-5.055.735-.68 1.395-.14 1.72.245-.01-1.445-.01-3.275-.01-5.65 0-2.235.53-3.975 1.345-5.335-.115 3.235 1.445 4.665 1.445 4.665h2.405l2.795 1.805V10.45L16.49 8.13s-2.08-2.765.65-6.345C19.676.62 22.126.58 22.126.58s2.325.035 4.785 1.11c2.84 3.625.725 6.435.725 6.435L24.5 10.45v1.415l2.795-1.805H29.7s1.63-1.49 1.435-4.875c.89 1.39 1.48 3.19 1.48 5.55 0 2.375 0 4.205-.01 5.65.33-.385.985-.925 1.72-.245 1.05.97.195 3.03-.74 5.05Zm.905 21.115-1.345-1.345v-1.6l3.665 2.535 1.38 1.38h5.175c-2.22-3.035-5.66-4.47-8.56-5.015-2.9-.545-5.42-2.645-6.045-3.965-.165-.345-.235-.85-.265-1.405l-3.8 3.805h-5.32l-3.66-3.66c-.03.495-.11.945-.255 1.26-.62 1.32-3.14 3.42-6.04 3.965-2.9.545-6.34 1.985-8.71 5.015h5.18l1.38-1.38 3.665-2.535v1.6L9.59 42.305v1.93l3.04 1.275h18.82l3.04-1.275v-1.93Z" fill="#c0c0c0"></path></svg></span>'

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
                    ${PLAYER_SVG}
                </div>`
    }
    if (historyItem.ai) {
    //   html += `<p class="text-success">AI: ${historyItem.ai}</p>`
      console.log('ai', historyItem.ai)
      html += `<div class="d-flex justify-content-start mb-4">
                    ${AURA_SVG}
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
                    ${AURA_SVG}
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
