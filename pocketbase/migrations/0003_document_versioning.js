migrate(
  (app) => {
    console.log('0003 migration isolation probe reached')
  },
  (app) => {
    console.log('0003 migration isolation probe rollback')
  },
)
