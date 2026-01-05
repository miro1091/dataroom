import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Upload: { input: globalThis.File; output: globalThis.File; }
};

export type Dataroom = {
  __typename?: 'Dataroom';
  createdAt: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  updatedAt: Scalars['String']['output'];
};

export type File = {
  __typename?: 'File';
  contentType: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  dataroomId: Scalars['Int']['output'];
  downloadUrl: Scalars['String']['output'];
  folderId?: Maybe<Scalars['Int']['output']>;
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  size: Scalars['Int']['output'];
  updatedAt: Scalars['String']['output'];
};

export type Folder = {
  __typename?: 'Folder';
  createdAt: Scalars['String']['output'];
  dataroomId: Scalars['Int']['output'];
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  parentId?: Maybe<Scalars['Int']['output']>;
  updatedAt: Scalars['String']['output'];
};

export type FolderContents = {
  __typename?: 'FolderContents';
  files: Array<File>;
  folders: Array<Folder>;
};

export type Mutation = {
  __typename?: 'Mutation';
  createDataroom: Dataroom;
  createFolder: Folder;
  deleteDataroom: Scalars['Boolean']['output'];
  deleteFile: Scalars['Boolean']['output'];
  deleteFolder: Scalars['Boolean']['output'];
  renameDataroom: Dataroom;
  renameFile: File;
  renameFolder: Folder;
  uploadFile: File;
};


export type MutationCreateDataroomArgs = {
  name: Scalars['String']['input'];
};


export type MutationCreateFolderArgs = {
  dataroomId: Scalars['Int']['input'];
  name: Scalars['String']['input'];
  parentId?: InputMaybe<Scalars['Int']['input']>;
};


export type MutationDeleteDataroomArgs = {
  id: Scalars['Int']['input'];
};


export type MutationDeleteFileArgs = {
  id: Scalars['Int']['input'];
};


export type MutationDeleteFolderArgs = {
  id: Scalars['Int']['input'];
};


export type MutationRenameDataroomArgs = {
  id: Scalars['Int']['input'];
  name: Scalars['String']['input'];
};


export type MutationRenameFileArgs = {
  id: Scalars['Int']['input'];
  name: Scalars['String']['input'];
};


export type MutationRenameFolderArgs = {
  id: Scalars['Int']['input'];
  name: Scalars['String']['input'];
};


