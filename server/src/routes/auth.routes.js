import bcrypt from 'bcryptjs'
import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { serializeCharacter } from '../utils/serializers.js'

const router = Router()
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function createToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

function publicUser(user) {
  return { id: user.id, email: user.email, name: user.name }
}

router.post('/register', async (request, response, next) => {
  try {
    const email = request.body.email?.trim().toLowerCase()
    const password = request.body.password
    const characterName = request.body.characterName?.trim()

    if (!email || !password || !characterName) {
      return response.status(400).json({ error: 'Completa todos los campos.' })
    }
    if (!emailPattern.test(email)) {
      return response.status(400).json({ error: 'Ingresa un correo válido.' })
    }
    if (password.length < 6) {
      return response.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' })
    }
    if (characterName.length < 2 || characterName.length > 20) {
      return response.status(400).json({ error: 'El nombre debe tener entre 2 y 20 caracteres.' })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return response.status(409).json({ error: 'Ya existe un aventurero con ese correo.' })
    }

    const zone = await prisma.zone.findFirst({ orderBy: { level: 'asc' } })
    if (!zone) {
      return response.status(503).json({ error: 'Ejecuta el seed antes de registrar jugadores.' })
    }

    const starterItems = await prisma.item.findMany({
      where: { name: { in: ['Poción menor', 'Espada de aprendiz'] } },
    })
    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: {
        email,
        name: characterName,
        passwordHash,
        character: {
          create: {
            name: characterName,
            characterClass: 'Vanguardia',
            gold: 40,
            gems: 2,
            attack: 14,
            defense: 3,
            power: 16,
            zoneId: zone.id,
            inventoryItems: {
              create: starterItems.map((item) => ({
                itemId: item.id,
                quantity: item.name === 'Poción menor' ? 2 : 1,
                equipped: item.name === 'Espada de aprendiz',
              })),
            },
          },
        },
      },
      include: { character: true },
    })

    response.status(201).json({
      token: createToken(user.id),
      user: publicUser(user),
      character: serializeCharacter(user.character),
    })
  } catch (error) {
    next(error)
  }
})

router.post('/login', async (request, response, next) => {
  try {
    const email = request.body.email?.trim().toLowerCase()
    const password = request.body.password

    if (!email || !password) {
      return response.status(400).json({ error: 'Ingresa correo y contraseña.' })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { character: true },
    })
    const validPassword =
      user?.passwordHash && (await bcrypt.compare(password, user.passwordHash))

    if (!user || !validPassword) {
      return response.status(401).json({ error: 'Correo o contraseña incorrectos.' })
    }

    response.json({
      token: createToken(user.id),
      user: publicUser(user),
      character: serializeCharacter(user.character),
    })
  } catch (error) {
    next(error)
  }
})

router.get('/me', requireAuth, async (request, response, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: request.user.id },
      include: { character: true },
    })
    response.json({
      user: publicUser(user),
      character: serializeCharacter(user.character),
    })
  } catch (error) {
    next(error)
  }
})

export default router
