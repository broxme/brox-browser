import {app, protocol} from 'electron'
import * as beakerCore from '@beaker/core'
import errorPage from '@beaker/core/lib/error-page'
const {templates} = beakerCore.dbs
const {archivesDebugPage, datDnsCachePage, datDnsCacheJS} = beakerCore.dat.debug
import path from 'path'
import url from 'url'
import once from 'once'
import fs from 'fs'
import jetpack from 'fs-jetpack'
import intoStream from 'into-stream'
import ICO from 'icojs'

// constants
// =

// content security policies
const BEAKER_CSP = `
  default-src 'self' broxme:;
  img-src beaker-favicon: broxme: data: dat: http: https;
  script-src 'self' broxme: 'unsafe-eval';
  media-src 'self' broxme: dat:;
  style-src 'self' 'unsafe-inline' broxme:;
  child-src 'self';
`.replace(/\n/g, '')

// exported api
// =

export function setup () {
  // setup the protocol handler
  protocol.registerStreamProtocol('broxme', beakerProtocol, err => {
    if (err) throw new Error('Failed to create protocol: broxme. ' + err)
  })
}

// internal methods
// =

async function beakerProtocol (request, respond) {
  var cb = once((statusCode, status, contentType, path) => {
    const headers = {
      'Cache-Control': 'no-cache',
      'Content-Type': (contentType || 'text/html; charset=utf-8'),
      'Content-Security-Policy': BEAKER_CSP,
      'Access-Control-Allow-Origin': '*'
    }
    if (typeof path === 'string') {
      respond({statusCode, headers, data: fs.createReadStream(path)})
    } else if (typeof path === 'function') {
      respond({statusCode, headers, data: intoStream(path())})
    } else {
      respond({statusCode, headers, data: intoStream(errorPage(statusCode + ' ' + status))})
    }
  })
  async function serveICO (path, size = 16) {
    // read the file
    const data = await jetpack.readAsync(path, 'buffer')

    // parse the ICO to get the 16x16
    const images = await ICO.parse(data, 'image/png')
    let image = images[0]
    for (let i = 1; i < images.length; i++) {
      if (Math.abs(images[i].width - size) < Math.abs(image.width - size)) {
        image = images[i]
      }
    }

    // serve
    cb(200, 'OK', 'image/png', () => Buffer.from(image.buffer))
  }

  var requestUrl = request.url
  var queryParams
  {
    // strip off the hash
    let i = requestUrl.indexOf('#')
    if (i !== -1) requestUrl = requestUrl.slice(0, i)
  }
  {
    // get the query params
    queryParams = url.parse(requestUrl, true).query

    // strip off the query
    let i = requestUrl.indexOf('?')
    if (i !== -1) requestUrl = requestUrl.slice(0, i)
  }

  // browser ui
  if (requestUrl === 'broxme://shell-window/') {
    return cb(200, 'OK', 'text/html; charset=utf-8', path.join(__dirname, 'shell-window.html'))
  }
  if (requestUrl === 'broxme://shell-window/main.js') {
    return cb(200, 'OK', 'application/javascript; charset=utf-8', path.join(__dirname, 'shell-window.build.js'))
  }
  if (requestUrl === 'broxme://shell-window/main.css') {
    return cb(200, 'OK', 'text/css; charset=utf-8', path.join(__dirname, 'stylesheets/shell-window.css'))
  }
  if (requestUrl === 'broxme://location-bar/') {
    return cb(200, 'OK', 'text/html; charset=utf-8', path.join(__dirname, 'location-bar.html'))
  }
  if (requestUrl === 'broxme://shell-menus/') {
    return cb(200, 'OK', 'text/html; charset=utf-8', path.join(__dirname, 'shell-menus.html'))
  }
  if (requestUrl === 'broxme://perm-prompt/') {
    return cb(200, 'OK', 'text/html; charset=utf-8', path.join(__dirname, 'perm-prompt.html'))
  }
  if (requestUrl === 'broxme://modals/') {
    return cb(200, 'OK', 'text/html; charset=utf-8', path.join(__dirname, 'modals.html'))
  }
  if (requestUrl === 'broxme://assets/syntax-highlight.js') {
    return cb(200, 'OK', 'application/javascript; charset=utf-8', path.join(__dirname, 'assets/js/syntax-highlight.js'))
  }
  if (requestUrl === 'broxme://assets/syntax-highlight.css') {
    return cb(200, 'OK', 'text/css; charset=utf-8', path.join(__dirname, 'assets/css/syntax-highlight.css'))
  }
  if (requestUrl === 'broxme://assets/icons.css') {
    return cb(200, 'OK', 'text/css; charset=utf-8', path.join(__dirname, 'stylesheets/icons.css'))
  }
  if (requestUrl === 'broxme://assets/font-awesome.css') {
    return cb(200, 'OK', 'text/css; charset=utf-8', path.join(__dirname, 'stylesheets/fonts/font-awesome/css/all.min.css'))
  }
  if (requestUrl === 'broxme://assets/fa-regular-400.woff2') {
    return cb(200, 'OK', 'text/css; charset=utf-8', path.join(__dirname, 'assets/fonts/fa-regular-400.woff2'))
  }
  if (requestUrl === 'broxme://assets/fa-regular-400.woff') {
    return cb(200, 'OK', 'text/css; charset=utf-8', path.join(__dirname, 'assets/fonts/fa-regular-400.woff'))
  }
  if (requestUrl === 'broxme://assets/fa-regular-400.svg') {
    return cb(200, 'OK', 'text/css; charset=utf-8', path.join(__dirname, 'assets/fonts/fa-regular-400.svg'))
  }
  if (requestUrl === 'broxme://assets/fa-solid-900.woff2') {
    return cb(200, 'OK', 'text/css; charset=utf-8', path.join(__dirname, 'assets/fonts/fa-solid-900.woff2'))
  }
  if (requestUrl === 'broxme://assets/fa-solid-900.woff') {
    return cb(200, 'OK', 'text/css; charset=utf-8', path.join(__dirname, 'assets/fonts/fa-solid-900.woff'))
  }
  if (requestUrl === 'broxme://assets/fa-solid-900.svg') {
    return cb(200, 'OK', 'text/css; charset=utf-8', path.join(__dirname, 'assets/fonts/fa-solid-900.svg'))
  }
  if (requestUrl === 'broxme://assets/fa-brands-400.woff2') {
    return cb(200, 'OK', 'text/css; charset=utf-8', path.join(__dirname, 'assets/fonts/fa-brands-400.woff2'))
  }
  if (requestUrl === 'broxme://assets/fa-brands-400.woff') {
    return cb(200, 'OK', 'text/css; charset=utf-8', path.join(__dirname, 'assets/fonts/fa-brands-400.woff'))
  }
  if (requestUrl === 'broxme://assets/fa-brands-400.svg') {
    return cb(200, 'OK', 'text/css; charset=utf-8', path.join(__dirname, 'assets/fonts/fa-brands-400.svg'))
  }
  if (requestUrl === 'broxme://assets/font-photon-entypo') {
    return cb(200, 'OK', 'application/font-woff', path.join(__dirname, 'assets/fonts/photon-entypo.woff'))
  }
  if (requestUrl === 'broxme://assets/font-source-sans-pro') {
    return cb(200, 'OK', 'application/font-woff2', path.join(__dirname, 'assets/fonts/source-sans-pro.woff2'))
  }
  if (requestUrl === 'broxme://assets/font-source-sans-pro-le') {
    return cb(200, 'OK', 'application/font-woff2', path.join(__dirname, 'assets/fonts/source-sans-pro-le.woff2'))
  }
  if (requestUrl.startsWith('broxme://assets/logo2')) {
    return cb(200, 'OK', 'image/png', path.join(__dirname, 'assets/img/logo2.png'))
  }
  if (requestUrl.startsWith('broxme://assets/logo')) {
    return cb(200, 'OK', 'image/png', path.join(__dirname, 'assets/img/logo.png'))
  }
  if (requestUrl.startsWith('broxme://assets/favicons/')) {
    return serveICO(path.join(__dirname, 'assets/favicons', requestUrl.slice('broxme://assets/favicons/'.length)))
  }

  // template screenshots
  if (requestUrl.startsWith('broxme://templates/screenshot/')) {
    let templateUrl = requestUrl.slice('broxme://templates/screenshot/'.length)
    templates.getScreenshot(0, templateUrl)
      .then(({screenshot}) => {
        screenshot = screenshot.split(',')[1]
        cb(200, 'OK', 'image/png', () => Buffer.from(screenshot, 'base64'))
      })
      .catch(err => {
        console.error('Failed to load template screenshot', templateUrl, err)
        return cb(404, 'Not Found')
      })
    return
  }

  // builtin pages
  if (requestUrl === 'broxme://assets/builtin-pages.css') {
    return cb(200, 'OK', 'text/css; charset=utf-8', path.join(__dirname, 'stylesheets/builtin-pages.css'))
  }
  if (requestUrl.startsWith('broxme://assets/img/onboarding/')) {
    let imgPath = requestUrl.slice('broxme://assets/img/onboarding/'.length)
    return cb(200, 'OK', 'image/svg+xml', path.join(__dirname, `assets/img/onboarding/${imgPath}`))
  }
  if (requestUrl.startsWith('broxme://assets/img/templates/')) {
    let imgPath = requestUrl.slice('broxme://assets/img/templates/'.length)
    return cb(200, 'OK', 'image/png', path.join(__dirname, `assets/img/templates/${imgPath}`))
  }
  if (requestUrl.startsWith('broxme://assets/ace/') && requestUrl.endsWith('.js')) {
    let filePath = requestUrl.slice('broxme://assets/ace/'.length)
    return cb(200, 'OK', 'application/javascript', path.join(__dirname, `assets/js/ace-1.3.3/${filePath}`))
  }
  if (requestUrl === 'broxme://assets/icon/photos.png') {
    return cb(200, 'OK', 'image/png', path.join(__dirname, 'assets/img/icon/photos.png'))
  }
  if (requestUrl === 'broxme://assets/icon/avatar.svg') {
    return cb(200, 'OK', 'image/svg+xml', path.join(__dirname, 'assets/img/icon/avatar.svg'))
  }
  if (requestUrl === 'broxme://assets/icon/folder-color.png') {
    return cb(200, 'OK', 'image/png', path.join(__dirname, 'assets/img/icon/folder-color.png'))
  }
  if (requestUrl === 'broxme://assets/icon/grid.svg') {
    return cb(200, 'OK', 'image/svg+xml', path.join(__dirname, 'assets/img/icon/grid.svg'))
  }
  if (requestUrl === 'broxme://assets/icon/star.svg') {
    return cb(200, 'OK', 'image/svg+xml', path.join(__dirname, 'assets/img/icon/star.svg'))
  }
  if (requestUrl === 'broxme://assets/icon/filesystem.svg') {
    return cb(200, 'OK', 'image/svg+xml', path.join(__dirname, 'assets/img/icon/filesystem.svg'))
  }
  if (requestUrl === 'broxme://assets/icon/history.svg') {
    return cb(200, 'OK', 'image/svg+xml', path.join(__dirname, 'assets/img/icon/history.svg'))
  }
  if (requestUrl === 'broxme://assets/icon/gear.svg') {
    return cb(200, 'OK', 'image/svg+xml', path.join(__dirname, 'assets/img/icon/gear.svg'))
  }
  if (requestUrl === 'broxme://start/') {
    return cb(200, 'OK', 'text/html; charset=utf-8', path.join(__dirname, 'builtin-pages/start.html'))
  }
  if (requestUrl.startsWith('broxme://start/background-image-default')) {
    let imgPath = requestUrl.slice('broxme://start/background-image-default'.length)
    return cb(200, 'OK', 'image/png', path.join(__dirname, `assets/img/start${imgPath}`))
  }
  if (requestUrl === 'broxme://start/background-image') {
    return cb(200, 'OK', 'image/png', path.join(app.getPath('userData'), 'start-background-image'))
  }
  if (requestUrl === 'broxme://start/main.css') {
    return cb(200, 'OK', 'text/css; charset=utf-8', path.join(__dirname, 'stylesheets/builtin-pages/start.css'))
  }
  if (requestUrl === 'broxme://start/main.js') {
    return cb(200, 'OK', 'application/javascript; charset=utf-8', path.join(__dirname, 'builtin-pages/build/start.build.js'))
  }
  if (requestUrl === 'broxme://profile/main.js') {
    return cb(200, 'OK', 'application/javascript; charset=utf-8', path.join(__dirname, 'builtin-pages/build/profile.build.js'))
  }
  if (requestUrl === 'broxme://profile/' || requestUrl.startsWith('broxme://profile/')) {
    return cb(200, 'OK', 'text/html; charset=utf-8', path.join(__dirname, 'builtin-pages/profile.html'))
  }
  if (requestUrl === 'broxme://bookmarks/') {
    return cb(200, 'OK', 'text/html; charset=utf-8', path.join(__dirname, 'builtin-pages/bookmarks.html'))
  }
  if (requestUrl === 'broxme://bookmarks/main.js') {
    return cb(200, 'OK', 'application/javascript; charset=utf-8', path.join(__dirname, 'builtin-pages/build/bookmarks.build.js'))
  }
  if (requestUrl === 'broxme://history/') {
    return cb(200, 'OK', 'text/html; charset=utf-8', path.join(__dirname, 'builtin-pages/history.html'))
  }
  if (requestUrl === 'broxme://history/main.js') {
    return cb(200, 'OK', 'application/javascript; charset=utf-8', path.join(__dirname, 'builtin-pages/build/history.build.js'))
  }
  if (requestUrl === 'broxme://downloads/') {
    return cb(200, 'OK', 'text/html; charset=utf-8', path.join(__dirname, 'builtin-pages/downloads.html'))
  }
  if (requestUrl === 'broxme://downloads/main.js') {
    return cb(200, 'OK', 'application/javascript; charset=utf-8', path.join(__dirname, 'builtin-pages/build/downloads.build.js'))
  }
  // if (requestUrl === 'broxme://filesystem/main.css') {
  //   return cb(200, 'OK', 'text/css; charset=utf-8', path.join(__dirname, 'stylesheets/builtin-pages/filesystem.css'))
  // }
  // if (requestUrl === 'broxme://filesystem/main.js') {
  //   return cb(200, 'OK', 'application/javascript; charset=utf-8', path.join(__dirname, 'builtin-pages/build/filesystem.build.js'))
  // }
  // if (requestUrl === 'broxme://filesystem/' || requestUrl.startsWith('broxme://filesystem/')) {
  //   return cb(200, 'OK', 'text/html; charset=utf-8', path.join(__dirname, 'builtin-pages/filesystem.html'))
  // }
  if (requestUrl === 'broxme://library/main.css') {
    return cb(200, 'OK', 'text/css; charset=utf-8', path.join(__dirname, 'stylesheets/builtin-pages/library.css'))
  }
  if (requestUrl === 'broxme://library/main.js') {
    return cb(200, 'OK', 'application/javascript; charset=utf-8', path.join(__dirname, 'builtin-pages/build/library.build.js'))
  }
  if (requestUrl === 'broxme://library/view.js') {
    return cb(200, 'OK', 'application/javascript; charset=utf-8', path.join(__dirname, 'builtin-pages/build/library-view.build.js'))
  }
  if (requestUrl === 'broxme://library/') {
    return cb(200, 'OK', 'text/html; charset=utf-8', path.join(__dirname, 'builtin-pages/library.html'))
  }
  if (requestUrl.startsWith('broxme://library/')) {
    return cb(200, 'OK', 'text/html; charset=utf-8', path.join(__dirname, 'builtin-pages/library-view.html'))
  }
  // if (requestUrl === 'broxme://install-modal/main.css') {
  //   return cb(200, 'OK', 'text/css; charset=utf-8', path.join(__dirname, 'stylesheets/builtin-pages/install-modal.css'))
  // }
  // if (requestUrl === 'broxme://install-modal/main.js') {
  //   return cb(200, 'OK', 'application/javascript; charset=utf-8', path.join(__dirname, 'builtin-pages/build/install-modal.build.js'))
  // }
  // if (requestUrl === 'broxme://install-modal/' || requestUrl.startsWith('broxme://install-modal/')) {
  //   return cb(200, 'OK', 'text/html; charset=utf-8', path.join(__dirname, 'builtin-pages/install-modal.html'))
  // }
  if (requestUrl === 'broxme://view-source/main.css') {
    return cb(200, 'OK', 'text/css; charset=utf-8', path.join(__dirname, 'stylesheets/builtin-pages/view-source.css'))
  }
  if (requestUrl === 'broxme://view-source/main.js') {
    return cb(200, 'OK', 'application/javascript; charset=utf-8', path.join(__dirname, 'builtin-pages/build/view-source.build.js'))
  }
  if (requestUrl === 'broxme://view-source/' || requestUrl.startsWith('broxme://view-source/')) {
    return cb(200, 'OK', 'text/html; charset=utf-8', path.join(__dirname, 'builtin-pages/view-source.html'))
  }
  if (requestUrl === 'broxme://swarm-debugger/main.css') {
    return cb(200, 'OK', 'text/css; charset=utf-8', path.join(__dirname, 'stylesheets/builtin-pages/swarm-debugger.css'))
  }
  if (requestUrl === 'broxme://swarm-debugger/main.js') {
    return cb(200, 'OK', 'application/javascript; charset=utf-8', path.join(__dirname, 'builtin-pages/build/swarm-debugger.build.js'))
  }
  if (requestUrl === 'broxme://swarm-debugger/' || requestUrl.startsWith('broxme://swarm-debugger/')) {
    return cb(200, 'OK', 'text/html; charset=utf-8', path.join(__dirname, 'builtin-pages/swarm-debugger.html'))
  }
  if (requestUrl === 'broxme://settings/') {
    return cb(200, 'OK', 'text/html; charset=utf-8', path.join(__dirname, 'builtin-pages/settings.html'))
  }
  if (requestUrl === 'broxme://settings/main.js') {
    return cb(200, 'OK', 'application/javascript; charset=utf-8', path.join(__dirname, 'builtin-pages/build/settings.build.js'))
  }
  if (requestUrl === 'broxme://watchlist/main.css') {
    return cb(200, 'OK', 'text/css; charset=utf-8', path.join(__dirname, 'stylesheets/builtin-pages/watchlist.css'))
  }
  if (requestUrl === 'broxme://watchlist/main.js') {
    return cb(200, 'OK', 'application/javascript; charset=utf-8', path.join(__dirname, 'builtin-pages/build/watchlist.build.js'))
  }
  if (requestUrl === 'broxme://watchlist/') {
    return cb(200, 'OK', 'text/html; charset=utf-8', path.join(__dirname, 'builtin-pages/watchlist.html'))
  }

  // debugging
  if (requestUrl === 'broxme://internal-archives/') {
    return cb(200, 'OK', 'text/html; charset=utf-8', archivesDebugPage)
  }
  if (requestUrl === 'broxme://dat-dns-cache/') {
    return cb(200, 'OK', 'text/html; charset=utf-8', datDnsCachePage)
  }
  if (requestUrl === 'broxme://dat-dns-cache/main.js') {
    return cb(200, 'OK', 'application/javascript; charset=utf-8', datDnsCacheJS)
  }
  if (requestUrl.startsWith('broxme://debug-log/')) {
    const PAGE_SIZE = 1e6
    var start = queryParams.start ? (+queryParams.start) : 0
    let content = await beakerCore.getLogFileContent(start, start + PAGE_SIZE)
    var pagination = `<h2>Showing bytes ${start} - ${start + PAGE_SIZE}. <a href="broxme://debug-log/?start=${start + PAGE_SIZE}">Next page</a></h2>`
    return respond({
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Security-Policy': BEAKER_CSP,
        'Access-Control-Allow-Origin': '*'
      },
      data: intoStream(`
        ${pagination}
        <pre>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
        ${pagination}
      `)
    })
  }

  return cb(404, 'Not Found')
}
