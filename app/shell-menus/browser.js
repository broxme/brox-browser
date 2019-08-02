/* globals customElements */
import { LitElement, html, css } from '../vendor/lit-element/lit-element'
import { fromEventStream } from '@beaker/core/web-apis/fg/event-target'
import moment from 'moment'
import * as bg from './bg-process-rpc'
import commonCSS from './common.css'

class BrowserMenu extends LitElement {
  static get properties () {
    return {
      submenu: {type: String}
    }
  }

  constructor () {
    super()

    this.browserInfo = bg.beakerBrowser.getInfo()
    const isDarwin = this.browserInfo.platform === 'darwin'
    const cmdOrCtrlChar = isDarwin ? 'Command + ' : 'Ctrl + '
    this.accelerators = {
      newWindow: cmdOrCtrlChar + 'N',
      newTab: cmdOrCtrlChar + 'T',
      findInPage: cmdOrCtrlChar + 'F',
      history: cmdOrCtrlChar + (isDarwin ? 'Y' : 'H'),
      openFile: cmdOrCtrlChar + 'O'
    }

    this.submenu = ''
    this.sumProgress = null // null means no active downloads
    this.shouldPersistDownloadsIndicator = false

    // wire up events
    var dlEvents = fromEventStream(bg.downloads.createEventsStream())
    dlEvents.addEventListener('sum-progress', this.onDownloadsSumProgress.bind(this))
  }

  reset () {
    this.submenu = ''
  }

  async init () {
    await this.requestUpdate()

    // adjust height based on rendering
    var height = this.shadowRoot.querySelector('div').clientHeight
    bg.shellMenus.resizeSelf({height})
  }

  render () {
    if (this.submenu === 'create-new') {
      return this.renderCreateNew()
    }

    // auto-updater
    var autoUpdaterEl = html``
    if (this.browserInfo && this.browserInfo.updater.isBrowserUpdatesSupported && this.browserInfo.updater.state === 'downloaded') {
      autoUpdaterEl = html`
        <div class="section auto-updater">
          <div class="menu-item auto-updater" @click=${this.onClickRestart}>
            <i class="fa fa-arrow-circle-up"></i>
            <span class="label">Restart to update Brox</span>
          </div>
        </div>
      `
    }

    // render the progress bar if downloading anything
    var progressEl = ''
    if (this.shouldPersistDownloadsIndicator && this.sumProgress && this.sumProgress.receivedBytes <= this.sumProgress.totalBytes) {
      progressEl = html`<progress value=${this.sumProgress.receivedBytes} max=${this.sumProgress.totalBytes}></progress>`
    }

    return html`
      <link rel="stylesheet" href="broxme://assets/font-awesome.css">
      <div class="wrapper">
        ${autoUpdaterEl}

        <div class="section">
          <div class="menu-item" @click=${e => this.onOpenNewWindow()}>
            <i class="far fa-window-maximize"></i>
            <span class="label">New Window</span>
            <span class="shortcut">${this.accelerators.newWindow}</span>
          </div>

          <div class="menu-item" @click=${e => this.onOpenNewTab()}>
            <i class="far fa-file"></i>
            <span class="label">New Tab</span>
            <span class="shortcut">${this.accelerators.newTab}</span>
          </div>
        </div>

        <div class="section">
          <div class="menu-item" @click=${e => this.onFindInPage(e)}>
            <i class="fa fa-search"></i>
            <span class="label">Find in Page</span>
            <span class="shortcut">${this.accelerators.findInPage}</span>
          </div>
        </div>

        <div class="section">                 
          <div class="menu-item" @click=${e => this.onOpenPage(e, 'broxme://bookmarks')}>
            <i class="far fa-star"></i>
            <span class="label">Bookmarks</span>
          </div>

          <div class="menu-item" @click=${e => this.onOpenPage(e, 'broxme://history')}>
            <i class="fa fa-history"></i>
            <span class="label">History</span>
            <span class="shortcut">${this.accelerators.history}</span>
          </div>

          <div class="menu-item downloads" @click=${e => this.onClickDownloads(e)}>
            <i class="fa fa-download"></i>
            <span class="label">Downloads</span>
            ${progressEl}
          </div>
        </div>
        <div class="section">
          <div class="menu-item" @click=${e => this.onOpenPage(e, 'broxme://settings')}>
            <i class="fas fa-cog"></i>
            <span class="label">Settings</span>
          </div>
        </div>

        <div class="section">
          <div class="menu-item" @click=${e => this.onOpenFile()}>
            <i></i>
            <span class="label">Open File...</span>
            <span class="shortcut">${this.accelerators.openFile}</span>
          </div>
        </div>

        <div class="section">
          <div class="menu-item" @click=${e => this.onOpenPage(e, 'https://support.broxme.com/')}>
            <i class="far fa-question-circle"></i>
            <span class="label">Help</span>
          </div>       

          
        </div>
      </div>
    `
  }


  // events
  // =

  onShowSubmenu (v) {
    this.submenu = v
  }

  onOpenNewWindow () {
    bg.shellMenus.createWindow()
    bg.shellMenus.close()
  }

  onOpenNewTab () {
    bg.shellMenus.createTab()
    bg.shellMenus.close()
  }

  async onOpenFile () {
    bg.shellMenus.close()
    var files = await bg.beakerBrowser.showOpenDialog({
       title: 'Open file...',
       properties: ['openFile', 'createDirectory']
    })
    if (files && files[0]) {
      bg.shellMenus.createTab('file://' + files[0])
    }
  }

  onClickDownloads (e) {
    this.shouldPersistDownloadsIndicator = false
    bg.shellMenus.createTab('broxme://downloads')
    bg.shellMenus.close()
  }

  onDownloadsSumProgress (sumProgress) {
    this.shouldPersistDownloadsIndicator = true
    this.sumProgress = sumProgress
    this.requestUpdate()
  }

  onFindInPage (e) {
    bg.shellMenus.close()
    bg.shellMenus.showInpageFind()
  }

  onClearDownloads (e) {
    e.preventDefault()
    e.stopPropagation()
    this.downloads = []
  }
  
  onOpenPage (e, url) {
    bg.shellMenus.createTab(url)
    bg.shellMenus.close()
  }

  onClickRestart () {
    bg.shellMenus.close()
    bg.beakerBrowser.restartBrowser()
  }
}
BrowserMenu.styles = [commonCSS, css`
.wrapper {
}

.wrapper::-webkit-scrollbar {
  display: none;
}

.section.auto-updater {
  padding-bottom: 0;
  border-bottom: 0;
}

.menu-item.auto-updater {
  height: 35px;
  background: #DCEDC8;
  border-top: 1px solid #c5e1a5;
  border-bottom: 1px solid #c5e1a5;
  color: #000;
}

.menu-item.auto-updater i {
  color: #7CB342;
}

.menu-item.auto-updater:hover {
  background: #d0e7b5;
}

.menu-item i.more {
  margin-left: auto;
  padding-right: 0;
  text-align: right;
}

.menu-item .more,
.menu-item .shortcut {
  color: #777;
  margin-left: auto;
}

.menu-item .shortcut {
  font-size: 12px;
  -webkit-font-smoothing: antialiased;
}

.menu-item.downloads progress {
  margin-left: 20px;
  flex: 1;
}
`]

customElements.define('browser-menu', BrowserMenu)