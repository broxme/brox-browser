import * as yo from 'yo-yo'
import Sortable from 'sortablejs'
import * as addPinnedBookmarkPopup from '../com/settings/add-pinned-bookmark-popup'
import * as editBookmarkPopup from '../com/settings/edit-bookmark-popup'
import * as MOTD from '../com/motd'
import * as onboardingPopup from '../com/onboarding-popup'
import * as contextMenu from '../com/context-menu'
import * as toast from '../com/toast'
import {findParent, writeToClipboard} from '../../lib/fg/event-handlers'

const LATEST_VERSION = 1001003 // semver where major*1mm and minor*1k; thus 3.2.1 = 3002001
const RELEASE_NOTES_URL = 'https://github.com/broxme/brox/releases/tag/1.1.3'

// globals
// =

var pinnedBookmarks = []
var searchResults = []
var query = ''
var activeSearchResult = 0
var isSearchFocused = false
var settings
var hasDismissedOnboarding = localStorage.hasDismissedOnboarding ? true : false

update()
setup()
async function setup () {
  settings = await beaker.browser.getSettings()

  // open onboarding popup if this is the first render
  if (!hasDismissedOnboarding) onboardingPopup.create()

  // open update info if appropriate
  if (!settings.no_welcome_tab) {
    let latestVersion = await beaker.sitedata.get('broxme://start', 'latest-version')
    if (+latestVersion && +latestVersion < LATEST_VERSION) {
      await beaker.sitedata.set('broxme://start', 'latest-version', LATEST_VERSION)
      window.open(RELEASE_NOTES_URL)
    }
  }

  await loadBookmarks()
  MOTD.load()
  update()
}

// events
// =



async function onClickSettinsButton () {
   window.location = `broxme://settings/#general`
}

function onFocusSearch () {
  isSearchFocused = true
  update()

  window.addEventListener('click', onClickWhileSearchFocused)
}

function onClickWhileSearchFocused (e) {
  if (findParent(e.target, 'search-results') || findParent(e.target, 'search')) {
    return
  } else {
    isSearchFocused = false
    window.removeEventListener('click', onClickWhileSearchFocused)
    update()
  }
}

function onClickSubmitActiveSearch () {
  if (!query || !searchResults) return
  window.location = searchResults[activeSearchResult].targetUrl
}

function onInputSearch (e) {
  // enter
  if (e.keyCode === 13) {
    // ENTER
    window.location = searchResults[activeSearchResult].targetUrl
  } else if (e.keyCode === 40) {
    // DOWN
    activeSearchResult += 1

    // make sure we don't go out of bounds
    if (activeSearchResult > searchResults.length - 1) {
      activeSearchResult = searchResults.length - 1
    }
    update()
  } else if (e.keyCode === 38) {
    // UP
    activeSearchResult -= 1

    // make sure we don't go out of bounds
    if (activeSearchResult < 0) {
      activeSearchResult = 0
    }
    update()
  } else {
    onUpdateSearchQuery(e.target.value)
  }
}

async function onUpdateSearchQuery (q) {
  searchResults = []
  activeSearchResult = 0
  query = q.length ? q.toLowerCase() : ''

  if (query.length) {
    // fetch library archives
    // filter by title, URL
    let libraryResults = await beaker.archives.list({isNetworked: true})
    libraryResults = libraryResults.filter(a => (a.url.includes(query) || (a.title && a.title.toLowerCase().includes(query)))).slice(0, 3)
    libraryResults = libraryResults.map(a => {
      return {
        title: a.title,
        faviconUrl: a.url,
        targetUrl: a.url,
        label: 'Saved to Library'
      }
    })
    searchResults = searchResults.concat(libraryResults)

    // fetch history
    let historyResults = await beaker.history.search(query)
    historyResults = historyResults.slice(0, 6)
    historyResults = historyResults.map(r => {
      return {
        title: r.title,
        faviconUrl: r.url,
        targetUrl: r.url,
        label: r.url
      }
    })
    searchResults = searchResults.concat(historyResults)

    // add a DuckDuckGo search to the results
    const ddgRes = {
      title: query,
      targetUrl: `https://duckduckgo.com?q=${encodeURIComponent(query)}`,
      icon: 'fa fa-search',
      label: 'Search DuckDuckGo',
      class: 'ddg'
    }
    searchResults.push(ddgRes)
  }

  update()
}

