export const getErrorMessage = (err: unknown) => {
  if (typeof err === 'string') return err
  if (err && typeof err === 'object' && 'message' in err) {
    return String(err.message)
  }
  return 'Something went wrong. Try again.'
}
