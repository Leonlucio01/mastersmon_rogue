import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { optionalAuth } from './middleware/auth.js'
import authRoutes from './routes/auth.routes.js'
import battleRoutes from './routes/battle.routes.js'
import characterRoutes from './routes/character.routes.js'
import equipmentRoutes from './routes/equipment.routes.js'
import healthRoutes from './routes/health.routes.js'
import inventoryRoutes from './routes/inventory.routes.js'
import mapRoutes from './routes/map.routes.js'
import offlineRoutes from './routes/offline.routes.js'
import skillsRoutes from './routes/skills.routes.js'
import questsRoutes from './routes/quests.routes.js'

const app = express()
const port = Number(process.env.PORT) || 4000

app.disable('x-powered-by')
app.use(
  cors({
    origin: 'http://localhost:5173',
  }),
)
app.use(express.json())
app.use(optionalAuth)

app.use('/api/health', healthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/character', characterRoutes)
app.use('/api/equipment', equipmentRoutes)
app.use('/api/inventory', inventoryRoutes)
app.use('/api/battle', battleRoutes)
app.use('/api/map', mapRoutes)
app.use('/api/offline', offlineRoutes)
app.use('/api/skills', skillsRoutes)
app.use('/api/quests', questsRoutes)

app.use((request, response) => {
  response.status(404).json({
    error: 'Ruta no encontrada',
    path: request.originalUrl,
  })
})

app.use((error, _request, response, _next) => {
  const status = Number(error.status) || 500
  if (status >= 500) console.error(error)
  response.status(status).json({
    error: status >= 500 ? 'Error interno del servidor' : error.message,
  })
})

app.listen(port, () => {
  console.log(`Mastersmon Rogue API disponible en http://localhost:${port}/api`)
})

export default app
