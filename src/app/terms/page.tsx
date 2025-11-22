import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <Link href="/auth/signin">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sign In
          </Button>
        </Link>

        <div className="prose prose-lg dark:prose-invert max-w-none bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-8 md:p-12 shadow-xl">
          <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Teamy ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p>
              Teamy is a web-based platform designed to help teams manage their activities, including but not limited to:
            </p>
            <ul>
              <li>Team and member management</li>
              <li>Event scheduling and calendar management</li>
              <li>Announcements and communication</li>
              <li>Attendance tracking</li>
              <li>Financial management</li>
              <li>Test administration and grading</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">3.1 Account Creation</h3>
            <p>
              To use the Service, you must create an account using Google OAuth. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">3.2 Account Responsibilities</h3>
            <p>You agree to:</p>
            <ul>
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and promptly update your account information</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Accept responsibility for all activities that occur under your account</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use the Service for any illegal purpose or in violation of any laws</li>
              <li>Transmit any harmful code, viruses, or malicious software</li>
              <li>Attempt to gain unauthorized access to the Service or related systems</li>
              <li>Interfere with or disrupt the Service or servers connected to the Service</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Post content that is defamatory, obscene, or violates others' rights</li>
              <li>Impersonate any person or entity</li>
              <li>Collect or harvest information about other users without their consent</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. User Content</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">5.1 Content Ownership</h3>
            <p>
              You retain ownership of any content you post, upload, or submit to the Service ("User Content"). By posting User Content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and distribute your User Content solely for the purpose of operating and providing the Service.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">5.2 Content Responsibility</h3>
            <p>
              You are solely responsible for your User Content. We do not endorse or assume responsibility for any User Content. We reserve the right to remove any User Content that violates these Terms or is otherwise objectionable.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property</h2>
            <p>
              The Service and its original content, features, and functionality are owned by Teamy and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. You may not copy, modify, distribute, sell, or lease any part of our Service without our prior written consent.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Privacy</h2>
            <p>
              Your use of the Service is also governed by our{' '}
              <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                Privacy Policy
              </Link>
              . Please review our{' '}
              <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                Privacy Policy
              </Link>
              , which also governs your use of the Service, to understand our practices regarding the collection and use of your information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Service Availability</h2>
            <p>
              We strive to provide reliable service but do not guarantee that the Service will be available at all times. The Service may be unavailable due to maintenance, updates, or circumstances beyond our control. We are not liable for any loss or damage resulting from Service unavailability.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Termination</h2>
            <p>
              We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including if you breach these Terms. Upon termination, your right to use the Service will cease immediately. You may also terminate your account at any time by contacting us.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Disclaimer of Warranties</h2>
            <p>
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL TEAMY, ITS AFFILIATES, OR THEIR RESPECTIVE OFFICERS, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM YOUR USE OF THE SERVICE.
            </p>
            <p className="mt-4">
              IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU FOR ALL DAMAGES EXCEED THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS PRIOR TO THE ACTION GIVING RISE TO THE LIABILITY, OR ONE HUNDRED DOLLARS ($100), WHICHEVER IS GREATER. SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OR LIMITATION OF INCIDENTAL OR CONSEQUENTIAL DAMAGES, SO THE ABOVE LIMITATIONS MAY NOT APPLY TO YOU.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Indemnification</h2>
            <p>
              You agree to defend, indemnify, and hold harmless Teamy and its affiliates from and against any claims, damages, obligations, losses, liabilities, costs, or debt, and expenses (including attorney's fees) arising from your use of the Service, your violation of these Terms, or your violation of any third-party rights.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Dispute Resolution</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">13.1 Binding Arbitration</h3>
            <p>
              Any dispute, controversy, or claim arising out of or relating to these Terms or the Service shall be settled by binding arbitration in accordance with the rules of the American Arbitration Association (AAA), except that either party may seek injunctive relief in any court of competent jurisdiction. You agree to waive any right to a jury trial and to participate in a class action lawsuit.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">13.2 Class Action Waiver</h3>
            <p>
              YOU AGREE THAT ANY DISPUTE RESOLUTION PROCEEDINGS WILL BE CONDUCTED ONLY ON AN INDIVIDUAL BASIS AND NOT IN A CLASS, CONSOLIDATED, OR REPRESENTATIVE ACTION. If for any reason a claim proceeds in court rather than in arbitration, you waive any right to a jury trial and agree to proceed only on an individual basis.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">13.3 Time Limitation</h3>
            <p>
              You agree that any claim or cause of action arising out of or related to these Terms or the Service must be filed within one (1) year after such claim or cause of action arose, or be forever barred.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">14. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the State of [Your State], United States, without regard to its conflict of law provisions. The United Nations Convention on Contracts for the International Sale of Goods does not apply to these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">15. Age Restrictions</h2>
            <p>
              The Service is not intended for users under the age of 13. If you are between 13 and 18 years of age (or the age of majority in your jurisdiction), you may use the Service only with the consent and supervision of a parent or legal guardian who agrees to be bound by these Terms. If you are a parent or guardian permitting a minor to use the Service, you agree to be responsible for the minor's use of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">16. Prohibited Activities</h2>
            <p>In addition to the restrictions in Section 4, you specifically agree not to:</p>
            <ul>
              <li>Reverse engineer, decompile, disassemble, or otherwise attempt to derive the source code of the Service</li>
              <li>Use automated systems (bots, scrapers) to access the Service without our express written permission</li>
              <li>Circumvent or attempt to circumvent any security measures or access controls</li>
              <li>Use the Service to violate any applicable export control laws or regulations</li>
              <li>Resell, redistribute, or sublicense access to the Service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">17. Digital Millennium Copyright Act (DMCA)</h2>
            <p>
              If you believe that any content on the Service infringes your copyright, please provide us with a written notice containing the following information: (a) identification of the copyrighted work claimed to have been infringed; (b) identification of the allegedly infringing material; (c) your contact information; (d) a statement that you have a good faith belief that the use is not authorized; (e) a statement that the information is accurate and you are authorized to act on behalf of the copyright owner; and (f) your signature. Send notices to: legal@teamy.app
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">18. Force Majeure</h2>
            <p>
              We shall not be liable for any failure or delay in performance under these Terms which is due to earthquake, fire, flood, act of God, act of war, terrorism, epidemic, pandemic, labor dispute, government action, internet or telecommunications failure, or other causes which are beyond our reasonable control.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">19. Beta and Preview Features</h2>
            <p>
              We may offer access to beta, preview, or experimental features. These features are provided "as is" and may be modified or discontinued at any time. We make no warranties regarding beta features and they may contain bugs or errors. Your use of beta features is at your own risk.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">20. Assignment</h2>
            <p>
              You may not assign or transfer these Terms or your rights hereunder without our prior written consent. We may assign these Terms or any rights hereunder without your consent to any affiliate or in connection with a merger, acquisition, or sale of assets.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">21. Severability</h2>
            <p>
              If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary so that these Terms will otherwise remain in full force and effect and enforceable.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">22. Entire Agreement</h2>
            <p>
              These Terms, together with our{' '}
              <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                Privacy Policy
              </Link>
              , constitute the entire agreement between you and Teamy regarding the Service and supersede all prior agreements and understandings, whether written or oral.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">23. No Third-Party Beneficiaries</h2>
            <p>
              These Terms are for the sole benefit of the parties hereto and nothing herein, express or implied, is intended to or shall confer upon any other person or entity any legal or equitable right, benefit, or remedy of any nature whatsoever.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">24. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the new Terms on this page and updating the "Last updated" date. Material changes will be effective 30 days after posting. Your continued use of the Service after such modifications constitutes your acceptance of the updated Terms. If you do not agree to the modified Terms, you must stop using the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">25. Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <p className="mt-4">
              <strong>Email:</strong> legal@teamy.app<br />
              <strong>Address:</strong> [Your Contact Address]
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

