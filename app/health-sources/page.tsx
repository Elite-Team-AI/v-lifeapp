"use client"

import { motion } from "framer-motion"
import { ArrowLeft, BookOpen, ExternalLink } from "lucide-react"
import { ButtonGlow } from "@/components/ui/button-glow"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"

export default function HealthSourcesPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-black pb-nav-safe overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/30 rounded-full blur-[128px] animate-blob" />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-[128px] animate-blob animation-delay-4000" />
      </div>

      {/* Grid pattern overlay */}
      <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />

      <div className="relative z-10 container max-w-3xl px-4 py-6">
        {/* Header */}
        <motion.div
          className="mb-6 flex items-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <ButtonGlow variant="outline-glow" size="icon" onClick={() => router.back()} className="mr-3 h-10 w-10 backdrop-blur-xl">
              <ArrowLeft className="h-4 w-4" />
            </ButtonGlow>
          </motion.div>
          <div className="flex items-center gap-2">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
            >
              <BookOpen className="h-6 w-6 text-accent drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]" />
            </motion.div>
            <div>
              <motion.h1
                className="text-2xl font-bold tracking-tight font-heading bg-gradient-to-r from-accent via-yellow-300 to-accent bg-clip-text text-transparent animate-gradient-shift bg-[length:200%_auto]"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                Health Information Sources
              </motion.h1>
              <motion.p
                className="text-sm text-white/70 leading-relaxed"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                Scientific references for V-Life recommendations
              </motion.p>
            </div>
          </div>
        </motion.div>

        {/* Medical Disclaimer */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          whileHover={{ scale: 1.01, y: -2 }}
        >
          <Card className="border-amber-500/30 backdrop-blur-xl bg-gradient-to-br from-amber-500/15 to-amber-500/5 shadow-[0_0_20px_rgba(251,191,36,0.15)] mb-6">
            <CardContent className="p-4">
              <motion.p
                className="text-sm text-amber-200/90 font-medium tracking-tight font-heading mb-1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                Medical Disclaimer
              </motion.p>
              <motion.p
                className="text-xs text-amber-200/70 leading-relaxed"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                V-Life is designed for informational and educational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult your physician or a qualified healthcare professional before starting any new exercise program, making significant dietary changes, or if you have questions about a medical condition.
              </motion.p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="border-white/10 backdrop-blur-xl bg-white/5 shadow-[0_0_30px_rgba(255,215,0,0.1)]">
            <CardContent className="p-6 space-y-8 text-white/80">

            {/* Calorie & Macro Calculations */}
            <motion.section
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <motion.h2
                className="text-lg font-bold tracking-tight font-heading bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent mb-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.75 }}
              >
                Calorie & Macronutrient Calculations
              </motion.h2>
              <motion.p
                className="text-sm mb-3 leading-relaxed"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
              >
                V-Life calculates daily calorie targets based on your goal weight and activity level. Macronutrient ratios follow evidence-based guidelines from leading nutrition research organizations.
              </motion.p>
              <div className="space-y-3">
                <SourceItem
                  title="Dietary Reference Intakes for Energy"
                  source="National Academies of Sciences, Engineering, and Medicine"
                  url="https://nap.nationalacademies.org/catalog/11537/dietary-reference-intakes-for-energy-carbohydrate-fiber-fat-fatty-acids-cholesterol-protein-and-amino-acids"
                  description="Foundation for calorie estimation based on body weight, activity level, and goals."
                  delay={0.85}
                />
                <SourceItem
                  title="Position Stand: Protein and Exercise"
                  source="International Society of Sports Nutrition (ISSN)"
                  url="https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0177-8"
                  description="Protein intake of 1.4–2.0 g/kg/day for exercising individuals. V-Life uses approximately 0.9 g/lb (~2.0 g/kg) for active users."
                  delay={0.9}
                />
                <SourceItem
                  title="Acceptable Macronutrient Distribution Ranges (AMDR)"
                  source="Institute of Medicine / National Academies"
                  url="https://nap.nationalacademies.org/catalog/10490/dietary-reference-intakes-for-energy-carbohydrate-fiber-fat-fatty-acids-cholesterol-protein-and-amino-acids-macronutrients"
                  description="Recommended ranges: Protein 10–35%, Carbohydrates 45–65%, Fat 20–35% of total calories. V-Life uses 30% protein, 40% carbs, 30% fat."
                  delay={0.95}
                />
                <SourceItem
                  title="Evidence-Based Recommendations for Natural Bodybuilding"
                  source="Journal of the International Society of Sports Nutrition"
                  url="https://jissn.biomedcentral.com/articles/10.1186/1550-2783-11-20"
                  description="Calorie targets of 11–13 cal/lb for weight management in active individuals."
                  delay={1.0}
                />
              </div>
            </motion.section>

            {/* Exercise & Workout Programming */}
            <motion.section
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.05 }}
            >
              <motion.h2
                className="text-lg font-bold tracking-tight font-heading bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent mb-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.1 }}
              >
                Exercise & Workout Programming
              </motion.h2>
              <motion.p
                className="text-sm mb-3 leading-relaxed"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.15 }}
              >
                Workout recommendations in V-Life follow established exercise science principles for resistance training volume, frequency, and programming.
              </motion.p>
              <div className="space-y-3">
                <SourceItem
                  title="ACSM Guidelines for Exercise Testing and Prescription"
                  source="American College of Sports Medicine (ACSM)"
                  url="https://www.acsm.org/education-resources/books/guidelines-exercise-testing-prescription"
                  description="Industry-standard guidelines for exercise frequency, intensity, time, and type (FITT)."
                  delay={1.2}
                />
                <SourceItem
                  title="Position Stand: Progression Models in Resistance Training"
                  source="American College of Sports Medicine (ACSM)"
                  url="https://journals.lww.com/acsm-msse/fulltext/2009/03000/progression_models_in_resistance_training_for.26.aspx"
                  description="Evidence-based recommendations for set/rep schemes, rest periods, and training frequency."
                  delay={1.25}
                />
                <SourceItem
                  title="Physical Activity Guidelines for Americans"
                  source="U.S. Department of Health and Human Services"
                  url="https://health.gov/our-work/nutrition-physical-activity/physical-activity-guidelines"
                  description="Foundational guidelines for recommended activity levels across age groups."
                  delay={1.3}
                />
              </div>
            </motion.section>

            {/* Habit & Behavior Change */}
            <motion.section
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.35 }}
            >
              <motion.h2
                className="text-lg font-bold tracking-tight font-heading bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent mb-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.4 }}
              >
                Habit Building & Behavior Change
              </motion.h2>
              <motion.p
                className="text-sm mb-3 leading-relaxed"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.45 }}
              >
                V-Life's habit tracking system is informed by research on habit formation and behavior change.
              </motion.p>
              <div className="space-y-3">
                <SourceItem
                  title="How Are Habits Formed: Modelling Habit Formation in the Real World"
                  source="European Journal of Social Psychology (Lally et al., 2010)"
                  url="https://onlinelibrary.wiley.com/doi/abs/10.1002/ejsp.674"
                  description="Research on habit formation timelines and the role of daily repetition and streaks."
                  delay={1.5}
                />
                <SourceItem
                  title="Self-Determination Theory and Health Behavior Change"
                  source="Deci & Ryan, American Psychologist"
                  url="https://selfdeterminationtheory.org/topics/application-health-and-medicine/"
                  description="Theoretical basis for intrinsic motivation in health behavior change."
                  delay={1.55}
                />
              </div>
            </motion.section>

            {/* AI Coaching */}
            <motion.section
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.6 }}
            >
              <motion.h2
                className="text-lg font-bold tracking-tight font-heading bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent mb-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.65 }}
              >
                AI-Powered Coaching
              </motion.h2>
              <motion.p
                className="text-sm mb-3 leading-relaxed"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.7 }}
              >
                VBot, V-Life's AI coach, uses large language models to provide personalized fitness guidance. AI responses are generated based on your data and general fitness knowledge.
              </motion.p>
              <motion.div
                className="rounded-lg backdrop-blur-xl bg-white/5 border border-white/10 p-3 shadow-[0_0_15px_rgba(255,215,0,0.08)]"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.75 }}
                whileHover={{ scale: 1.01, y: -2 }}
              >
                <p className="text-xs text-white/70 leading-relaxed">
                  <strong className="text-white/90">Important:</strong> AI-generated recommendations are for informational purposes only. They are not reviewed by medical professionals and should not replace advice from a qualified healthcare provider, registered dietitian, or certified fitness professional. Always verify AI suggestions with authoritative sources and consult your doctor before making significant health changes.
                </p>
              </motion.div>
            </motion.section>

            {/* General Health Resources */}
            <motion.section
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.8 }}
            >
              <motion.h2
                className="text-lg font-bold tracking-tight font-heading bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent mb-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.85 }}
              >
                Authoritative Health Resources
              </motion.h2>
              <motion.p
                className="text-sm mb-3 leading-relaxed"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.9 }}
              >
                For additional evidence-based health information, we recommend the following trusted sources:
              </motion.p>
              <div className="space-y-3">
                <SourceItem
                  title="MedlinePlus - Exercise and Physical Fitness"
                  source="U.S. National Library of Medicine (NIH)"
                  url="https://medlineplus.gov/exerciseandphysicalfitness.html"
                  description="Comprehensive health information from the National Institutes of Health."
                  delay={1.95}
                />
                <SourceItem
                  title="Dietary Guidelines for Americans"
                  source="U.S. Department of Agriculture (USDA)"
                  url="https://www.dietaryguidelines.gov/"
                  description="Federal dietary guidance based on current scientific evidence."
                  delay={2.0}
                />
                <SourceItem
                  title="WHO Guidelines on Physical Activity and Sedentary Behaviour"
                  source="World Health Organization (WHO)"
                  url="https://www.who.int/publications/i/item/9789240015128"
                  description="Global recommendations for physical activity across all age groups."
                  delay={2.05}
                />
              </div>
            </motion.section>

            <motion.section
              className="border-t border-white/10 pt-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.1 }}
            >
              <p className="text-xs text-white/50 leading-relaxed">
                This page provides citations and references for the health and fitness information used within V-Life.
                The formulas and recommendations in this app are based on established exercise science and nutrition research.
                Individual results may vary. Last updated: February 2026.
              </p>
            </motion.section>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

function SourceItem({
  title,
  source,
  url,
  description,
  delay = 0
}: {
  title: string
  source: string
  url: string
  description: string
  delay?: number
}) {
  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-lg border border-white/10 backdrop-blur-xl bg-white/5 p-3 transition-all hover:bg-white/10 hover:border-accent/30 hover:shadow-[0_0_15px_rgba(255,215,0,0.15)]"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium tracking-tight font-heading text-white mb-0.5">{title}</p>
          <p className="text-xs text-accent drop-shadow-[0_0_10px_rgba(255,215,0,0.3)] mb-1">{source}</p>
          <p className="text-xs text-white/60 leading-relaxed">{description}</p>
        </div>
        <ExternalLink className="h-4 w-4 text-white/30 flex-shrink-0 mt-0.5 group-hover:text-accent transition-colors" />
      </div>
    </motion.a>
  )
}
