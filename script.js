// Small script to simulate chat interactions in the phone mockup
const openChatBtn = document.getElementById('open-chat')
const chatBody = document.getElementById('chat-body')
const typing = document.getElementById('typing-indicator')
const input = document.getElementById('message-input')
const sendBtn = document.getElementById('send-btn')

const STORAGE_KEY = 'whatsapp_clone_messages_v1'
const THEME_KEY = 'whatsapp_clone_theme'

function saveMessagesToStorage(){
  const msgs = Array.from(chatBody.querySelectorAll('.msg')).map(m => ({
    side: m.classList.contains('right') ? 'right' : 'left',
    text: m.querySelector('.bubble').childNodes[0].nodeValue || m.querySelector('.bubble').textContent,
    time: m.querySelector('.time').textContent,
    reaction: m.querySelector('.bubble').classList.contains('has-reaction') ? '👍' : null
  }))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs))
}

function loadMessagesFromStorage(){
  const raw = localStorage.getItem(STORAGE_KEY)
  if(!raw) return
  try{
    const msgs = JSON.parse(raw)
    chatBody.innerHTML = ''
    const frag = document.createDocumentFragment()
    msgs.forEach(m => {
      const node = buildMessageNode(m.text, m.side, m.time, m.reaction)
      frag.appendChild(node)
    })
    chatBody.appendChild(frag)
    // remove enter classes after insertion for transitions
    requestAnimationFrame(()=>{
      chatBody.querySelectorAll('.msg').forEach(n => n.classList.remove('enter-left','enter-right'))
    })
  }catch(e){
    console.warn('Failed to parse messages from storage', e)
  }
}

function buildMessageNode(text, side = 'left', time = null, reaction = null){
  const msg = document.createElement('div')
  msg.className = `msg ${side} enter-${side}`
  const bubble = document.createElement('div')
  bubble.className = 'bubble'
  // set text as text node so we can append reaction separately
  bubble.appendChild(document.createTextNode(text))
  // add reaction placeholder
  const react = document.createElement('span')
  react.className = 'reaction'
  react.textContent = '👍'
  bubble.appendChild(react)
  if(reaction) bubble.classList.add('has-reaction')
  const t = document.createElement('div')
  t.className = 'time'
  t.textContent = time || new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
  msg.appendChild(bubble)
  msg.appendChild(t)
  // bubble click toggles reaction
  bubble.addEventListener('click', ()=>{
    bubble.classList.toggle('has-reaction')
    debouncedSave()
  })
  return msg
}

function appendMessage(text, side = 'left', time = null, reaction = null){
  const node = buildMessageNode(text, side, time, reaction)
  chatBody.appendChild(node)
  // give browser a tick so CSS transitions run smoothly
  requestAnimationFrame(()=>{
    node.classList.remove('enter-' + side)
  })
  // smooth scroll
  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' })
  debouncedSave()
}

