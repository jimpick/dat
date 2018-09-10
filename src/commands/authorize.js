module.exports = {
  name: 'authorize',
  command: authorize,
  help: [
    'Authorize another writer to write to the archive.',
    '',
    'Usage: dat authorize [<key>]'
  ].join('\n'),
  options: []
}

function authorize (opts) {
  var Dat = require('@jimpick/dat-node')
  var parseArgs = require('../parse-args')
  var linkResolve = require('dat-link-resolve')

  opts.remoteKey = opts._[0]
  if (!opts.dir) {
    opts.dir = parseArgs(opts).dir || process.cwd()
  }
  opts.createIfMissing = false // must always be a resumed archive

  if (!opts.remoteKey) {
    console.error('dat authorize needs a key')
    process.exit(1)
  }

  linkResolve(opts.remoteKey, function (err, remoteKeyString) {
    if (err) exitErr(err)
    var remoteKey = Buffer.from(remoteKeyString, 'hex')
    Dat(opts.dir, opts, function (err, dat) {
      if (err) exitErr(err)
      if (!dat.archive.db) {
        exitErr('dat authorize only works with multiwriter archives')
      }
      dat.archive.db.authorize(remoteKey, function (err) {
        if (err) exitErr(err)
        dat.archive.db.authorized(remoteKey, function (err, authorized) {
          if (err) exitErr(err)
          if (!authorized) exitErr('Authorization failed')
          console.log('Authorization succeeded.')
          process.exit(0)
        })
      })
    })
  })
}

function exitErr (err) {
  console.error(err)
  process.exit(1)
}
