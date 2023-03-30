// used in url to indicate data source
enum DataSource {
  Remote = 'remote',
  Browser = 'browser',
  // Disk = 'disk', no disk source because it will not appear in URL
}

// displayed data mode
enum DataMode {
  Raw = 'raw', // json file from remote
  Server = 'server', // csv file from remote
  File = 'file', // local csv file on disk
  Custom = 'custom', // local json file on disk
  History = 'history', // local csv file in browser (no local json file)
}

export { DataMode, DataSource }
