import * as yo from 'yo-yo'


// globals
// =

let currentStep = 0
let isHintHidden = true
let showNavigation = true
let settings
let defaultProtocolSettings
let resolve
let reject

const STEPS = [
  {
    title: 'Welcome to Brox Browser!',
     subtitle: 'Explore the internet with lightweight resource',
    description: 'Brox is a browser for old computer with low performance.',
    content: () => yo`
      <div>    

        <p>         
            <span class="text">
              Exploring internet with privacy and freedom.
            </span>

            <button type="button" class="btn hint-btn plain link" onclick=${onShowHint}>
              <i class="far fa-question-circle"></i>
            </button>
          </label>

          <div class="onboarding-hint ${isHintHidden ? 'hidden' : ''}">
            When you browsing internet brox browser protect online tracer and annoying ads.
          </div>
        </p>
      </div>`,
    color: 'blue',
    onLeave: async () => {
      if (defaultProtocolSettings.http) {
        await beaker.browser.setAsDefaultProtocolClient('http')
      } else {
        await beaker.browser.removeAsDefaultProtocolClient('http')
      }
    }
  }
]

export async function create (opts = {}) {
  settings = await beaker.browser.getSettings()
  currentStep = (opts.showHelpOnly) ? (STEPS.length - 1) : 0
  showNavigation = !opts.showHelpOnly

  // render interface
  var popup = render()
  document.body.appendChild(popup)
  document.addEventListener('keyup', onKeyUp)

  // return promise
  return new Promise((_resolve, _reject) => {
    resolve = _resolve
    reject = _reject
  })
}

export function destroy () {
  // run any effects
  if (STEPS[currentStep].onLeave) {
    STEPS[currentStep].onLeave()
  }

  localStorage.hasDismissedOnboarding = true
  var popup = document.getElementById('onboarding-popup')
  document.body.removeChild(popup)
  document.removeEventListener('keyup', onKeyUp)
  reject()
}

// internal methods
// =

function update () {
  yo.update(document.getElementById('onboarding-popup'), render())
}

function render () {
  const step = STEPS[currentStep]

  return yo`
    <div id="onboarding-popup" class="popup-wrapper ${step.color} step-${currentStep}" onclick=${onClickWrapper}>
      <div class="popup-inner">
        ${renderHead()}
        ${renderBody()}
        ${renderFooter()}
      </div>
    </div>`
}

function renderHead () {
  const step = STEPS[currentStep]

  return yo`
    <div class="head onboarding-header">
      <button class="btn close-btn plain" onclick=${destroy}>
        <i class="fa fa-times"></i>
      </button>

      <h1 class="title">
        ${step.title}
      </h1>

      <h2 class="subtitle">
        ${step.subtitle}
      </h2>
    </div>`
}

function renderBody () {
  const step = STEPS[currentStep]

  return yo`
    <div class="body onboarding-body">
      ${step.description && step.description.length
        ? yo`
          <p class="description">
            ${step.description}
          </p>`
        : ''
      }

      ${step.content()}
    </div>`
}

function renderFooter () {
  if (!showNavigation) {
    return yo`<div class="footer"></div>`
  }
  return yo`
    <div class="footer">
      ${currentStep !== 0
        ? yo`
          <button class="btn nofocus" onclick=${onClickPrevious}>
            <i class="fa fa-angle-double-left"></i>
            <span>Previous</span>
          </button>`
        : ''
      }

      <div class="progress-indicator">
        ${STEPS.map((step, i) => yo`<div class="step ${currentStep === i ? 'active' : ''}"></div>`)}
      </div>

      ${currentStep === STEPS.length - 1
        ? ''
        : yo`
          <button class="btn nofocus" onclick=${destroy}>
            <span>Close</span>
            
          </button>`
      }
    </div>
  </div>`
}

// event handlers
// =

function onKeyUp (e) {
  e.preventDefault()
  e.stopPropagation()

  if (e.keyCode === 27) {
    destroy()
  }
}

function onClickWrapper (e) {
  if (e.target.id === 'onboarding-popup') {
    destroy()
  }
}


function onShowHint (e) {
  e.stopPropagation()
  e.preventDefault()
  isHintHidden = !isHintHidden
  update()
}