export type MutationUploadFileArgs = {
  dataroomId: Scalars['Int']['input'];
  file: Scalars['Upload']['input'];
  folderId?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type Query = {
  __typename?: 'Query';
  dataroom: Dataroom;
  datarooms: Array<Dataroom>;
  file: File;
  folderBreadcrumb: Array<Folder>;
  folderContents: FolderContents;
  searchFiles: SearchFilesResult;
};


export type QueryDataroomArgs = {
  id: Scalars['Int']['input'];
};


export type QueryFileArgs = {
  id: Scalars['Int']['input'];
};


export type QueryFolderBreadcrumbArgs = {
  folderId: Scalars['Int']['input'];
};


export type QueryFolderContentsArgs = {
  dataroomId: Scalars['Int']['input'];
  parentId?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
};


export type QuerySearchFilesArgs = {
  limit: Scalars['Int']['input'];
  offset: Scalars['Int']['input'];
  query: Scalars['String']['input'];
};

export type SearchFileResult = {
  __typename?: 'SearchFileResult';
  dataroomId: Scalars['Int']['output'];
  dataroomName: Scalars['String']['output'];
  folderId?: Maybe<Scalars['Int']['output']>;
  folderName?: Maybe<Scalars['String']['output']>;
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  size: Scalars['Int']['output'];
  updatedAt: Scalars['String']['output'];
};

export type SearchFilesResult = {
  __typename?: 'SearchFilesResult';
  hasMore: Scalars['Boolean']['output'];
  items: Array<SearchFileResult>;
  total: Scalars['Int']['output'];
};

export type DataroomsQueryVariables = Exact<{ [key: string]: never; }>;


export type DataroomsQuery = { __typename?: 'Query', datarooms: Array<{ __typename?: 'Dataroom', id: number, name: string, createdAt: string, updatedAt: string }> };

export type FolderContentsQueryVariables = Exact<{
  dataroomId: Scalars['Int']['input'];
  parentId?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
}>;


export type FolderContentsQuery = { __typename?: 'Query', folderContents: { __typename?: 'FolderContents', folders: Array<{ __typename?: 'Folder', id: number, dataroomId: number, parentId?: number | null, name: string, createdAt: string, updatedAt: string }>, files: Array<{ __typename?: 'File', id: number, dataroomId: number, folderId?: number | null, name: string, size: number, contentType: string, createdAt: string, updatedAt: string, downloadUrl: string }> } };

export type FolderBreadcrumbQueryVariables = Exact<{
  folderId: Scalars['Int']['input'];
}>;


export type FolderBreadcrumbQuery = { __typename?: 'Query', folderBreadcrumb: Array<{ __typename?: 'Folder', id: number, dataroomId: number, parentId?: number | null, name: string, createdAt: string, updatedAt: string }> };

export type CreateDataroomMutationVariables = Exact<{
  name: Scalars['String']['input'];
}>;


export type CreateDataroomMutation = { __typename?: 'Mutation', createDataroom: { __typename?: 'Dataroom', id: number, name: string, createdAt: string, updatedAt: string } };

export type RenameDataroomMutationVariables = Exact<{
  id: Scalars['Int']['input'];
  name: Scalars['String']['input'];
}>;


export type RenameDataroomMutation = { __typename?: 'Mutation', renameDataroom: { __typename?: 'Dataroom', id: number, name: string, createdAt: string, updatedAt: string } };

export type DeleteDataroomMutationVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type DeleteDataroomMutation = { __typename?: 'Mutation', deleteDataroom: boolean };

export type CreateFolderMutationVariables = Exact<{
  dataroomId: Scalars['Int']['input'];
  name: Scalars['String']['input'];
  parentId?: InputMaybe<Scalars['Int']['input']>;
}>;


export type CreateFolderMutation = { __typename?: 'Mutation', createFolder: { __typename?: 'Folder', id: number, dataroomId: number, parentId?: number | null, name: string, createdAt: string, updatedAt: string } };

export type RenameFolderMutationVariables = Exact<{
  id: Scalars['Int']['input'];
  name: Scalars['String']['input'];
}>;


export type RenameFolderMutation = { __typename?: 'Mutation', renameFolder: { __typename?: 'Folder', id: number, dataroomId: number, parentId?: number | null, name: string, createdAt: string, updatedAt: string } };

export type DeleteFolderMutationVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type DeleteFolderMutation = { __typename?: 'Mutation', deleteFolder: boolean };

export type UploadFileMutationVariables = Exact<{
  dataroomId: Scalars['Int']['input'];
  file: Scalars['Upload']['input'];
  folderId?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
}>;


export type UploadFileMutation = { __typename?: 'Mutation', uploadFile: { __typename?: 'File', id: number, dataroomId: number, folderId?: number | null, name: string, size: number, contentType: string, createdAt: string, updatedAt: string, downloadUrl: string } };

export type RenameFileMutationVariables = Exact<{
  id: Scalars['Int']['input'];
  name: Scalars['String']['input'];
}>;


export type RenameFileMutation = { __typename?: 'Mutation', renameFile: { __typename?: 'File', id: number, dataroomId: number, folderId?: number | null, name: string, createdAt: string, updatedAt: string } };

export type DeleteFileMutationVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type DeleteFileMutation = { __typename?: 'Mutation', deleteFile: boolean };

export type SearchFilesQueryVariables = Exact<{
  query: Scalars['String']['input'];
  offset: Scalars['Int']['input'];
  limit: Scalars['Int']['input'];
}>;


export type SearchFilesQuery = { __typename?: 'Query', searchFiles: { __typename?: 'SearchFilesResult', total: number, hasMore: boolean, items: Array<{ __typename?: 'SearchFileResult', id: number, name: string, dataroomId: number, folderId?: number | null, dataroomName: string, folderName?: string | null, updatedAt: string, size: number }> } };


export const DataroomsDocument = gql`
    query Datarooms {
  datarooms {
    id
    name
    createdAt
    updatedAt
  }
}
    `;

/**
 * __useDataroomsQuery__
 *
 * To run a query within a React component, call `useDataroomsQuery` and pass it any options that fit your needs.
 * When your component renders, `useDataroomsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useDataroomsQuery({
 *   variables: {
 *   },
 * });
 */
export function useDataroomsQuery(baseOptions?: Apollo.QueryHookOptions<DataroomsQuery, DataroomsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<DataroomsQuery, DataroomsQueryVariables>(DataroomsDocument, options);
      }
export function useDataroomsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<DataroomsQuery, DataroomsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<DataroomsQuery, DataroomsQueryVariables>(DataroomsDocument, options);
        }
