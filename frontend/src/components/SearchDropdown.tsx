import { useApolloClient } from '@apollo/client'
import { Autocomplete, Box, CircularProgress, TextField, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { SearchFilesDocument } from '../graphql/generated'
import type { SearchFilesQuery } from '../graphql/generated'
import { formatSize } from '../utils/format'

const PAGE_SIZE = 12

type SearchItem = SearchFilesQuery['searchFiles']['items'][number]

type SearchDropdownProps = {
  onSelect: (item: SearchItem) => void
}

export const SearchDropdown = ({ onSelect }: SearchDropdownProps) => {
  const client = useApolloClient()
  const [term, setTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [options, setOptions] = useState<SearchItem[]>([])

  useEffect(() => {
    const cleaned = term.trim()
    if (!cleaned) {
      setOptions([])
      setLoading(false)
      return
    }

    setLoading(true)
    const timer = window.setTimeout(async () => {
      try {
        const { data } = await client.query({
          query: SearchFilesDocument,
          variables: { query: cleaned, offset: 0, limit: PAGE_SIZE },
          fetchPolicy: 'network-only',
        })
        setOptions(data.searchFiles.items)
      } catch (err) {
        console.error(err)
        setOptions([])
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => window.clearTimeout(timer)
  }, [client, term])

  return (
    <Autocomplete
      sx={{ minWidth: 280, width: { xs: '100%', sm: 360 } }}
      options={options}
      getOptionLabel={(option) => option.name}
      filterOptions={(items) => items}
      loading={loading}
      inputValue={term}
      onInputChange={(_, value) => {
        setTerm(value)
      }}
      onChange={(_, value) => {
        if (!value) return
        onSelect(value)
        setTerm('')
        setOptions([])
      }}
      noOptionsText={term.trim() ? 'No files found' : 'Type to search files'}
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          placeholder="Search files by name"
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={16} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, option) => (
        <li {...props} key={option.id}>
          <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
              <Typography variant="subtitle2" noWrap title={option.name}>
                {option.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatSize(option.size)}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" noWrap>
              {option.dataroomName}
              {option.folderName ? ` / ${option.folderName}` : ''}
            </Typography>
          </Box>
        </li>
      )}
    />
  )
}
