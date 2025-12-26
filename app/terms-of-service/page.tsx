"use client"

import { motion } from "framer-motion"
import { ArrowLeft, FileText } from "lucide-react"
import { ButtonGlow } from "@/components/ui/button-glow"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"

export default function TermsOfService() {
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
            <FileText className="h-6 w-6 text-accent" />
            <div>
              <h1 className="text-2xl font-bold text-white">Terms of Service</h1>
              <p className="text-sm text-white/70">Last updated: October 31, 2025</p>
            </div>
          </div>
        </motion.div>

        <Card className="border-white/10 bg-black/50 backdrop-blur-sm">
          <CardContent className="p-6 space-y-6 text-white/80">
            <section>
              <h2 className="text-xl font-bold text-white mb-3">1. Acceptance of Terms</h2>
              <p className="mb-3">
                Welcome to V-Life. By accessing or using our fitness and nutrition tracking application with AI-powered
                personalized coaching (the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you
                do not agree to these Terms, do not use the Service.
              </p>
              <p>
                These Terms constitute a legally binding agreement between you and V-Life ("we," "us," or "our"). We
                reserve the right to modify these Terms at any time, and your continued use of the Service constitutes
                acceptance of any changes.
              </p>
            </section>

            <section className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <h2 className="text-xl font-bold text-red-400 mb-3">2. Medical Disclaimer - IMPORTANT</h2>
              <p className="mb-3 font-semibold text-white">
                THE SERVICE IS NOT INTENDED TO PROVIDE MEDICAL, NUTRITIONAL, OR PROFESSIONAL HEALTH ADVICE.
              </p>
              <p className="mb-3">
                <strong className="text-white">You acknowledge and agree that:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li>
                  The Service, including all AI-generated content, recommendations, and coaching, is for informational
                  and educational purposes only
                </li>
                <li>
                  The Service is NOT a substitute for professional medical advice, diagnosis, or treatment from
                  qualified healthcare providers
                </li>
                <li>
                  You should ALWAYS consult with a physician, registered dietitian, or other qualified healthcare
                  professional before:
                  <ul className="list-circle pl-6 mt-2 space-y-1">
                    <li>Starting any new exercise program</li>
                    <li>Making significant changes to your diet</li>
                    <li>Taking any supplements or medications</li>
                    <li>If you have any pre-existing medical conditions</li>
                  </ul>
                </li>
                <li>
                  Never disregard professional medical advice or delay seeking it because of information provided by the
                  Service
                </li>
                <li>
                  If you experience any pain, discomfort, dizziness, or other adverse symptoms during exercise, stop
                  immediately and consult a healthcare professional
                </li>
                <li>
                  The Service is not designed to diagnose, treat, cure, or prevent any disease or medical condition
                </li>
              </ul>
              <p className="font-semibold text-red-400">
                BY USING THE SERVICE, YOU ASSUME ALL RISKS ASSOCIATED WITH YOUR EXERCISE AND NUTRITION ACTIVITIES.
              </p>
            </section>

            <section className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <h2 className="text-xl font-bold text-yellow-400 mb-3">3. AI-Generated Content Disclaimer</h2>
              <p className="mb-3">
                Our Service uses artificial intelligence to provide personalized coaching and recommendations.
              </p>
              <p className="mb-3">
                <strong className="text-white">You acknowledge and agree that:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>AI-generated content may contain errors, inaccuracies, or inappropriate recommendations</li>
                <li>AI recommendations are based on algorithms and data patterns, not human expertise or judgment</li>
                <li>The AI does not have access to your complete medical history or current health status</li>
                <li>You should use your own judgment and consult professionals before following AI recommendations</li>
                <li>We do not guarantee the accuracy, completeness, or reliability of AI-generated content</li>
                <li>
                  AI-generated workout plans and nutrition advice are general in nature and may not be suitable for your
                  specific circumstances
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">4. User Eligibility and Account</h2>
              <p className="mb-3">
                <strong className="text-white">4.1 Age Requirement:</strong> You must be at least 18 years old (or the
                age of majority in your jurisdiction) to use the Service. If you are between 13 and 18, you may only use
                the Service with parental or guardian consent and supervision.
              </p>
              <p className="mb-3">
                <strong className="text-white">4.2 Account Security:</strong> You are responsible for:
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-3">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized access</li>
              </ul>
              <p>
                <strong className="text-white">4.3 Accurate Information:</strong> You agree to provide accurate,
                current, and complete information and to update it as necessary.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">5. User Responsibilities and Conduct</h2>
              <p className="mb-3">You agree to:</p>
              <ul className="list-disc pl-6 space-y-1 mb-3">
                <li>Use the Service in compliance with all applicable laws and regulations</li>
                <li>Exercise safely and within your physical capabilities</li>
                <li>Consult healthcare professionals before making significant health changes</li>
                <li>Not share your account with others</li>
                <li>Not use the Service for any illegal or unauthorized purpose</li>
                <li>Not attempt to gain unauthorized access to any part of the Service</li>
                <li>Not interfere with or disrupt the Service or servers</li>
                <li>Not upload malicious code, viruses, or harmful content</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">6. Prohibited Uses</h2>
              <p className="mb-3">You may NOT use the Service to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Provide medical advice or services to others</li>
                <li>Impersonate any person or entity</li>
                <li>Harass, abuse, or harm others</li>
                <li>Violate any laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Collect or harvest user data without permission</li>
                <li>Reverse engineer or attempt to extract source code</li>
                <li>Use automated systems (bots, scrapers) without authorization</li>
                <li>Resell or redistribute the Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">7. Subscription and Payment</h2>
              <p className="mb-3">
                <strong className="text-white">7.1 Subscription Plans:</strong> The Service may offer various
                subscription plans with different features and pricing.
              </p>
              <p className="mb-3">
                <strong className="text-white">7.2 Billing:</strong> By subscribing, you authorize us to charge your
                payment method on a recurring basis according to your chosen plan.
              </p>
              <p className="mb-3">
                <strong className="text-white">7.3 Cancellation:</strong> You may cancel your subscription at any time
                through the app settings. Cancellation will take effect at the end of your current billing period.
              </p>
              <p className="mb-3">
                <strong className="text-white">7.4 Refunds:</strong> Refunds are provided at our discretion and in
                accordance with applicable law. Generally, payments are non-refundable except where required by law.
              </p>
              <p>
                <strong className="text-white">7.5 Price Changes:</strong> We reserve the right to change subscription
                prices with 30 days' notice.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">8. Intellectual Property</h2>
              <p className="mb-3">
                <strong className="text-white">8.1 Our Content:</strong> The Service, including all content, features,
                functionality, software, text, graphics, logos, and AI-generated content, is owned by V-Life and
                protected by copyright, trademark, and other intellectual property laws.
              </p>
              <p className="mb-3">
                <strong className="text-white">8.2 Limited License:</strong> We grant you a limited, non-exclusive,
                non-transferable license to access and use the Service for personal, non-commercial purposes.
              </p>
              <p className="mb-3">
                <strong className="text-white">8.3 Your Content:</strong> You retain ownership of content you submit
                (photos, data, etc.). By submitting content, you grant us a worldwide, royalty-free license to use,
                store, and process it to provide the Service.
              </p>
              <p>
                <strong className="text-white">8.4 Feedback:</strong> Any feedback, suggestions, or ideas you provide
                become our property, and we may use them without compensation or attribution.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">9. Limitation of Liability</h2>
              <p className="mb-3 font-semibold text-white">TO THE MAXIMUM EXTENT PERMITTED BY LAW:</p>
              <ul className="list-disc pl-6 space-y-2 mb-3">
                <li>
                  THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED
                </li>
                <li>
                  WE DISCLAIM ALL WARRANTIES, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
                  NON-INFRINGEMENT
                </li>
                <li>WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE</li>
                <li>
                  WE ARE NOT LIABLE FOR ANY INJURIES, DAMAGES, OR LOSSES RESULTING FROM YOUR USE OF THE SERVICE,
                  INCLUDING:
                  <ul className="list-circle pl-6 mt-2 space-y-1">
                    <li>Physical injuries from exercise</li>
                    <li>Health issues from dietary changes</li>
                    <li>Reliance on AI-generated recommendations</li>
                    <li>Data loss or security breaches</li>
                    <li>Service interruptions or errors</li>
                  </ul>
                </li>
                <li>
                  OUR TOTAL LIABILITY TO YOU FOR ANY CLAIMS SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE 12 MONTHS
                  BEFORE THE CLAIM
                </li>
                <li>WE ARE NOT LIABLE FOR INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, OR PUNITIVE DAMAGES</li>
              </ul>
              <p className="text-sm">
                Some jurisdictions do not allow the exclusion of certain warranties or limitation of liability, so some
                of the above limitations may not apply to you.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">10. Indemnification</h2>
              <p>
                You agree to indemnify, defend, and hold harmless V-Life, its officers, directors, employees, and agents
                from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:
              </p>
              <ul className="list-disc pl-6 space-y-1 mt-3">
                <li>Your use of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any rights of others</li>
                <li>Your content or data</li>
                <li>Any injuries or damages you sustain</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">11. Dispute Resolution and Arbitration</h2>
              <p className="mb-3">
                <strong className="text-white">11.1 Informal Resolution:</strong> Before filing a claim, you agree to
                contact us to attempt to resolve the dispute informally.
              </p>
              <p className="mb-3">
                <strong className="text-white">11.2 Binding Arbitration:</strong> Any disputes that cannot be resolved
                informally shall be resolved through binding arbitration in accordance with the rules of the American
                Arbitration Association.
              </p>
              <p className="mb-3">
                <strong className="text-white">11.3 Class Action Waiver:</strong> You agree to resolve disputes on an
                individual basis and waive the right to participate in class actions or class arbitrations.
              </p>
              <p>
                <strong className="text-white">11.4 Exceptions:</strong> Either party may seek injunctive relief in
                court for intellectual property infringement or unauthorized access.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">12. Termination</h2>
              <p className="mb-3">
                <strong className="text-white">12.1 By You:</strong> You may terminate your account at any time through
                the app settings.
              </p>
              <p className="mb-3">
                <strong className="text-white">12.2 By Us:</strong> We may suspend or terminate your access to the
                Service at any time, with or without notice, for:
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-3">
                <li>Violation of these Terms</li>
                <li>Fraudulent or illegal activity</li>
                <li>Non-payment of fees</li>
                <li>Any reason at our discretion</li>
              </ul>
              <p>
                <strong className="text-white">12.3 Effect of Termination:</strong> Upon termination, your right to use
                the Service ceases immediately. We may delete your data in accordance with our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">13. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of [Your State/Country],
                without regard to conflict of law principles. Any legal action must be brought in the courts located in
                [Your Jurisdiction].
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">14. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. We will notify you of material changes by
                posting the updated Terms and updating the "Last updated" date. Your continued use of the Service after
                changes constitutes acceptance of the modified Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">15. Severability</h2>
              <p>
                If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited
                or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force
                and effect.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">16. Entire Agreement</h2>
              <p>
                These Terms, together with our Privacy Policy, constitute the entire agreement between you and V-Life
                regarding the Service and supersede all prior agreements and understandings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">17. Contact Information</h2>
              <p className="mb-3">If you have questions about these Terms, please contact us at:</p>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="font-semibold text-white">V-Life Legal Team</p>
                <p>Email: legal@vlife.app</p>
                <p>Address: [Your Company Address]</p>
              </div>
            </section>

            <section className="border-t border-white/10 pt-6">
              <p className="text-sm text-white/60 mb-3">
                <strong className="text-white">ACKNOWLEDGMENT:</strong>
              </p>
              <p className="text-sm text-white/60">
                BY CLICKING "I AGREE" OR BY ACCESSING OR USING THE SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ,
                UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS OF SERVICE, INCLUDING THE MEDICAL DISCLAIMER AND
                LIMITATION OF LIABILITY PROVISIONS.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
