var debug = require('debug')('dat')
var xtend = Object.assign

module.exports = trackDownload

function trackDownload (state, bus) {
  if (state.hasContent || state.dat.archive.db) return track()
  bus.once('archive:content', track)

  function track () {
    var archive = state.dat.archive

    state.download = xtend({
      modified: false,
      nsync: false
    }, {})

    if (archive.db) {
      // FIXME: Need lifecycle events
      var intervalId = setInterval(function () {
        var stats = state.stats.get()
        if (stats.downloaded === stats.length) {
          // Downloaded
          clearInterval(intervalId)
          if (state.opts.exit) {
            state.exiting = true
            bus.render()
            console.log()
            process.exit(0)
          }
          state.download.nsync = true
        }
      }, 1000)
    } else {
      archive.content.on('clear', function () {
        debug('archive clear')
        state.download.modified = true
      })

      archive.content.on('download', function (index, data) {
        state.download.modified = true
      })

      archive.on('syncing', function () {
        debug('archive syncing')
        state.download.nsync = false
      })

      archive.on('sync', function () {
        debug('archive sync', state.stats.get())
        state.download.nsync = true
        var shouldExit = (state.download.modified && state.opts.exit)
        if (shouldExit) return exit()
        if (state.dat.archive.version === 0) {
          // TODO: deal with this.
          // Sync sometimes fires early when it should wait for update.
        }
        bus.emit('render')
      })

      archive.on('update', function () {
        debug('archive update')
        bus.emit('render')
      })
    }

    function exit () {
      if (state.stats.get().version !== archive.version) {
        return state.stats.on('update', exit)
      }
      state.exiting = true
      bus.render()
      console.log()
      process.exit(0)
    }
  }
}