// @ts-ignore
export function useDataroomsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<DataroomsQuery, DataroomsQueryVariables>): Apollo.UseSuspenseQueryResult<DataroomsQuery, DataroomsQueryVariables>;
export function useDataroomsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<DataroomsQuery, DataroomsQueryVariables>): Apollo.UseSuspenseQueryResult<DataroomsQuery | undefined, DataroomsQueryVariables>;
export function useDataroomsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<DataroomsQuery, DataroomsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<DataroomsQuery, DataroomsQueryVariables>(DataroomsDocument, options);
        }
export type DataroomsQueryHookResult = ReturnType<typeof useDataroomsQuery>;
export type DataroomsLazyQueryHookResult = ReturnType<typeof useDataroomsLazyQuery>;
export type DataroomsSuspenseQueryHookResult = ReturnType<typeof useDataroomsSuspenseQuery>;
export type DataroomsQueryResult = Apollo.QueryResult<DataroomsQuery, DataroomsQueryVariables>;
export const FolderContentsDocument = gql`
    query FolderContents($dataroomId: Int!, $parentId: Int, $search: String) {
  folderContents(dataroomId: $dataroomId, parentId: $parentId, search: $search) {
    folders {
      id
      dataroomId
      parentId
      name
      createdAt
      updatedAt
    }
    files {
      id
      dataroomId
      folderId
      name
      size
      contentType
      createdAt
      updatedAt
      downloadUrl
    }
  }
}
    `;

/**
 * __useFolderContentsQuery__
 *
 * To run a query within a React component, call `useFolderContentsQuery` and pass it any options that fit your needs.
 * When your component renders, `useFolderContentsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFolderContentsQuery({
 *   variables: {
 *      dataroomId: // value for 'dataroomId'
 *      parentId: // value for 'parentId'
 *      search: // value for 'search'
 *   },
 * });
 */
export function useFolderContentsQuery(baseOptions: Apollo.QueryHookOptions<FolderContentsQuery, FolderContentsQueryVariables> & ({ variables: FolderContentsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<FolderContentsQuery, FolderContentsQueryVariables>(FolderContentsDocument, options);
      }
export function useFolderContentsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<FolderContentsQuery, FolderContentsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<FolderContentsQuery, FolderContentsQueryVariables>(FolderContentsDocument, options);
        }
// @ts-ignore
export function useFolderContentsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<FolderContentsQuery, FolderContentsQueryVariables>): Apollo.UseSuspenseQueryResult<FolderContentsQuery, FolderContentsQueryVariables>;
export function useFolderContentsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<FolderContentsQuery, FolderContentsQueryVariables>): Apollo.UseSuspenseQueryResult<FolderContentsQuery | undefined, FolderContentsQueryVariables>;
export function useFolderContentsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<FolderContentsQuery, FolderContentsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<FolderContentsQuery, FolderContentsQueryVariables>(FolderContentsDocument, options);
        }
