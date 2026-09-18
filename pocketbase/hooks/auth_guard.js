onRecordAuthWithPasswordRequest((e) => {
  if (e.record && e.record.get('active') === false) {
    throw new BadRequestError('Esta conta está inativa.')
  }
  return e.next()
}, 'users')
