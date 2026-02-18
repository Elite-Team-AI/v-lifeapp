"use client"

import { motion } from "framer-motion"
import { ArrowLeft, BookOpen, ExternalLink } from "lucide-react"
import { ButtonGlow } from "@/components/ui/button-glow"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"

export default function HealthSourcesPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-charcoal pb-nav-safe">
      <div className="container max-w-3xl px-4 py-6">
        {/* Header */}
        <motion.div
          className="mb-6 flex items-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ButtonGlow variant="outline-glow" size="icon" onClick={() => router.back()} className="mr-3 h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </ButtonGlow>
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-accent" />
            <div>
              <h1 className="text-2xl font-bold text-white">Health Information Sources</h1>
              <p className="text-sm text-white/70">Scientific references for V-Life recommendations</p>
            </div>
          </div>
        </motion.div>

        {/* Medical Disclaimer */}
        <Card className="border-amber-500/20 bg-amber-500/5 backdrop-blur-sm mb-6">
          <CardContent className="p-4">
            <p className="text-sm text-amber-200/90 font-medium mb-1">Medical Disclaimer</p>
            <p className="text-xs text-amber-200/70">
              V-Life is designed for informational and educational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult your physician or a qualified healthcare professional before starting any new exercise program, making significant dietary changes, or if you have questions about a medical condition.
            </p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-black/50 backdrop-blur-sm">
          <CardContent className="p-6 space-y-8 text-white/80">

            {/* Calorie & Macro Calculations */}
            <section>
              <h2 className="text-lg font-bold text-white mb-3">Calorie & Macronutrient Calculations</h2>
              <p className="text-sm mb-3">
                V-Life calculates daily calorie targets based on your goal weight and activity level. Macronutrient ratios follow evidence-based guidelines from leading nutrition research organizations.
              </p>
              <div className="space-y-3">
                <SourceItem
                  title="Dietary Reference Intakes for Energy"
                  source="National Academies of Sciences, Engineering, and Medicine"
                  url="https://nap.nationalacademies.org/catalog/11537/dietary-reference-intakes-for-energy-carbohydrate-fiber-fat-fatty-acids-cholesterol-protein-and-amino-acids"
                  description="Foundation for calorie estimation based on body weight, activity level, and goals."
                />
                <SourceItem
                  title="Position Stand: Protein and Exercise"
                  source="International Society of Sports Nutrition (ISSN)"
                  url="https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0177-8"
                  description="Protein intake of 1.4–2.0 g/kg/day for exercising individuals. V-Life uses approximately 0.9 g/lb (~2.0 g/kg) for active users."
                />
                <SourceItem
                  title="Acceptable Macronutrient Distribution Ranges (AMDR)"
                  source="Institute of Medicine / National Academies"
                  url="https://nap.nationalacademies.org/catalog/10490/dietary-reference-intakes-for-energy-carbohydrate-fiber-fat-fatty-acids-cholesterol-protein-and-amino-acids-macronutrients"
                  description="Recommended ranges: Protein 10–35%, Carbohydrates 45–65%, Fat 20–35% of total calories. V-Life uses 30% protein, 40% carbs, 30% fat."
                />
                <SourceItem
                  title="Evidence-Based Recommendations for Natural Bodybuilding"
                  source="Journal of the International Society of Sports Nutrition"
                  url="https://jissn.biomedcentral.com/articles/10.1186/1550-2783-11-20"
                  description="Calorie targets of 11–13 cal/lb for weight management in active individuals."
                />
              </div>
            </section>

            {/* Exercise & Workout Programming */}
            <section>
              <h2 className="text-lg font-bold text-white mb-3">Exercise & Workout Programming</h2>
              <p className="text-sm mb-3">
                Workout recommendations in V-Life follow established exercise science principles for resistance training volume, frequency, and programming.
              </p>
              <div className="space-y-3">
                <SourceItem
                  title="ACSM Guidelines for Exercise Testing and Prescription"
                  source="American College of Sports Medicine (ACSM)"
                  url="https://www.acsm.org/education-resources/books/guidelines-exercise-testing-prescription"
                  description="Industry-standard guidelines for exercise frequency, intensity, time, and type (FITT)."
                />
                <SourceItem
                  title="Position Stand: Progression Models in Resistance Training"
                  source="American College of Sports Medicine (ACSM)"
                  url="https://journals.lww.com/acsm-msse/fulltext/2009/03000/progression_models_in_resistance_training_for.26.aspx"
                  description="Evidence-based recommendations for set/rep schemes, rest periods, and training frequency."
                />
                <SourceItem
                  title="Physical Activity Guidelines for Americans"
                  source="U.S. Department of Health and Human Services"
                  url="https://health.gov/our-work/nutrition-physical-activity/physical-activity-guidelines"
                  description="Foundational guidelines for recommended activity levels across age groups."
                />
              </div>
            </section>

            {/* Habit & Behavior Change */}
            <section>
              <h2 className="text-lg font-bold text-white mb-3">Habit Building & Behavior Change</h2>
              <p className="text-sm mb-3">
                V-Life's habit tracking system is informed by research on habit formation and behavior change.
              </p>
              <div className="space-y-3">
                <SourceItem
                  title="How Are Habits Formed: Modelling Habit Formation in the Real World"
                  source="European Journal of Social Psychology (Lally et al., 2010)"
                  url="https://onlinelibrary.wiley.com/doi/abs/10.1002/ejsp.674"
                  description="Research on habit formation timelines and the role of daily repetition and streaks."
                />
                <SourceItem
                  title="Self-Determination Theory and Health Behavior Change"
                  source="Deci & Ryan, American Psychologist"
                  url="https://selfdeterminationtheory.org/topics/application-health-and-medicine/"
                  description="Theoretical basis for intrinsic motivation in health behavior change."
                />
              </div>
            </section>

            {/* AI Coaching */}
            <section>
              <h2 className="text-lg font-bold text-white mb-3">AI-Powered Coaching</h2>
              <p className="text-sm mb-3">
                VBot, V-Life's AI coach, uses large language models to provide personalized fitness guidance. AI responses are generated based on your data and general fitness knowledge.
              </p>
              <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                <p className="text-xs text-white/70">
                  <strong className="text-white/90">Important:</strong> AI-generated recommendations are for informational purposes only. They are not reviewed by medical professionals and should not replace advice from a qualified healthcare provider, registered dietitian, or certified fitness professional. Always verify AI suggestions with authoritative sources and consult your doctor before making significant health changes.
                </p>
              </div>
            </section>

            {/* General Health Resources */}
            <section>
              <h2 className="text-lg font-bold text-white mb-3">Authoritative Health Resources</h2>
              <p className="text-sm mb-3">
                For additional evidence-based health information, we recommend the following trusted sources:
              </p>
              <div className="space-y-3">
                <SourceItem
                  title="MedlinePlus - Exercise and Physical Fitness"
                  source="U.S. National Library of Medicine (NIH)"
                  url="https://medlineplus.gov/exerciseandphysicalfitness.html"
                  description="Comprehensive health information from the National Institutes of Health."
                />
                <SourceItem
                  title="Dietary Guidelines for Americans"
                  source="U.S. Department of Agriculture (USDA)"
                  url="https://www.dietaryguidelines.gov/"
                  description="Federal dietary guidance based on current scientific evidence."
                />
                <SourceItem
                  title="WHO Guidelines on Physical Activity and Sedentary Behaviour"
                  source="World Health Organization (WHO)"
                  url="https://www.who.int/publications/i/item/9789240015128"
                  description="Global recommendations for physical activity across all age groups."
                />
              </div>
            </section>

            <section className="border-t border-white/10 pt-6">
              <p className="text-xs text-white/50">
                This page provides citations and references for the health and fitness information used within V-Life.
                The formulas and recommendations in this app are based on established exercise science and nutrition research.
                Individual results may vary. Last updated: February 2026.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function SourceItem({ title, source, url, description }: { title: string; source: string; url: string; description: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-lg border border-white/10 bg-white/5 p-3 transition-colors hover:bg-white/10 hover:border-accent/30"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white mb-0.5">{title}</p>
          <p className="text-xs text-accent mb-1">{source}</p>
          <p className="text-xs text-white/60">{description}</p>
        </div>
        <ExternalLink className="h-4 w-4 text-white/30 flex-shrink-0 mt-0.5" />
      </div>
    </a>
  )
}