// Debounce saves to avoid excessive localStorage writes
let saveTimer = null
function debouncedSave(delay = 300){
  if(saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(()=>{
    saveMessagesToStorage()
    saveTimer = null
  }, delay)
}

function simulateIncoming(text, delay = 1200){
  typing.style.visibility = 'visible'
  // show typing for a bit
  setTimeout(()=>{
    typing.style.visibility = 'hidden'
    appendMessage(text, 'left')
  }, delay)
}

// Automatic two-person chat generator
function startAutoChat(scenario = 'friendly'){
  const scenarios = {
    friendly: [
      {side: 'left', text: "Hey — want to try the new demo?"},
      {side: 'right', text: "Sure! Show me how it looks."},
      {side: 'left', text: "It has typing indicators and animations."},
      {side: 'right', text: "Nice — I like the floating phone."},
      {side: 'left', text: "You can send messages and reactions."},
      {side: 'right', text: "Awesome. This feels alive."}
    ],
    onboarding: [
      {side: 'left', text: "Welcome to the demo!"},
      {side: 'right', text: "Thanks — where do I start?"},
      {side: 'left', text: "Try sending a message or click the bubbles."},
      {side: 'right', text: "Okay, sending one now..."},
      {side: 'right', text: "Cool!"}
    ]
  }

  const seq = scenarios[scenario] || scenarios.friendly
  // clear old messages
  chatBody.innerHTML = ''
  let i = 0
  function next(){
    if(i >= seq.length) return
    const item = seq[i++]
    // show typing for a moment
    typing.style.visibility = 'visible'
    setTimeout(()=>{
      typing.style.visibility = 'hidden'
      // append message node
      const node = buildMessageNode(item.text, item.side)
      chatBody.appendChild(node)
      requestAnimationFrame(()=> node.classList.remove('enter-' + item.side))
      // schedule next message
      setTimeout(next, 700 + Math.random() * 900)
    }, 700 + Math.random() * 800)
  }
  next()
}

openChatBtn.addEventListener('click', ()=>{
  // start an automatic two-person chat scenario
  startAutoChat('friendly')
})

sendBtn.addEventListener('click', ()=>{
  const val = input.value.trim()
  if(!val) return
  appendMessage(val, 'right')
  input.value = ''
  // simulate reply
  setTimeout(()=>{
    typing.style.visibility = 'visible'
    setTimeout(()=>{
      typing.style.visibility = 'hidden'
      appendMessage('Nice — that was sent!', 'left')
    }, 1200)
  }, 300)
})

// Small accessibility: press Enter to send
input.addEventListener('keydown', (e)=>{
  if(e.key === 'Enter'){
    e.preventDefault()
    sendBtn.click()
  }
})

// initial state
typing.style.visibility = 'hidden'

// restore saved messages on load
document.addEventListener('DOMContentLoaded', ()=>{
  loadMessagesFromStorage()
  // subtle accent pulse on the download CTA
  const cta = document.querySelector('.btn-primary')
  if(cta){
    cta.animate([
      { boxShadow: '0 0 0 0 rgba(37,211,102,0.0)' },
      { boxShadow: '0 10px 30px 6px rgba(37,211,102,0.09)' },
      { boxShadow: '0 0 0 0 rgba(37,211,102,0.0)' }
    ], { duration: 2000, iterations: 2 })
  }
  // initialize theme from storage
  const saved = localStorage.getItem(THEME_KEY)
  if(saved === 'dark') document.documentElement.classList.add('dark')
  updateThemeToggle()
  const toggle = document.getElementById('theme-toggle')
  if(toggle) toggle.addEventListener('click', ()=>{
    document.documentElement.classList.toggle('dark')
    const isDark = document.documentElement.classList.contains('dark')
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light')
    updateThemeToggle()
  })

  // reveal feature cards when they enter the viewport
  const cards = document.querySelectorAll('.features .card')
  if('IntersectionObserver' in window && cards.length){
    const obs = new IntersectionObserver(entries =>{
      entries.forEach(ent =>{
        if(ent.isIntersecting){
          ent.target.classList.add('visible')
          obs.unobserve(ent.target)
        }
      })
    }, {threshold: 0.2})
    cards.forEach(c => obs.observe(c))
  }else{
    // fallback show all
    cards.forEach(c => c.classList.add('visible'))
  }
})

function updateThemeToggle(){
  const toggle = document.getElementById('theme-toggle')
  if(!toggle) return
  const isDark = document.documentElement.classList.contains('dark')
  toggle.textContent = isDark ? '☀️' : '🌙'
  toggle.title = isDark ? 'Switch to light theme' : 'Switch to dark theme'
}

// Expose a small clear function for convenience
window._demoClearMessages = function(){
  localStorage.removeItem(STORAGE_KEY)
  chatBody.innerHTML = ''
  appendMessage('Welcome — chat cleared. Try typing a message!', 'left')
}