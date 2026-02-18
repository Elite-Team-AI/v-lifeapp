"use client"

import { motion } from "framer-motion"
import { ArrowLeft, Shield } from "lucide-react"
import { ButtonGlow } from "@/components/ui/button-glow"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"

export default function PrivacyPolicy() {
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
            <Shield className="h-6 w-6 text-accent" />
            <div>
              <h1 className="text-2xl font-bold text-white">Privacy Policy</h1>
              <p className="text-sm text-white/70">Last updated: October 31, 2025</p>
            </div>
          </div>
        </motion.div>

        <Card className="border-white/10 bg-black/50 backdrop-blur-sm">
          <CardContent className="p-6 space-y-6 text-white/80">
            <section>
              <h2 className="text-xl font-bold text-white mb-3">1. Introduction</h2>
              <p className="mb-3">
                Welcome to V-Life ("we," "our," or "us"). We are committed to protecting your privacy and personal
                information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information
                when you use our fitness and nutrition tracking application with AI-powered personalized coaching (the
                "Service").
              </p>
              <p>
                By using our Service, you agree to the collection and use of information in accordance with this policy.
                If you do not agree with our policies and practices, please do not use our Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">2. Information We Collect</h2>

              <h3 className="text-lg font-semibold text-white mb-2">2.1 Personal Information</h3>
              <p className="mb-3">We collect information that you provide directly to us, including:</p>
              <ul className="list-disc pl-6 space-y-1 mb-3">
                <li>Account information (name, email address, password)</li>
                <li>Profile information (age, gender, height, weight, fitness goals)</li>
                <li>Contact information (phone number, if provided)</li>
                <li>Payment information (processed securely through third-party payment processors)</li>
              </ul>

              <h3 className="text-lg font-semibold text-white mb-2">2.2 Health and Fitness Data</h3>
              <p className="mb-3">We collect health and fitness-related information, including:</p>
              <ul className="list-disc pl-6 space-y-1 mb-3">
                <li>Workout data (exercises, sets, reps, weight lifted, duration)</li>
                <li>Nutrition data (meals, calories, macronutrients, dietary restrictions, allergies)</li>
                <li>Body measurements (weight, body fat percentage, measurements)</li>
                <li>Activity levels and exercise preferences</li>
                <li>Progress photos (if you choose to upload them)</li>
                <li>Habit tracking data (daily habits, streaks, completion rates)</li>
              </ul>

              <h3 className="text-lg font-semibold text-white mb-2">2.3 Usage Information</h3>
              <p className="mb-3">We automatically collect certain information about your device and usage:</p>
              <ul className="list-disc pl-6 space-y-1 mb-3">
                <li>Device information (device type, operating system, browser type)</li>
                <li>Log data (IP address, access times, pages viewed)</li>
                <li>Usage patterns (features used, time spent in app)</li>
                <li>Location data (timezone for habit reset timing)</li>
              </ul>

              <h3 className="text-lg font-semibold text-white mb-2">2.4 AI Interaction Data</h3>
              <p className="mb-3">When you interact with our AI-powered coaching features, we collect:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Questions and prompts you submit to the AI coach</li>
                <li>AI-generated responses and recommendations</li>
                <li>Feedback on AI suggestions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">3. How We Use Your Information</h2>
              <p className="mb-3">We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Provide, maintain, and improve our Service</li>
                <li>Generate personalized workout and nutrition plans using AI</li>
                <li>Track your progress and provide insights</li>
                <li>Send you notifications, reminders, and updates</li>
                <li>Process payments and manage subscriptions</li>
                <li>Respond to your comments, questions, and support requests</li>
                <li>Detect, prevent, and address technical issues and security threats</li>
                <li>Comply with legal obligations</li>
                <li>Improve our AI algorithms and coaching quality</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">4. AI-Powered Features and Data Processing</h2>
              <p className="mb-3">
                Our Service uses artificial intelligence to provide personalized coaching and recommendations. Before using AI-powered features, you will be asked to provide explicit consent for data sharing. Your
                health and fitness data may be processed by AI models to:
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-3">
                <li>Generate customized workout plans</li>
                <li>Provide nutrition recommendations and meal planning</li>
                <li>Analyze your progress and suggest adjustments</li>
                <li>Answer your fitness and nutrition questions via AI coaching (VBot)</li>
                <li>Generate daily personalized insights</li>
                <li>Parse food descriptions and images for nutrition logging</li>
              </ul>

              <h3 className="text-lg font-semibold text-white mb-2">4.1 OpenAI (Chat & Planning)</h3>
              <p className="mb-3">
                We share the following data with OpenAI to power AI coaching (VBot), meal planning, daily insights, and food logging:
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-3">
                <li>Profile information (name, age, gender, height, weight, fitness goals, activity level)</li>
                <li>Workout history (exercises, sets, reps, duration)</li>
                <li>Meal and nutrition logs (meal type, calories, macronutrients)</li>
                <li>Habit tracking data (categories, streaks, completion status)</li>
                <li>Weight entries and progress data</li>
                <li>Messages and prompts you send to the AI coach</li>
                <li>Food descriptions or images submitted for nutritional analysis</li>
              </ul>

              <h3 className="text-lg font-semibold text-white mb-2">4.2 Google (Voice Features)</h3>
              <p className="mb-3">
                If you enable voice features, we share the following data with Google (Gemini API):
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-3">
                <li>Voice audio recordings (for speech-to-text transcription)</li>
                <li>AI response text (for text-to-speech audio playback)</li>
                <li>Conversational context during live voice sessions</li>
              </ul>

              <h3 className="text-lg font-semibold text-white mb-2">4.3 Your Control</h3>
              <p className="mb-3">
                You can revoke your consent for AI data sharing at any time in Settings. Core features (workout tracking, meal logging, habit tracking, community) work without AI. You can view the sources and citations for our health recommendations at any time on the Health Information Sources page.
              </p>

              <p className="mb-3">
                <strong className="text-white">Important:</strong> AI-generated content is for informational purposes
                only and should not be considered medical, nutritional, or professional advice. Always consult with
                qualified healthcare professionals before making significant changes to your diet or exercise routine.
              </p>
              <p>
                Data is processed in accordance with our agreements with these providers and their respective privacy policies
                (<a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-accent underline">OpenAI Privacy Policy</a>,
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-accent underline ml-1">Google Privacy Policy</a>).
                These providers offer the same or equivalent level of data protection as described in this policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">5. Data Sharing and Disclosure</h2>
              <p className="mb-3">We do not sell your personal information. We may share your information with:</p>

              <h3 className="text-lg font-semibold text-white mb-2">5.1 Service Providers</h3>
              <p className="mb-3">
                We share information with third-party service providers who perform services on our behalf:
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-3">
                <li>Cloud hosting and database services (Supabase)</li>
                <li>AI and machine learning services (OpenAI)</li>
                <li>Payment processors (Stripe)</li>
                <li>Analytics providers</li>
                <li>Customer support tools</li>
              </ul>

              <h3 className="text-lg font-semibold text-white mb-2">5.2 Legal Requirements</h3>
              <p className="mb-3">We may disclose your information if required to do so by law or in response to:</p>
              <ul className="list-disc pl-6 space-y-1 mb-3">
                <li>Valid legal processes (subpoenas, court orders)</li>
                <li>Requests from law enforcement or government agencies</li>
                <li>Protection of our rights, property, or safety</li>
                <li>Emergency situations involving potential harm</li>
              </ul>

              <h3 className="text-lg font-semibold text-white mb-2">5.3 Business Transfers</h3>
              <p>
                If we are involved in a merger, acquisition, or sale of assets, your information may be transferred as
                part of that transaction. We will notify you of any such change.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">6. Data Security</h2>
              <p className="mb-3">
                We implement appropriate technical and organizational measures to protect your information:
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-3">
                <li>Encryption of data in transit and at rest</li>
                <li>Secure authentication and access controls</li>
                <li>Regular security assessments and updates</li>
                <li>Employee training on data protection</li>
                <li>Incident response procedures</li>
              </ul>
              <p>
                However, no method of transmission over the Internet or electronic storage is 100% secure. While we
                strive to protect your information, we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">7. Your Rights and Choices</h2>
              <p className="mb-3">You have the following rights regarding your personal information:</p>

              <h3 className="text-lg font-semibold text-white mb-2">7.1 Access and Portability</h3>
              <p className="mb-3">
                You can access and export your personal data at any time through the "Export My Data" feature in
                Settings.
              </p>

              <h3 className="text-lg font-semibold text-white mb-2">7.2 Correction</h3>
              <p className="mb-3">You can update your profile information at any time through the app settings.</p>

              <h3 className="text-lg font-semibold text-white mb-2">7.3 Deletion</h3>
              <p className="mb-3">
                You can request deletion of your account and associated data through the "Delete Account" option in
                Settings. Note that some information may be retained for legal or legitimate business purposes.
              </p>

              <h3 className="text-lg font-semibold text-white mb-2">7.4 Opt-Out</h3>
              <p className="mb-3">You can opt out of:</p>
              <ul className="list-disc pl-6 space-y-1 mb-3">
                <li>Push notifications (through device settings or app settings)</li>
                <li>Marketing communications (via unsubscribe links)</li>
                <li>Certain data collection (through app settings)</li>
              </ul>

              <h3 className="text-lg font-semibold text-white mb-2">7.5 GDPR Rights (EU Users)</h3>
              <p className="mb-3">If you are in the European Economic Area, you have additional rights:</p>
              <ul className="list-disc pl-6 space-y-1 mb-3">
                <li>Right to object to processing</li>
                <li>Right to restrict processing</li>
                <li>Right to lodge a complaint with a supervisory authority</li>
              </ul>

              <h3 className="text-lg font-semibold text-white mb-2">7.6 CCPA Rights (California Users)</h3>
              <p className="mb-3">California residents have the right to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Know what personal information is collected</li>
                <li>Know whether personal information is sold or disclosed</li>
                <li>Opt-out of the sale of personal information (we do not sell your information)</li>
                <li>Request deletion of personal information</li>
                <li>Non-discrimination for exercising privacy rights</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">8. Data Retention</h2>
              <p className="mb-3">We retain your information for as long as necessary to:</p>
              <ul className="list-disc pl-6 space-y-1 mb-3">
                <li>Provide our Service to you</li>
                <li>Comply with legal obligations</li>
                <li>Resolve disputes</li>
                <li>Enforce our agreements</li>
              </ul>
              <p>
                When you delete your account, we will delete or anonymize your personal information within 30 days,
                except where retention is required by law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">9. Children's Privacy</h2>
              <p>
                Our Service is not intended for children under 13 years of age (or 16 in the EU). We do not knowingly
                collect personal information from children. If you are a parent or guardian and believe your child has
                provided us with personal information, please contact us, and we will delete such information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">10. International Data Transfers</h2>
              <p>
                Your information may be transferred to and processed in countries other than your country of residence.
                These countries may have different data protection laws. We ensure appropriate safeguards are in place
                to protect your information in accordance with this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">11. Cookies and Tracking Technologies</h2>
              <p className="mb-3">We use cookies and similar tracking technologies to:</p>
              <ul className="list-disc pl-6 space-y-1 mb-3">
                <li>Maintain your session and preferences</li>
                <li>Analyze usage patterns and improve our Service</li>
                <li>Provide personalized content</li>
              </ul>
              <p>You can control cookies through your browser settings.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">12. Changes to This Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any material changes by
                posting the new Privacy Policy on this page and updating the "Last updated" date. Your continued use of
                the Service after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">13. Contact Us</h2>
              <p className="mb-3">
                If you have questions about this Privacy Policy or our privacy practices, please contact us at:
              </p>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="font-semibold text-white">V-Life Privacy Team</p>
                <p>Email: privacy@vlife.app</p>
                <p>Address: [Your Company Address]</p>
              </div>
            </section>

            <section className="border-t border-white/10 pt-6">
              <p className="text-sm text-white/60">
                This Privacy Policy is designed to comply with GDPR, CCPA, HIPAA (where applicable), and other relevant
                data protection regulations. We are committed to protecting your privacy and handling your data
                responsibly.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
