import yo from 'yo-yo'
import toggleable from './toggleable'

function getIcon (page) {
  switch (page) {
    case 'Library':
      return yo`<i class="fa fa-book"></i>`
    case 'Bookmarks':
      return yo`<i class="far fa-star"></i>`
    case 'History':
      return yo`<i class="fa fa-history"></i>`
    case 'Downloads':
      return yo`<i class="fa fa-download"></i>`
    case 'Settings':
      return yo`<i class="fas fa-cog"></i>`
    case 'Watchlist':
      return yo`<i class="fa fa-eye"></i>`
    default:
      return ''
  }
}

export default function render (currentPage = '') {
  return toggleable(yo`
    <div
      class="dropdown toggleable-container builtin-pages-nav"
      data-toggle-id="builtin-pages-nav-menu"
    >
      <button class="btn transparent toggleable">
        <h1>
          ${getIcon(currentPage)}
          ${currentPage}
        </h1>

        <i class="fa fa-caret-down"></i>
      </button>

      <div class="dropdown-items subtle-shadow left">
        ${currentPage !== 'Library'
          ? yo`
            <a href="broxme://library" class="dropdown-item">
              <i class="fa fa-book"></i>
              <span>Library</span>
            </a>`
          : ''
        }

        ${currentPage !== 'Bookmarks'
          ? yo`
            <a href="broxme://bookmarks" class="dropdown-item">
              <i class="far fa-star"></i>
              <span>Bookmarks</span>
            </a>`
          : ''
        }

        ${currentPage !== 'History'
          ? yo`
            <a href="broxme://history" class="dropdown-item">
              <i class="fa fa-history"></i>
              <span>History</span>
            </a>`
          : ''
        }

        ${currentPage !== 'Downloads'
          ? yo`
            <a href="broxme://downloads" class="dropdown-item">
              <i class="fa fa-download"></i>
              <span>Downloads</span>
            </a>`
          : ''
        }
        
        ${currentPage !== 'Watchlist'
          ? yo`
            <a href="broxme://watchlist" class="dropdown-item">
              <i class="fa fa-eye"></i>
              <span>Watchlist</span>
            </a>`
          : ''
        }

        ${currentPage !== 'Settings'
          ? yo`
            <a href="broxme://settings" class="dropdown-item ${currentPage === 'settings' ? 'active' : ''}">
              <i class="fas fa-cog"></i>
              <span>Settings</span>
            </a>`
          : ''
        }
      </div>
    </div>
  `)
}
