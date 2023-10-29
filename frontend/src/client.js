const STATUSES = { READY: 'READY', WAITING_FOR_AI: 'WAITING_FOR_AI', ERROR: 'ERROR' }

const history = []

const askQuestion = async (question) => {
  try {
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
    }
  } catch (error) {
    console.error(error)
    setStatus(STATUSES.ERROR)
  }
}
const setStatus = (newStatus) => {
  if (newStatus === STATUSES.READY) {
    document.querySelector('form.ask fieldset').removeAttribute('disabled')
    document.querySelector('.status').innerHTML = ''
  } else if (newStatus === STATUSES.WAITING_FOR_AI) {
    document.querySelector('form.ask fieldset').setAttribute('disabled', 'disabled')
    document.querySelector('.status').innerHTML = '<div class="alert alert-info" role="alert"><i class="bi bi-info-circle-fill pe-2"></i> ...Waiting for AI...</div>'
  } else {
    document.querySelector('form.ask fieldset').setAttribute('disabled', 'disabled')
    document.querySelector('.status').innerHTML = '<div class="alert alert-danger" role="alert"><i class="bi bi-exclamation-triangle-fill pe-2"></i> ERROR - Please contact us in discord</div>'
  }
}
const renderHistory = () => {
  let html = ''
  for (const historyItem of history) {
    if (historyItem.human) {
      html += `<p class="text-primary">HUMAN: ${historyItem.human}</p>`
    }
    if (historyItem.ai) {
      html += `<p class="text-success">AI: ${historyItem.ai}</p>`
    }
    if (historyItem.relevantURLs) {
      html += `<p class="text-info">${historyItem.relevantURLs.map(url => {
        const urlSplit = url.split('/')
        return `<a href="${url}" target="_blank" class="btn btn-outline-info me-2 mb-2">${urlSplit[urlSplit.length - 1]} <i class="bi bi-box-arrow-up-right"></i></a>`
      }).join('')}</p>`
    }
  }
  document.querySelector('.history').innerHTML = html
}
const addStreamingDataStart = () => {
  document.querySelector('.history').innerHTML += '<p class="text-success">AI: </p>'
  return document.querySelector('.history').lastChild
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
              text += chunk
              if (!chunk.startsWith('|||||')) {
                streamingAnswerEle.textContent += chunk
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

const init = async () => {
  console.log('init')
  bindFormSubmit()
  setStatus(STATUSES.READY)
}
init()
