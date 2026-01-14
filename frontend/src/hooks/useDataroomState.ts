import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import {
  useCreateDataroomMutation,
  useCreateFolderMutation,
  useDataroomsQuery,
  useDeleteDataroomMutation,
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

export const useDataroomState = () => {
  const { data: dataroomData, loading: dataroomLoading, error: dataroomError, refetch: refetchDatarooms } =
    useDataroomsQuery()
  const datarooms: ApiDataroom[] = dataroomData?.datarooms ?? []

  const [selectedDataroomId, setSelectedDataroomId] = useState<number | null>(null)
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null)
  const [selectedFile, setSelectedFile] = useState<ApiFile | null>(null)
  const [highlightFileId, setHighlightFileId] = useState<number | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [dialog, setDialog] = useState<DialogState | null>(null)
  const [dialogValue, setDialogValue] = useState('')
  const [dialogBusy, setDialogBusy] = useState(false)
  const [dialogError, setDialogError] = useState('')
  const lastQueryErrorRef = useRef<string | null>(null)

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

  const { data: contentsData, loading: contentsLoading, error: contentsError, refetch: refetchContents } =
    useFolderContentsQuery({
      variables: { dataroomId: selectedDataroomId ?? 0, parentId: currentFolderId },
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

  const activeDataroom = datarooms.find((room) => room.id === selectedDataroomId) ?? null
  const folders: ApiFolder[] = contentsData?.folderContents.folders ?? []
  const files: ApiFile[] = contentsData?.folderContents.files ?? []

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
    if (!selectedFile) return
    const refreshed = files.find((item) => item.id === selectedFile.id)
    setSelectedFile(refreshed ?? null)
  }, [files, selectedFile])


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

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!selectedDataroomId) {
      setNotice({ type: 'error', message: 'Select a dataroom before uploading.' })
      return
    }
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setNotice({ type: 'error', message: 'Only PDF files are supported.' })
      event.target.value = ''
      return
    }
    try {
      await uploadFile({
        variables: {
          dataroomId: selectedDataroomId,
          folderId: currentFolderId,
          file,
        },
      })
      await refetchContents()
      setNotice({ type: 'success', message: 'File uploaded.' })
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
    contentsLoading,
    contentsError,
    selectedFile,
    highlightFileId,
    notice,
    dialog,
    dialogValue,
    dialogBusy,
    dialogError,
    setSelectedDataroomId,
    setCurrentFolderId,
    setSelectedFile,
    setHighlightFileId,
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
    handleUpload,
    handleRenameFile,
    handleDeleteFile,
    openFileLocation,
  }
}