async function onClickAddBookmark (e) {
  try {
    var b = await addPinnedBookmarkPopup.create()
    if (!(await beaker.bookmarks.isBookmarked(b.url))) {
      await beaker.bookmarks.bookmarkPrivate(b.url, {title: b.title})
    }
    await beaker.bookmarks.setBookmarkPinned(b.url, true)
    await loadBookmarks()
    update()
  } catch (e) {
    // ignore
    console.log(e)
  }
}

async function onClickEditBookmark (bOriginal) {
  try {
    // render popup
    var b = await editBookmarkPopup.create(bOriginal.href, bOriginal)

    // delete old bookmark if url changed
    if (bOriginal.href !== b.href) {
      await beaker.bookmarks.unbookmarkPrivate(bOriginal.href)
    }

    // set the bookmark
    await beaker.bookmarks.bookmarkPrivate(b.href, b)
    await beaker.bookmarks.setBookmarkPinned(b.href, b.pinned)

    await loadBookmarks()
    update()
  } catch (e) {
    // ignore
    console.log(e)
  }
}

async function onClickDeleteBookmark (bookmark) {
  await beaker.bookmarks.unbookmarkPrivate(bookmark.href)
  await loadBookmarks()
  update()

  async function undo () {
    await beaker.bookmarks.bookmarkPrivate(bookmark.href, bookmark)
    await beaker.bookmarks.setBookmarkPinned(bookmark.href, bookmark.pinned)
    await loadBookmarks()
    update()
  }

  toast.create('Bookmark deleted', '', 10e3, {label: 'Undo', click: undo})
}

async function onContextmenuPinnedBookmark (e, bookmark) {
  e.preventDefault()
  var url = e.currentTarget.getAttribute('href')
  const items = [
    {icon: 'fa fa-external-link-alt', label: 'Open Link in New Tab', click: () => window.open(url)},
    {icon: 'fa fa-link', label: 'Copy Link Address', click: () => writeToClipboard(url)},
    {icon: 'fa fa-pencil-alt', label: 'Edit', click: () => onClickEditBookmark(bookmark)},
    {icon: 'fa fa-trash', label: 'Delete', click: () => onClickDeleteBookmark(bookmark)}
  ]
  await contextMenu.create({x: e.clientX, y: e.clientY, items})
}

// rendering
// =

function update () {
  // TODO(bgimg) restore when background images are restored -prf
  // var theme = settings.start_page_background_image

  yo.update(document.querySelector('.window-content.start'), yo`
    <div class="window-content builtin start ${''/* TODO(bgimg) theme */}">
      <div class="builtin-wrapper start-wrapper">
        <div class="header-actions">
          ${renderSettingsButton()}
        </div>
        ${MOTD.render()}
        <div class="autocomplete-container search-container">
          <input type="text" autofocus onfocus=${onFocusSearch} class="search" placeholder="Search the Web, your bookmarks, and more" onkeyup=${(e) => delay(onInputSearch, e)}/>
          <i class="fa fa-search"></i>

          <button class="btn primary search-btn" title="Submit Search" onclick=${onClickSubmitActiveSearch}>
            <i class="fa fa-arrow-right"></i>
          </button>

          ${query.length && isSearchFocused ? yo`
            <div class="search-results autocomplete-results">${searchResults.map(renderSearchResult)}</div>`
          : ''}
        </div>  		
        ${renderDock()}

      </div>
    </div>
  `)

  addSorting()
}

function renderSettingsButton () {
  return yo`
    <button class="btn plain help" title="Settings" onclick=${onClickSettinsButton}>
      <i class="fa fa-cog"></i>
    </button>`
}

function renderSearchResult (res, i) {
  return yo`
    <a href=${res.targetUrl} class="autocomplete-result search-result ${i === activeSearchResult ? 'active' : ''} ${res.class}">
      ${res.faviconUrl
        ? yo`<img class="icon favicon" src="beaker-favicon:32,${res.faviconUrl}"/>`
        : yo`<i class="icon ${res.icon}"></i>`
      }

      <span class="title">${res.title}</span>

      ${res.label ? yo`<span class="label">— ${res.label || ''}</span>` : ''}
    </a>
  `
}

function renderDock () {
  return yo`
    <div class="dock-wrapper">
      <div class="dock">
      
        <a class="dock-item" title="History" href="broxme://history">
          History
        </a>
		<span class="dock-separator">|</span>
        <a class="dock-item" title="Bookmark" href="broxme://bookmarks">
          Bookmarks
        </a>		
       
      </div>
    </div>
  `
}





// helpers
// =

function delay (cb, param) {
  window.clearTimeout(cb)
  setTimeout(cb, 75, param)
}


