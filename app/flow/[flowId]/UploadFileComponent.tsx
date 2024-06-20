import { DocumentFile } from "@/models/types/Flow"
import { getStorage, uploadBytes } from "@firebase/storage"
import { Button, CircularProgress, Tooltip } from "@mui/material"
import { Timestamp } from "@firebase/firestore"
import { getDownloadURL, ref } from "@firebase/storage"
import { get } from "lodash"
import { ChangeEventHandler, useState } from "react"
import { v4 } from "uuid"

function getFileExtension(file: File) {
  // Get the name of the file from the file object
  const fileName = file.name

  // Find the last dot in the filename
  const lastDotIndex = fileName.lastIndexOf(".")

  // Check if there is a dot in the filename and it is not the first character
  if (lastDotIndex > 0) {
    // Extract and return the extension
    return fileName.substring(lastDotIndex + 1)
  } else {
    // Return an empty string if there is no extension
    return ""
  }
}

export const UploadFileComponent = ({
  file,
  onFile,
  flowKey,
  fileComponentId,
  onClick,
}: {
  file: DocumentFile | null
  onFile: (url: DocumentFile) => void
  flowKey: string
  fileComponentId: string
  onClick?: () => void
}) => {
  const storage = getStorage()
  const [uploading, setUploading] = useState(false)

  const uploadTextFile: ChangeEventHandler<HTMLInputElement> = async (e) => {
    const files = e.target.files || []
    if (!files.length) return
    setUploading(true)
    const fileId = v4()
    const extension = getFileExtension(files[0])
    const extensionWithDot = extension ? `.${extension}` : ""
    const fileName = `${fileId}${extensionWithDot}`
    const rootName = `flow-files/${flowKey}`
    const path = `${rootName}/${fileName}`
    const fileToUpload = files[0]

    const fileRef = ref(storage, `${path}`)
    await uploadBytes(fileRef, fileToUpload)
    setUploading(false)

    const url = await getDownloadURL(fileRef)
    onFile({
      internalPath: path,
      url,
      name: fileToUpload.name,
      createdAt: Timestamp.now(),
    })
  }

  return (
    <div className="flex items-center">
      <div>
        {uploading ? <CircularProgress size=".5rem"></CircularProgress> : null}
      </div>
      <label htmlFor={`upload-file-${fileComponentId}`}>
        <Tooltip
          title={file?.name ? "Upload a new file" : "Upload Any type of file"}
        >
          <Button
            className="rounded-full text-xs normal-case"
            variant="contained"
            color="info"
            component="span"
            onClick={() => onClick?.()}
          >
            {file?.name ? file?.name : "Upload File"}
          </Button>
        </Tooltip>

        <input
          accept="*"
          id={`upload-file-${fileComponentId}`}
          type="file"
          className="sr-only"
          onChange={uploadTextFile}
        />
      </label>
    </div>
  )
}
