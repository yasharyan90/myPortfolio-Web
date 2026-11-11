import { createContext, useContext } from 'react'

/** True while a section renders inside the owner console's preview pane. */
export const PreviewContext = createContext(false)
export const useInPreview = () => useContext(PreviewContext)