export type FolderContentsQueryHookResult = ReturnType<typeof useFolderContentsQuery>;
export type FolderContentsLazyQueryHookResult = ReturnType<typeof useFolderContentsLazyQuery>;
export type FolderContentsSuspenseQueryHookResult = ReturnType<typeof useFolderContentsSuspenseQuery>;
export type FolderContentsQueryResult = Apollo.QueryResult<FolderContentsQuery, FolderContentsQueryVariables>;
export const FolderBreadcrumbDocument = gql`
    query FolderBreadcrumb($folderId: Int!) {
  folderBreadcrumb(folderId: $folderId) {
    id
    dataroomId
    parentId
    name
    createdAt
    updatedAt
  }
}
    `;

/**
 * __useFolderBreadcrumbQuery__
 *
 * To run a query within a React component, call `useFolderBreadcrumbQuery` and pass it any options that fit your needs.
 * When your component renders, `useFolderBreadcrumbQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFolderBreadcrumbQuery({
 *   variables: {
 *      folderId: // value for 'folderId'
 *   },
 * });
 */
export function useFolderBreadcrumbQuery(baseOptions: Apollo.QueryHookOptions<FolderBreadcrumbQuery, FolderBreadcrumbQueryVariables> & ({ variables: FolderBreadcrumbQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<FolderBreadcrumbQuery, FolderBreadcrumbQueryVariables>(FolderBreadcrumbDocument, options);
      }
export function useFolderBreadcrumbLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<FolderBreadcrumbQuery, FolderBreadcrumbQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<FolderBreadcrumbQuery, FolderBreadcrumbQueryVariables>(FolderBreadcrumbDocument, options);
        }
// @ts-ignore
export function useFolderBreadcrumbSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<FolderBreadcrumbQuery, FolderBreadcrumbQueryVariables>): Apollo.UseSuspenseQueryResult<FolderBreadcrumbQuery, FolderBreadcrumbQueryVariables>;
export function useFolderBreadcrumbSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<FolderBreadcrumbQuery, FolderBreadcrumbQueryVariables>): Apollo.UseSuspenseQueryResult<FolderBreadcrumbQuery | undefined, FolderBreadcrumbQueryVariables>;
export function useFolderBreadcrumbSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<FolderBreadcrumbQuery, FolderBreadcrumbQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<FolderBreadcrumbQuery, FolderBreadcrumbQueryVariables>(FolderBreadcrumbDocument, options);
        }
export type FolderBreadcrumbQueryHookResult = ReturnType<typeof useFolderBreadcrumbQuery>;
export type FolderBreadcrumbLazyQueryHookResult = ReturnType<typeof useFolderBreadcrumbLazyQuery>;
export type FolderBreadcrumbSuspenseQueryHookResult = ReturnType<typeof useFolderBreadcrumbSuspenseQuery>;
export type FolderBreadcrumbQueryResult = Apollo.QueryResult<FolderBreadcrumbQuery, FolderBreadcrumbQueryVariables>;
export const CreateDataroomDocument = gql`
    mutation CreateDataroom($name: String!) {
  createDataroom(name: $name) {
    id
    name
    createdAt
    updatedAt
  }
}
    `;
export type CreateDataroomMutationFn = Apollo.MutationFunction<CreateDataroomMutation, CreateDataroomMutationVariables>;

/**
 * __useCreateDataroomMutation__
 *
 * To run a mutation, you first call `useCreateDataroomMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateDataroomMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createDataroomMutation, { data, loading, error }] = useCreateDataroomMutation({
 *   variables: {
 *      name: // value for 'name'
 *   },
 * });
 */
export function useCreateDataroomMutation(baseOptions?: Apollo.MutationHookOptions<CreateDataroomMutation, CreateDataroomMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateDataroomMutation, CreateDataroomMutationVariables>(CreateDataroomDocument, options);
      }
