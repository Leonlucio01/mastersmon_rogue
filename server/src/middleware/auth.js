import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'

function getToken(request) {
  const header = request.get('authorization')
  if (!header?.startsWith('Bearer ')) return null
  return header.slice(7).trim()
}

export async function optionalAuth(request, _response, next) {
  const token = getToken(request)
  if (!token) return next()

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true },
    })
    if (user) request.user = user
  } catch {
    request.authError = 'La sesión no es válida o expiró.'
  }

  next()
}

export function requireAuth(request, response, next) {
  if (request.user) return next()
  return response.status(401).json({
    error: request.authError ?? 'Debes iniciar sesión para continuar.',
  })
}
