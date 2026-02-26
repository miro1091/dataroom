import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import {
  useCreateDataroomMutation,
  useCreateFolderMutation,
  useDataroomsQuery,
  useDeleteDataroomMutation,
  useDeleteFilesMutation,
  useDeleteFileMutation,
  useDeleteFolderMutation,
  useFolderBreadcrumbQuery,
  useFolderContentsQuery,
  useRenameDataroomMutation,
  useRenameFileMutation,
  useRenameFolderMutation,
  useUploadFileMutation,
} from '../graphql/generated'
import type { ApiDataroom, ApiFile, ApiFolder } from '../types/graphql'
import type { DialogState, Notice } from '../types/ui'
import { NOTICE_TIMEOUT_MS } from '../constants/ui'
import { getErrorMessage, getGraphQLErrorMessage } from '../utils/errors'

const DEFAULT_FILE_PAGE_SIZE = 20
const FILE_PAGE_SIZE_OPTIONS = [10, 20, 50] as const

export type DriveSortColumn = 'name' | 'type' | 'size' | 'createdAt' | 'updatedAt'
export type DriveSortDirection = 'asc' | 'desc'
export const DRIVE_PAGE_SIZE_OPTIONS = FILE_PAGE_SIZE_OPTIONS

const parseNullableInt = (value: string | null): number | null => {
  if (!value) return null
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? null : parsed
}

const parseLocationPath = (pathname: string) => {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length < 2 || segments[0] !== 'datarooms') {
    return { dataroomId: null as number | null, folderId: null as number | null }
  }

  const dataroomId = parseNullableInt(segments[1])
  if (segments.length >= 4 && segments[2] === 'folders') {
    const folderId = parseNullableInt(segments[3])
    return { dataroomId, folderId }
  }

  return { dataroomId, folderId: null as number | null }
}

const buildLocationPath = (dataroomId: number | null, folderId: number | null) => {
  if (!dataroomId) return '/'
  if (folderId) return `/datarooms/${dataroomId}/folders/${folderId}`
  return `/datarooms/${dataroomId}`
}

const readLocationState = () => {
  if (typeof window === 'undefined') {
    return { dataroomId: null as number | null, folderId: null as number | null }
  }
  return parseLocationPath(window.location.pathname)
}

