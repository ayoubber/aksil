import { ipcMain, dialog, app } from 'electron'
import { getDatabase, getDatabaseFilePath } from '../database'
import { copyFileSync, existsSync } from 'fs'
import { join } from 'path'

export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:getAll', async () => {
    try {
      const db = getDatabase()
      const settings = await db.setting.findMany()
      const map: Record<string, string> = {}
      for (const s of settings) map[s.key] = s.value
      return { success: true, data: map }
    } catch (error) {
      return { success: false, error: 'Erreur lors du chargement des paramètres' }
    }
  })

  ipcMain.handle('settings:update', async (_event, key: string, value: string) => {
    try {
      const db = getDatabase()
      await db.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value }
      })
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Erreur lors de la mise à jour' }
    }
  })

  ipcMain.handle('settings:updateMany', async (_event, settings: Record<string, string>) => {
    try {
      const db = getDatabase()
      for (const [key, value] of Object.entries(settings)) {
        await db.setting.upsert({
          where: { key },
          update: { value },
          create: { key, value }
        })
      }
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Erreur lors de la mise à jour des paramètres' }
    }
  })

  ipcMain.handle('settings:backup', async () => {
    try {
      const result = await dialog.showSaveDialog({
        title: 'Sauvegarder la base de données',
        defaultPath: `aksil-backup-${new Date().toISOString().split('T')[0]}.db`,
        filters: [{ name: 'SQLite Database', extensions: ['db'] }]
      })

      if (result.canceled || !result.filePath) {
        return { success: false, error: 'Sauvegarde annulée' }
      }

      const dbPath = getDatabaseFilePath()
      copyFileSync(dbPath, result.filePath)
      return { success: true, data: { path: result.filePath } }
    } catch (error) {
      return { success: false, error: 'Erreur lors de la sauvegarde' }
    }
  })

  ipcMain.handle('settings:restore', async () => {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Restaurer la base de données',
        filters: [{ name: 'SQLite Database', extensions: ['db'] }],
        properties: ['openFile']
      })

      if (result.canceled || !result.filePaths.length) {
        return { success: false, error: 'Restauration annulée' }
      }

      const sourcePath = result.filePaths[0]
      const dbPath = getDatabaseFilePath()

      // Create backup of current DB before restoring
      const backupPath = dbPath + '.bak'
      if (existsSync(dbPath)) {
        copyFileSync(dbPath, backupPath)
      }

      copyFileSync(sourcePath, dbPath)
      return {
        success: true,
        data: { message: "Base de données restaurée. Redémarrez l'application." }
      }
    } catch (error) {
      return { success: false, error: 'Erreur lors de la restauration' }
    }
  })

  ipcMain.handle('settings:selectLogo', async () => {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Choisir un logo',
        filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'svg', 'webp'] }],
        properties: ['openFile']
      })

      if (result.canceled || !result.filePaths.length) {
        return { success: false, error: 'Sélection annulée' }
      }

      const sourcePath = result.filePaths[0]
      const ext = sourcePath.split('.').pop()
      const destDir = join(app.getPath('userData'), 'data')
      const destPath = join(destDir, `logo.${ext}`)

      copyFileSync(sourcePath, destPath)

      const db = getDatabase()
      await db.setting.upsert({
        where: { key: 'logo_path' },
        update: { value: destPath },
        create: { key: 'logo_path', value: destPath }
      })

      return { success: true, data: { path: destPath } }
    } catch (error) {
      return { success: false, error: 'Erreur lors de la sélection du logo' }
    }
  })
}
