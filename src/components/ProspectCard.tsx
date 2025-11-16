import { Prospect } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { HealthGradeBadge } from './HealthGradeBadge'
import { Buildings, TrendUp, MapPin, Calendar, ChartLineUp } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface ProspectCardProps {
  prospect: Prospect
  onSelect: (prospect: Prospect) => void
}

const industryIcons: Record<string, string> = {
  restaurant: '🍽️',
  retail: '🛍️',
  construction: '🏗️',
  healthcare: '🏥',
  manufacturing: '🏭',
  services: '💼',
  technology: '💻'
}

// Animation variants for staggered children
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0.0, 0.2, 1] // Material Design easing
    }
  },
  hover: {
    y: -6,
    transition: {
      duration: 0.2,
      ease: [0.4, 0.0, 0.2, 1]
    }
  }
}

export function ProspectCard({ prospect, onSelect }: ProspectCardProps) {
  const isClaimed = prospect.status === 'claimed'
  const hasGrowthSignals = prospect.growthSignals.length > 0
  const yearsSinceDefault = Math.floor(prospect.timeSinceDefault / 365)

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap={{ scale: 0.98 }}
      role="article"
      aria-label={`${prospect.companyName} prospect card`}
    >
      <Card 
        className={cn(
          'glass-effect p-5 sm:p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer group overflow-hidden relative border-2',
          isClaimed ? 'border-primary/40 bg-primary/5' : 'border-white/20 hover:border-primary/30'
        )}
        onClick={() => onSelect(prospect)}
        tabIndex={0}
        role="button"
        aria-pressed={isClaimed}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelect(prospect)
          }
        }}
      >
        {/* Enhanced gradient overlay with depth */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/8 opacity-0 group-hover:opacity-100 transition-opacity duration-400"
          aria-hidden="true"
        />
        
        {/* Status indicator bar */}
        {isClaimed && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" aria-hidden="true" />
        )}
        
        <div className="relative z-10">
          {/* Header Section - Enhanced spacing and layout */}
          <div className="flex items-start justify-between mb-4 sm:mb-5 gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <motion.div 
                className="flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary/15 to-accent/10 text-2xl sm:text-3xl flex-shrink-0 shadow-sm"
                whileHover={{ rotate: 5, scale: 1.05 }}
                transition={{ duration: 0.2 }}
                aria-hidden="true"
              >
                {industryIcons[prospect.industry]}
              </motion.div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base sm:text-lg leading-tight mb-1.5 truncate text-foreground">
                  {prospect.companyName}
                </h3>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground/90">
                  <MapPin size={14} weight="fill" className="flex-shrink-0" aria-hidden="true" />
                  <span className="truncate">{prospect.state}</span>
                  <span aria-hidden="true">•</span>
                  <span className="capitalize truncate">{prospect.industry}</span>
                </div>
              </div>
            </div>
            {/* Priority Score Badge - Enhanced design */}
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.08 }}
                transition={{ duration: 0.2 }}
              >
                <div className="font-mono text-2xl sm:text-3xl font-bold bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
                  {prospect.priorityScore}
                </div>
                <div 
                  className="absolute -inset-1 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg blur-sm -z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-hidden="true"
                />
              </motion.div>
              <div className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wide">Priority</div>
            </div>
          </div>

          {/* Metrics Grid - Improved visual hierarchy */}
          <div className="grid grid-cols-1 gap-2.5 sm:gap-3 mb-4 sm:mb-5">
            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
              <div className="flex items-center gap-2">
                <ChartLineUp size={14} weight="bold" className="text-muted-foreground" aria-hidden="true" />
                <span className="text-xs sm:text-sm text-muted-foreground font-medium">Health Score</span>
              </div>
              <HealthGradeBadge grade={prospect.healthScore.grade} />
            </div>

            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
              <div className="flex items-center gap-2">
                <Calendar size={14} weight="bold" className="text-muted-foreground" aria-hidden="true" />
                <span className="text-xs sm:text-sm text-muted-foreground font-medium">Default Age</span>
              </div>
              <Badge variant="outline" className="font-mono text-xs font-semibold">
                {yearsSinceDefault}y ago
              </Badge>
            </div>

            {hasGrowthSignals && (
              <motion.div 
                className="flex items-center justify-between gap-2 p-2 rounded-lg bg-accent/10 border border-accent/20"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <div className="flex items-center gap-2">
                  <TrendUp size={14} weight="bold" className="text-accent-foreground" aria-hidden="true" />
                  <span className="text-xs sm:text-sm text-accent-foreground font-medium">Growth Signals</span>
                </div>
                <Badge className="bg-accent text-accent-foreground text-xs font-semibold shadow-sm">
                  {prospect.growthSignals.length} detected
                </Badge>
              </motion.div>
            )}
          </div>

          {/* Narrative - Enhanced typography */}
          <p className="text-xs sm:text-sm text-foreground/85 mb-4 sm:mb-5 line-clamp-2 leading-relaxed">
            {prospect.narrative}
          </p>

          {/* Action Button - Enhanced accessibility and design */}
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              className={cn(
                "flex-1 text-xs sm:text-sm h-9 sm:h-10 font-semibold shadow-sm transition-all duration-200",
                "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                isClaimed && "opacity-60"
              )}
              disabled={isClaimed}
              aria-label={isClaimed ? `${prospect.companyName} - Already claimed` : `View details for ${prospect.companyName}`}
            >
              <Buildings size={16} weight="fill" className="mr-2" aria-hidden="true" />
              {isClaimed ? 'Claimed' : 'View Details'}
            </Button>
            {isClaimed && prospect.claimedBy && (
              <Badge variant="secondary" className="text-xs font-medium px-2.5 py-1">
                {prospect.claimedBy}
              </Badge>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