export const useDataroomState = () => {
  const { data: dataroomData, loading: dataroomLoading, error: dataroomError, refetch: refetchDatarooms } =
    useDataroomsQuery()
  const datarooms: ApiDataroom[] = useMemo(() => dataroomData?.datarooms ?? [], [dataroomData])

  const initialLocation = readLocationState()
  const [selectedDataroomId, setSelectedDataroomId] = useState<number | null>(initialLocation.dataroomId)
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(initialLocation.folderId)
  const [selectedFile, setSelectedFile] = useState<ApiFile | null>(null)
  const [highlightFileId, setHighlightFileId] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<DriveSortColumn>('name')
  const [sortDirection, setSortDirection] = useState<DriveSortDirection>('asc')
  const [filePage, setFilePage] = useState(0)
  const [filePageSize, setFilePageSize] = useState<number>(DEFAULT_FILE_PAGE_SIZE)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [dialog, setDialog] = useState<DialogState | null>(null)
  const [dialogValue, setDialogValue] = useState('')
  const [dialogBusy, setDialogBusy] = useState(false)
  const [dialogError, setDialogError] = useState('')
  const lastQueryErrorRef = useRef<string | null>(null)
  const fileOffset = filePage * filePageSize

  const normalizeName = (name: string) => name.trim().toLowerCase()
  const ensureUniqueName = (items: Array<{ id: number; name: string }>, name: string, currentId?: number) => {
    const normalized = normalizeName(name)
    if (!normalized) return
    const duplicate = items.some(
      (item) => item.id !== currentId && normalizeName(item.name) === normalized
    )
    if (duplicate) {
      throw new Error('A folder or dataroom with this name already exists.')
    }
  }

  const {
    data: contentsData,
    previousData: previousContentsData,
    loading: contentsLoading,
    error: contentsError,
    refetch: refetchContents,
  } =
    useFolderContentsQuery({
      variables: {
        dataroomId: selectedDataroomId ?? 0,
        parentId: currentFolderId,
        sortBy,
        sortDirection,
        fileOffset,
        fileLimit: filePageSize,
      },
      skip: !selectedDataroomId,
      fetchPolicy: 'cache-and-network',
    })

  const { data: breadcrumbData } = useFolderBreadcrumbQuery({
    variables: { folderId: currentFolderId ?? 0 },
    skip: !currentFolderId,
  })

  const [createDataroom] = useCreateDataroomMutation()
  const [renameDataroom] = useRenameDataroomMutation()
  const [deleteDataroom] = useDeleteDataroomMutation()
  const [createFolder] = useCreateFolderMutation()
  const [renameFolder] = useRenameFolderMutation()
  const [deleteFolder] = useDeleteFolderMutation()
  const [uploadFile] = useUploadFileMutation()
  const [renameFile] = useRenameFileMutation()
  const [deleteFile] = useDeleteFileMutation()
  const [deleteFiles] = useDeleteFilesMutation()

  const folderContents = contentsData?.folderContents ?? previousContentsData?.folderContents
  const activeDataroom = datarooms.find((room) => room.id === selectedDataroomId) ?? null
  const folders: ApiFolder[] = useMemo(
    () => folderContents?.folders ?? [],
    [folderContents],
  )
  const files: ApiFile[] = useMemo(() => folderContents?.files ?? [], [folderContents])
  const contentsItems = useMemo(() => folderContents?.items ?? [], [folderContents])
  const filesTotal = folderContents?.filesTotal ?? 0
  const filesHasMore = folderContents?.filesHasMore ?? false

  useEffect(() => {
    const onPopState = () => {
      const routeState = readLocationState()
      setSelectedDataroomId(routeState.dataroomId)
      setCurrentFolderId(routeState.folderId)
      setSelectedFile(null)
      setHighlightFileId(null)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    const nextUrl = buildLocationPath(selectedDataroomId, currentFolderId)
    if (window.location.pathname === nextUrl) return
    window.history.pushState({}, '', nextUrl)
  }, [selectedDataroomId, currentFolderId])

  useEffect(() => {
    if (!datarooms.length) {
      setSelectedDataroomId(null)
      setCurrentFolderId(null)
      return
    }
    if (!selectedDataroomId || !datarooms.some((room) => room.id === selectedDataroomId)) {
      setSelectedDataroomId(datarooms[0].id)
      setCurrentFolderId(null)
    }
  }, [datarooms, selectedDataroomId])

  useEffect(() => {
    setSelectedFile(null)
  }, [selectedDataroomId, currentFolderId])

  useEffect(() => {
    setFilePage(0)
  }, [selectedDataroomId, currentFolderId, sortBy, sortDirection, filePageSize])

  useEffect(() => {
    if (!selectedFile) return
    const refreshed = files.find((item) => item.id === selectedFile.id)
    setSelectedFile(refreshed ?? null)
  }, [files, selectedFile])

  useEffect(() => {
    if (!folderContents) return
    const maxPage = Math.max(Math.ceil(filesTotal / filePageSize) - 1, 0)
    if (filePage > maxPage) {
      setFilePage(maxPage)
    }
  }, [filePage, filePageSize, filesTotal, folderContents])


  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), NOTICE_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    const queryError = dataroomError ?? contentsError
    if (!queryError) {
      lastQueryErrorRef.current = null
      return
    }
    const message = getGraphQLErrorMessage(queryError)
    if (!message || message === lastQueryErrorRef.current) return
    lastQueryErrorRef.current = message
    setNotice({ type: 'error', message })
  }, [contentsError, dataroomError])

  useEffect(() => {
    if (dialog?.kind === 'input') {
      setDialogValue(dialog.defaultValue ?? '')
    }
    setDialogError('')
  }, [dialog])

  const breadcrumb = useMemo(() => {
    if (!currentFolderId) return []
    return breadcrumbData?.folderBreadcrumb ?? []
  }, [breadcrumbData, currentFolderId])

  const openInputDialog = (config: DialogState & { kind: 'input' }) => setDialog(config)
  const openConfirmDialog = (config: DialogState & { kind: 'confirm' }) => setDialog(config)
  const closeDialog = () => setDialog(null)

  const handleDialogConfirm = async () => {
    if (!dialog) return
    setDialogBusy(true)
    setDialogError('')
    try {
      if (dialog.kind === 'input') {
        await dialog.onConfirm(dialogValue.trim())
      } else {
        await dialog.onConfirm()
      }
      setDialog(null)
    } catch (err) {
      const graphQLError = getGraphQLErrorMessage(err)
      if (graphQLError) {
        setNotice({ type: 'error', message: graphQLError })
      } else {
        setDialogError(getErrorMessage(err))
      }
    } finally {
      setDialogBusy(false)
    }
  }

  const handleCreateDataroom = async (name: string) => {
    if (!name) throw new Error('Name is required.')
    ensureUniqueName(datarooms, name)
    const result = await createDataroom({ variables: { name } })
    await refetchDatarooms()
    const created = result.data?.createDataroom
    if (created) {
      setSelectedDataroomId(created.id)
      setCurrentFolderId(null)
      setNotice({ type: 'success', message: 'Dataroom created.' })
    }
  }

  const handleRenameDataroom = async (room: ApiDataroom, name: string) => {
    if (!name) throw new Error('Name is required.')
    ensureUniqueName(datarooms, name, room.id)
    await renameDataroom({ variables: { id: room.id, name } })
    await refetchDatarooms()
    setNotice({ type: 'success', message: 'Dataroom renamed.' })
  }

  const handleDeleteDataroom = async (room: ApiDataroom) => {
    await deleteDataroom({ variables: { id: room.id } })
    await refetchDatarooms()
    setNotice({ type: 'success', message: 'Dataroom deleted.' })
  }

  const handleCreateFolder = async (name: string) => {
    if (!selectedDataroomId) throw new Error('Select a dataroom first.')
    if (!name) throw new Error('Name is required.')
    ensureUniqueName(folders, name)
    await createFolder({
      variables: { dataroomId: selectedDataroomId, parentId: currentFolderId, name },
    })
    await refetchContents()
    setNotice({ type: 'success', message: 'Folder created.' })
  }

  const handleRenameFolder = async (folder: ApiFolder, name: string) => {
    if (!name) throw new Error('Name is required.')
    ensureUniqueName(folders, name, folder.id)
    await renameFolder({ variables: { id: folder.id, name } })
    await refetchContents()
    setNotice({ type: 'success', message: 'Folder renamed.' })
  }

  const handleDeleteFolder = async (folder: ApiFolder) => {
    await deleteFolder({ variables: { id: folder.id } })
    if (currentFolderId === folder.id) {
      const parent = breadcrumb.length > 1 ? breadcrumb[breadcrumb.length - 2] : null
      setCurrentFolderId(parent?.id ?? null)
    }
    await refetchContents()
    setNotice({ type: 'success', message: 'Folder deleted.' })
  }

  const handleDeleteFolders = async (ids: number[]) => {
    const uniqueIds = Array.from(new Set(ids.filter((id) => id > 0)))
    if (uniqueIds.length === 0) return
    for (const id of uniqueIds) {
      await deleteFolder({ variables: { id } })
    }
    await refetchContents()
    setNotice({ type: 'success', message: `Deleted ${uniqueIds.length} folder(s).` })
  }

  const handleUploadFiles = async (uploads: globalThis.File[]) => {
    if (!uploads.length) return
    if (!selectedDataroomId) {
      setNotice({ type: 'error', message: 'Select a dataroom before uploading.' })
      return
    }

    let uploadedCount = 0
    let failedCount = 0

    for (const upload of uploads) {
      if (!upload.name.toLowerCase().endsWith('.pdf')) {
        failedCount += 1
        continue
      }
      try {
        await uploadFile({
          variables: {
            dataroomId: selectedDataroomId,
            folderId: currentFolderId,
            file: upload,
          },
        })
        uploadedCount += 1
      } catch (err) {
        console.error(err)
        failedCount += 1
      }
    }

    if (uploadedCount > 0) {
      await refetchContents()
      const suffix = failedCount > 0 ? ` ${failedCount} file(s) failed validation.` : ''
      setNotice({ type: 'success', message: `Uploaded ${uploadedCount} file(s).${suffix}` })
      return
    }
    setNotice({ type: 'error', message: 'No files uploaded. Only valid PDF files are allowed.' })
  }

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const uploads = Array.from(event.target.files ?? [])
    try {
      await handleUploadFiles(uploads)
    } catch (err) {
      setNotice({ type: 'error', message: getErrorMessage(err) })
    } finally {
      event.target.value = ''
    }
  }

  const handleRenameFile = async (file: ApiFile, name: string) => {
    if (!name) throw new Error('Name is required.')
    await renameFile({ variables: { id: file.id, name } })
    await refetchContents()
    setNotice({ type: 'success', message: 'File renamed.' })
  }

  const handleDeleteFile = async (file: ApiFile) => {
    await deleteFile({ variables: { id: file.id } })
    if (selectedFile?.id === file.id) {
      setSelectedFile(null)
    }
    await refetchContents()
    setNotice({ type: 'success', message: 'File deleted.' })
  }

  const handleDeleteFiles = async (ids: number[]) => {
    const uniqueIds = Array.from(new Set(ids.filter((id) => id > 0)))
    if (uniqueIds.length === 0) return
    const result = await deleteFiles({ variables: { ids: uniqueIds } })
    if (selectedFile && uniqueIds.includes(selectedFile.id)) {
      setSelectedFile(null)
    }
    await refetchContents()
    const deletedCount = result.data?.deleteFiles ?? uniqueIds.length
    setNotice({ type: 'success', message: `Deleted ${deletedCount} file(s).` })
  }

  const openFileLocation = (dataroomId: number, folderId: number | null, fileId: number) => {
    setSelectedDataroomId(dataroomId)
    setCurrentFolderId(folderId)
    setSelectedFile(null)
    setHighlightFileId(fileId)
  }

  return {
    datarooms,
    dataroomLoading,
    dataroomError,
    activeDataroom,
    selectedDataroomId,
    currentFolderId,
    breadcrumb,
    folders,
    files,
    contentsItems,
    contentsLoading,
    contentsError,
    selectedFile,
    highlightFileId,
    sortBy,
    sortDirection,
    filePage,
    filePageSize,
    filesTotal,
    filesHasMore,
    notice,
    dialog,
    dialogValue,
    dialogBusy,
    dialogError,
    setSelectedDataroomId,
    setCurrentFolderId,
    setSelectedFile,
    setHighlightFileId,
    setSortBy,
    setSortDirection,
    setFilePage,
    setFilePageSize: (size: number) =>
      setFilePageSize(
        FILE_PAGE_SIZE_OPTIONS.includes(size as (typeof FILE_PAGE_SIZE_OPTIONS)[number])
          ? size
          : DEFAULT_FILE_PAGE_SIZE,
      ),
    setDialogValue,
    openInputDialog,
    openConfirmDialog,
    closeDialog,
    handleDialogConfirm,
    handleCreateDataroom,
    handleRenameDataroom,
    handleDeleteDataroom,
    handleCreateFolder,
    handleRenameFolder,
    handleDeleteFolder,
    handleDeleteFolders,
    handleUpload,
    handleUploadFiles,
    handleRenameFile,
    handleDeleteFile,
    handleDeleteFiles,
    openFileLocation,
  }
}
