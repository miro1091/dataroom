import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ApolloClient, ApolloLink, ApolloProvider, InMemoryCache } from '@apollo/client'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { setContext } from '@apollo/client/link/context'
import { createUploadLink } from 'apollo-upload-client'
import './index.css'
import App from './App.tsx'
import { AUTH_TOKEN_KEY } from './constants/auth'
import { API_GRAPHQL_URL } from './constants/env'
import { appTheme } from './theme'

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  return {
    headers: {
      ...headers,
      Authorization: token ? `Bearer ${token}` : '',
    },
  }
})

const uploadLink = createUploadLink({
  uri: API_GRAPHQL_URL,
  credentials: 'include',
}) as unknown as ApolloLink

const link = authLink.concat(uploadLink)

const client = new ApolloClient({
  link,
  cache: new InMemoryCache(),
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ApolloProvider client={client}>
      <ThemeProvider theme={appTheme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </ApolloProvider>
  </StrictMode>,
)