export type CreateDataroomMutationHookResult = ReturnType<typeof useCreateDataroomMutation>;
export type CreateDataroomMutationResult = Apollo.MutationResult<CreateDataroomMutation>;
export type CreateDataroomMutationOptions = Apollo.BaseMutationOptions<CreateDataroomMutation, CreateDataroomMutationVariables>;
export const RenameDataroomDocument = gql`
    mutation RenameDataroom($id: Int!, $name: String!) {
  renameDataroom(id: $id, name: $name) {
    id
    name
    createdAt
    updatedAt
  }
}
    `;
export type RenameDataroomMutationFn = Apollo.MutationFunction<RenameDataroomMutation, RenameDataroomMutationVariables>;

/**
 * __useRenameDataroomMutation__
 *
 * To run a mutation, you first call `useRenameDataroomMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRenameDataroomMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [renameDataroomMutation, { data, loading, error }] = useRenameDataroomMutation({
 *   variables: {
 *      id: // value for 'id'
 *      name: // value for 'name'
 *   },
 * });
 */
export function useRenameDataroomMutation(baseOptions?: Apollo.MutationHookOptions<RenameDataroomMutation, RenameDataroomMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RenameDataroomMutation, RenameDataroomMutationVariables>(RenameDataroomDocument, options);
      }
export type RenameDataroomMutationHookResult = ReturnType<typeof useRenameDataroomMutation>;
export type RenameDataroomMutationResult = Apollo.MutationResult<RenameDataroomMutation>;
export type RenameDataroomMutationOptions = Apollo.BaseMutationOptions<RenameDataroomMutation, RenameDataroomMutationVariables>;
export const DeleteDataroomDocument = gql`
    mutation DeleteDataroom($id: Int!) {
  deleteDataroom(id: $id)
}
    `;
export type DeleteDataroomMutationFn = Apollo.MutationFunction<DeleteDataroomMutation, DeleteDataroomMutationVariables>;

/**
 * __useDeleteDataroomMutation__
 *
 * To run a mutation, you first call `useDeleteDataroomMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteDataroomMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteDataroomMutation, { data, loading, error }] = useDeleteDataroomMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteDataroomMutation(baseOptions?: Apollo.MutationHookOptions<DeleteDataroomMutation, DeleteDataroomMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteDataroomMutation, DeleteDataroomMutationVariables>(DeleteDataroomDocument, options);
      }
export type DeleteDataroomMutationHookResult = ReturnType<typeof useDeleteDataroomMutation>;
export type DeleteDataroomMutationResult = Apollo.MutationResult<DeleteDataroomMutation>;
export type DeleteDataroomMutationOptions = Apollo.BaseMutationOptions<DeleteDataroomMutation, DeleteDataroomMutationVariables>;
export const CreateFolderDocument = gql`
    mutation CreateFolder($dataroomId: Int!, $name: String!, $parentId: Int) {
  createFolder(dataroomId: $dataroomId, name: $name, parentId: $parentId) {
    id
    dataroomId
    parentId
    name
    createdAt
    updatedAt
  }
}
    `;
export type CreateFolderMutationFn = Apollo.MutationFunction<CreateFolderMutation, CreateFolderMutationVariables>;

/**
 * __useCreateFolderMutation__
 *
 * To run a mutation, you first call `useCreateFolderMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateFolderMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createFolderMutation, { data, loading, error }] = useCreateFolderMutation({
 *   variables: {
 *      dataroomId: // value for 'dataroomId'
 *      name: // value for 'name'
 *      parentId: // value for 'parentId'
 *   },
 * });
 */
export function useCreateFolderMutation(baseOptions?: Apollo.MutationHookOptions<CreateFolderMutation, CreateFolderMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateFolderMutation, CreateFolderMutationVariables>(CreateFolderDocument, options);
      }
export type CreateFolderMutationHookResult = ReturnType<typeof useCreateFolderMutation>;
export type CreateFolderMutationResult = Apollo.MutationResult<CreateFolderMutation>;
export type CreateFolderMutationOptions = Apollo.BaseMutationOptions<CreateFolderMutation, CreateFolderMutationVariables>;
export const RenameFolderDocument = gql`
    mutation RenameFolder($id: Int!, $name: String!) {
  renameFolder(id: $id, name: $name) {
    id
    dataroomId
    parentId
    name
    createdAt
    updatedAt
  }
}
    `;
