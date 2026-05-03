import { ipcMain } from 'electron'
import bcrypt from 'bcryptjs'
import { getDatabase } from '../database'

export function registerAuthHandlers(): void {
  ipcMain.handle('auth:login', async (_event, username: string, password: string) => {
    try {
      const db = getDatabase()
      const user = await db.user.findUnique({ where: { username } })

      if (!user) {
        return { success: false, error: "Nom d'utilisateur incorrect" }
      }

      const valid = await bcrypt.compare(password, user.password)
      if (!valid) {
        return { success: false, error: 'Mot de passe incorrect' }
      }

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          role: user.role
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Erreur de connexion' }
    }
  })

  ipcMain.handle(
    'auth:changePassword',
    async (_event, userId: number, currentPassword: string, newPassword: string) => {
      try {
        const db = getDatabase()
        const user = await db.user.findUnique({ where: { id: userId } })

        if (!user) {
          return { success: false, error: 'Utilisateur non trouvé' }
        }

        const valid = await bcrypt.compare(currentPassword, user.password)
        if (!valid) {
          return { success: false, error: 'Mot de passe actuel incorrect' }
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10)
        await db.user.update({
          where: { id: userId },
          data: { password: hashedPassword }
        })

        return { success: true }
      } catch (error) {
        console.error('Change password error:', error)
        return { success: false, error: 'Erreur lors du changement de mot de passe' }
      }
    }
  )
}
