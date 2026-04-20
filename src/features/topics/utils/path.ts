import { DEBUG_PATH } from '../constants'

export const normalizePath = (path: string) => path.replace(/\/+$/, '') || '/'

export const isDebugPath = (path: string) => normalizePath(path) === DEBUG_PATH