export type RenameFolderMutationFn = Apollo.MutationFunction<RenameFolderMutation, RenameFolderMutationVariables>;

/**
 * __useRenameFolderMutation__
 *
 * To run a mutation, you first call `useRenameFolderMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRenameFolderMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [renameFolderMutation, { data, loading, error }] = useRenameFolderMutation({
 *   variables: {
 *      id: // value for 'id'
 *      name: // value for 'name'
 *   },
 * });
 */
export function useRenameFolderMutation(baseOptions?: Apollo.MutationHookOptions<RenameFolderMutation, RenameFolderMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RenameFolderMutation, RenameFolderMutationVariables>(RenameFolderDocument, options);
      }
export type RenameFolderMutationHookResult = ReturnType<typeof useRenameFolderMutation>;
export type RenameFolderMutationResult = Apollo.MutationResult<RenameFolderMutation>;
export type RenameFolderMutationOptions = Apollo.BaseMutationOptions<RenameFolderMutation, RenameFolderMutationVariables>;
export const DeleteFolderDocument = gql`
    mutation DeleteFolder($id: Int!) {
  deleteFolder(id: $id)
}
    `;
export type DeleteFolderMutationFn = Apollo.MutationFunction<DeleteFolderMutation, DeleteFolderMutationVariables>;

/**
 * __useDeleteFolderMutation__
 *
 * To run a mutation, you first call `useDeleteFolderMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteFolderMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteFolderMutation, { data, loading, error }] = useDeleteFolderMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteFolderMutation(baseOptions?: Apollo.MutationHookOptions<DeleteFolderMutation, DeleteFolderMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteFolderMutation, DeleteFolderMutationVariables>(DeleteFolderDocument, options);
      }
export type DeleteFolderMutationHookResult = ReturnType<typeof useDeleteFolderMutation>;
export type DeleteFolderMutationResult = Apollo.MutationResult<DeleteFolderMutation>;
export type DeleteFolderMutationOptions = Apollo.BaseMutationOptions<DeleteFolderMutation, DeleteFolderMutationVariables>;
export const UploadFileDocument = gql`
    mutation UploadFile($dataroomId: Int!, $file: Upload!, $folderId: Int, $name: String) {
  uploadFile(
    dataroomId: $dataroomId
    file: $file
    folderId: $folderId
    name: $name
  ) {
    id
    dataroomId
    folderId
    name
    size
    contentType
    createdAt
    updatedAt
    downloadUrl
  }
}
    `;
export type UploadFileMutationFn = Apollo.MutationFunction<UploadFileMutation, UploadFileMutationVariables>;

/**
 * __useUploadFileMutation__
 *
 * To run a mutation, you first call `useUploadFileMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUploadFileMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [uploadFileMutation, { data, loading, error }] = useUploadFileMutation({
 *   variables: {
 *      dataroomId: // value for 'dataroomId'
 *      file: // value for 'file'
 *      folderId: // value for 'folderId'
 *      name: // value for 'name'
 *   },
 * });
 */
export function useUploadFileMutation(baseOptions?: Apollo.MutationHookOptions<UploadFileMutation, UploadFileMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UploadFileMutation, UploadFileMutationVariables>(UploadFileDocument, options);
      }
export type UploadFileMutationHookResult = ReturnType<typeof useUploadFileMutation>;
export type UploadFileMutationResult = Apollo.MutationResult<UploadFileMutation>;
export type UploadFileMutationOptions = Apollo.BaseMutationOptions<UploadFileMutation, UploadFileMutationVariables>;
export const RenameFileDocument = gql`
    mutation RenameFile($id: Int!, $name: String!) {
  renameFile(id: $id, name: $name) {
    id
    dataroomId
    folderId
    name
    createdAt
    updatedAt
  }
}
    `;
export type RenameFileMutationFn = Apollo.MutationFunction<RenameFileMutation, RenameFileMutationVariables>;

