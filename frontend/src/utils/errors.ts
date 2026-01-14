type GraphQLErrorShape = {
  message?: unknown
}

type NetworkErrorShape = {
  message?: unknown
  result?: {
    errors?: GraphQLErrorShape[]
  }
}

type ApolloErrorShape = {
  graphQLErrors?: GraphQLErrorShape[]
  networkError?: NetworkErrorShape
  message?: unknown
}

export const getGraphQLErrorMessage = (err: unknown) => {
  if (!err || typeof err !== 'object') return null
  const apolloError = err as ApolloErrorShape

  if (Array.isArray(apolloError.graphQLErrors) && apolloError.graphQLErrors.length > 0) {
    const message = apolloError.graphQLErrors
      .map((item) => (item?.message ? String(item.message) : ''))
      .filter(Boolean)
      .join(' ')
    if (message) return message
  }

  if (apolloError.networkError) {
    const network = apolloError.networkError
    const networkMessage = network.result?.errors?.[0]?.message
    if (networkMessage) return String(networkMessage)
    if (network.message) return String(network.message)
  }

  return null
}

export const getErrorMessage = (err: unknown) => {
  const graphQLError = getGraphQLErrorMessage(err)
  if (graphQLError) return graphQLError
  if (typeof err === 'string') return err
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message?: unknown }).message)
  }
  return 'Something went wrong. Try again.'
}
