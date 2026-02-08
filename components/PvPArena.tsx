'use client'

import { motion } from 'framer-motion'
import { Flame, Activity } from 'lucide-react'
import { useState, useEffect } from 'react'

// Skeleton tracking points for the court
const skeletonPoints = [
  // Player 1 (You)
  { x: 35, y: 45 }, { x: 35, y: 55 }, { x: 32, y: 52 }, { x: 38, y: 52 },
  { x: 32, y: 60 }, { x: 38, y: 60 }, { x: 35, y: 70 }, { x: 32, y: 78 }, { x: 38, y: 78 },
  // Player 2 (Opponent)
  { x: 65, y: 42 }, { x: 65, y: 52 }, { x: 62, y: 49 }, { x: 68, y: 49 },
  { x: 62, y: 57 }, { x: 68, y: 57 }, { x: 65, y: 67 }, { x: 62, y: 75 }, { x: 68, y: 75 },
]

export default function PvPArena() {
  const [fps, setFps] = useState(60)

  useEffect(() => {
    const interval = setInterval(() => {
      setFps(58 + Math.floor(Math.random() * 4))
    }, 100)
    return () => clearInterval(interval)
  }, [])

  return (
    <section id="pvp-arena" className="py-24 px-6 bg-dark-primary">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/30 rounded-full mb-4">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-bold text-orange-500">PVP ARENA</span>
          </div>

          <h2 className="text-5xl font-bold text-white mb-4">
            Gerçek Rakip. <span className="text-emerald-primary">Gerçek Zamanlı.</span>
          </h2>
          <p className="text-xl text-text-muted max-w-3xl mx-auto">
            Arkadaşlarınla yarış, liderlik tablosunda yüksel
          </p>
        </motion.div>

        {/* Arena Display */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-dark-secondary rounded-3xl overflow-hidden shadow-xl border border-white/5"
        >
          {/* Header Bar - Emerald Gradient */}
          <div className="gradient-primary p-6 text-white relative">
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative flex items-center justify-between">
              <div>
                <div className="text-sm opacity-90 mb-1">CANLI MAÇ</div>
                <div className="text-2xl font-bold">PvP Arena</div>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <motion.div
                  className="w-2 h-2 bg-white rounded-full"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <span className="text-sm font-bold">LIVE</span>
              </div>
            </div>
          </div>

          {/* Arena Content */}
          <div className="relative aspect-video bg-dark-primary">
            {/* Scoreboard */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 flex gap-6 z-10">
              {/* You */}
              <div className="bg-dark-secondary rounded-2xl px-8 py-4 shadow-xl border-2 border-emerald-primary">
                <div className="text-xs text-text-muted mb-1 text-center">SENSİN</div>
                <div className="text-5xl font-bold text-white text-center">12</div>
              </div>

              {/* Opponent */}
              <div className="bg-dark-secondary rounded-2xl px-8 py-4 shadow-xl border-2 border-white/20">
                <div className="text-xs text-text-muted mb-1 text-center">RAKİP</div>
                <div className="text-5xl font-bold text-white text-center">11</div>
              </div>
            </div>

            {/* Skeleton Points - Emerald with glow */}
            {skeletonPoints.map((point, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 bg-emerald-primary rounded-full shadow-lg z-20"
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
                animate={{
                  scale: [1, 1.3, 1],
                  boxShadow: [
                    '0 0 10px rgba(16, 220, 120, 0.5)',
                    '0 0 20px rgba(16, 220, 120, 0.8)',
                    '0 0 10px rgba(16, 220, 120, 0.5)'
                  ]
                }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
              />
            ))}

            {/* Status Card */}
            <div className="absolute bottom-8 right-8 bg-dark-secondary rounded-xl px-4 py-3 shadow-lg border border-white/10 z-10">
              <div className="flex items-center gap-2 text-emerald-primary font-bold text-sm">
                <motion.div
                  className="w-2 h-2 bg-emerald-primary rounded-full"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                ENGINE ACTIVE
              </div>
              <div className="text-xs text-text-muted mt-1">FPS: {fps} | POSES: 2</div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-4 p-6 bg-dark-tertiary/30">
            {[
              { value: '24', label: 'Toplam Skor' },
              { value: '98%', label: 'Doğruluk' },
              { value: '12:34', label: 'Süre' },
              { value: '156', label: 'Kcal' }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-text-muted mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Match Opponent Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {[
            { name: 'Alex Chen', level: 12, wins: 45, losses: 12, winRate: 79, online: true },
            { name: 'Sarah Kim', level: 15, wins: 62, losses: 18, winRate: 78, online: true },
            { name: 'Mike Lopez', level: 10, wins: 34, losses: 15, winRate: 69, online: false }
          ].map((player, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="bg-dark-secondary rounded-2xl border-2 border-emerald-primary p-4 shadow-lg cursor-pointer"
            >
              {/* Avatar */}
              <div className="flex justify-center mb-3">
                <div className="relative">
                  <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center">
                    <span className="text-2xl text-white font-bold">{player.name[0]}</span>
                  </div>
                  {/* Online Status */}
                  {player.online && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-primary rounded-full border-2 border-dark-secondary" />
                  )}
                </div>
              </div>

              {/* Name & Level */}
              <div className="text-center mb-2">
                <h4 className="font-bold text-white mb-1">{player.name}</h4>
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-primary/10 border border-emerald-primary/30 rounded-full">
                  <Activity className="w-3 h-3 text-emerald-primary" />
                  <span className="text-xs font-bold text-emerald-primary">Level {player.level}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex justify-center gap-3 text-sm mb-2">
                <span className="text-text-muted font-medium">{player.wins}W</span>
                <span className="text-text-muted/50">-</span>
                <span className="text-text-muted font-medium">{player.losses}L</span>
              </div>

              {/* Win Rate */}
              <div className="pt-3 border-t border-white/10 text-center">
                <span className="text-xs text-text-muted">Win Rate</span>
                <div className="text-lg font-bold text-emerald-primary">{player.winRate}%</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