/**
 * __useRenameFileMutation__
 *
 * To run a mutation, you first call `useRenameFileMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRenameFileMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [renameFileMutation, { data, loading, error }] = useRenameFileMutation({
 *   variables: {
 *      id: // value for 'id'
 *      name: // value for 'name'
 *   },
 * });
 */
export function useRenameFileMutation(baseOptions?: Apollo.MutationHookOptions<RenameFileMutation, RenameFileMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RenameFileMutation, RenameFileMutationVariables>(RenameFileDocument, options);
      }
export type RenameFileMutationHookResult = ReturnType<typeof useRenameFileMutation>;
export type RenameFileMutationResult = Apollo.MutationResult<RenameFileMutation>;
export type RenameFileMutationOptions = Apollo.BaseMutationOptions<RenameFileMutation, RenameFileMutationVariables>;
export const DeleteFileDocument = gql`
    mutation DeleteFile($id: Int!) {
  deleteFile(id: $id)
}
    `;
export type DeleteFileMutationFn = Apollo.MutationFunction<DeleteFileMutation, DeleteFileMutationVariables>;

/**
 * __useDeleteFileMutation__
 *
 * To run a mutation, you first call `useDeleteFileMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteFileMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteFileMutation, { data, loading, error }] = useDeleteFileMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteFileMutation(baseOptions?: Apollo.MutationHookOptions<DeleteFileMutation, DeleteFileMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteFileMutation, DeleteFileMutationVariables>(DeleteFileDocument, options);
      }
export type DeleteFileMutationHookResult = ReturnType<typeof useDeleteFileMutation>;
export type DeleteFileMutationResult = Apollo.MutationResult<DeleteFileMutation>;
export type DeleteFileMutationOptions = Apollo.BaseMutationOptions<DeleteFileMutation, DeleteFileMutationVariables>;
export const SearchFilesDocument = gql`
    query SearchFiles($query: String!, $offset: Int!, $limit: Int!) {
  searchFiles(query: $query, offset: $offset, limit: $limit) {
    total
    hasMore
    items {
      id
      name
      dataroomId
      folderId
      dataroomName
      folderName
      updatedAt
      size
    }
  }
}
    `;

/**
 * __useSearchFilesQuery__
 *
 * To run a query within a React component, call `useSearchFilesQuery` and pass it any options that fit your needs.
 * When your component renders, `useSearchFilesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSearchFilesQuery({
 *   variables: {
 *      query: // value for 'query'
 *      offset: // value for 'offset'
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useSearchFilesQuery(baseOptions: Apollo.QueryHookOptions<SearchFilesQuery, SearchFilesQueryVariables> & ({ variables: SearchFilesQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SearchFilesQuery, SearchFilesQueryVariables>(SearchFilesDocument, options);
      }
export function useSearchFilesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SearchFilesQuery, SearchFilesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SearchFilesQuery, SearchFilesQueryVariables>(SearchFilesDocument, options);
        }
// @ts-ignore
export function useSearchFilesSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<SearchFilesQuery, SearchFilesQueryVariables>): Apollo.UseSuspenseQueryResult<SearchFilesQuery, SearchFilesQueryVariables>;
export function useSearchFilesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SearchFilesQuery, SearchFilesQueryVariables>): Apollo.UseSuspenseQueryResult<SearchFilesQuery | undefined, SearchFilesQueryVariables>;
export function useSearchFilesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SearchFilesQuery, SearchFilesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<SearchFilesQuery, SearchFilesQueryVariables>(SearchFilesDocument, options);
        }
export type SearchFilesQueryHookResult = ReturnType<typeof useSearchFilesQuery>;
export type SearchFilesLazyQueryHookResult = ReturnType<typeof useSearchFilesLazyQuery>;
export type SearchFilesSuspenseQueryHookResult = ReturnType<typeof useSearchFilesSuspenseQuery>;
export type SearchFilesQueryResult = Apollo.QueryResult<SearchFilesQuery, SearchFilesQueryVariables>;