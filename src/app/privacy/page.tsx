import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PrivacyPolicyPage() {
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
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p>
              Teamy (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our team management platform (the &quot;Service&quot;). This Privacy Policy should be read in conjunction with our{' '}
              <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                Terms of Service
              </Link>
              .
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">2.1 Information You Provide</h3>
            <p>We collect information that you provide directly to us, including:</p>
            <ul>
              <li>Account information (name, email address, profile picture) through Google OAuth</li>
              <li>Team and membership information</li>
              <li>Content you create (announcements, calendar events, test submissions, replies, reactions)</li>
              <li>Financial data (expenses, purchase requests) if applicable</li>
              <li>Attendance records and check-in data</li>
              <li>Test answers and submission data</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">2.2 Automatically Collected Information</h3>
            <p>We automatically collect certain information when you use our Service:</p>
            <ul>
              <li>Usage data and interaction patterns (pages visited, features used, time spent)</li>
              <li>Device information (device type, operating system, browser type and version)</li>
              <li>IP address and approximate location data (city/region level)</li>
              <li>Cookies and similar tracking technologies (see Section 2.3)</li>
              <li>Log files (access times, error logs, performance data)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">2.3 Cookies and Tracking Technologies</h3>
            <p>
              We use cookies and similar technologies to maintain your session, remember your preferences, and analyze usage. You can control cookies through your browser settings, but disabling cookies may limit functionality. We use:
            </p>
            <ul>
              <li><strong>Essential cookies:</strong> Required for authentication and core functionality</li>
              <li><strong>Functional cookies:</strong> Remember your preferences and settings</li>
              <li><strong>Analytics cookies:</strong> Help us understand how the Service is used (we do not use third-party advertising cookies)</li>
            </ul>
            <p className="mt-4">
              <strong>Do Not Track:</strong> Our Service does not respond to &quot;Do Not Track&quot; signals from browsers. We do not track users across third-party websites.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, maintain, and improve our Service</li>
              <li>Authenticate users and manage accounts</li>
              <li>Send notifications and communications related to your teams</li>
              <li>Process and manage team activities (events, attendance, finances)</li>
              <li>Detect and prevent fraud or abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Information Sharing and Disclosure</h2>
            <p>We do not sell, rent, or trade your personal information. We may share your information only in the following circumstances:</p>
            <ul>
              <li><strong>Within Your Teams:</strong> Information you post (announcements, events, test results) is visible to members of your teams based on team settings and permissions</li>
              <li><strong>Service Providers:</strong> We share data with trusted third-party service providers who assist in operating our Service, including:
                <ul className="ml-6 mt-2">
                  <li>Google (OAuth authentication) - see Google&apos;s Privacy Policy</li>
                  <li>Resend (email delivery) - see Resend&apos;s Privacy Policy</li>
                  <li>Hosting and infrastructure providers</li>
                  <li>Database and analytics services</li>
                </ul>
                These providers are contractually obligated to protect your information and use it only for specified purposes.
              </li>
              <li><strong>Legal Requirements:</strong> We may disclose information if required by law, court order, or government regulation, or to protect our rights, property, or safety, or that of our users</li>
              <li><strong>Business Transfers:</strong> Information may be transferred in connection with a merger, acquisition, reorganization, or sale of assets, with notice to affected users</li>
              <li><strong>With Your Consent:</strong> We may share information with your explicit consent or at your direction</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information, including:
            </p>
            <ul>
              <li>Encryption of data in transit (TLS/SSL) and at rest</li>
              <li>Regular security assessments and vulnerability testing</li>
              <li>Access controls and authentication requirements</li>
              <li>Secure coding practices and regular software updates</li>
              <li>Employee training on data protection</li>
              <li>Incident response procedures</li>
            </ul>
            <p className="mt-4">
              However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security. You are responsible for maintaining the confidentiality of your account credentials.
            </p>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">5.1 Data Breach Notification</h3>
            <p>
              In the event of a data breach that may affect your personal information, we will notify affected users and relevant authorities as required by applicable law, typically within 72 hours of becoming aware of the breach.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Your Rights and Choices</h2>
            <p>You have the right to:</p>
            <ul>
              <li><strong>Access:</strong> Request a copy of your personal information</li>
              <li><strong>Correction:</strong> Correct inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
              <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
              <li><strong>Opt-out:</strong> Unsubscribe from non-essential communications</li>
              <li><strong>Restriction:</strong> Request restriction of processing in certain circumstances</li>
              <li><strong>Objection:</strong> Object to processing of your data for legitimate interests</li>
            </ul>
            <p className="mt-4">
              To exercise these rights, please contact us at privacy@teamy.app. We will respond within 30 days. You may also update your account information directly through the Service settings.
            </p>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">6.1 California Privacy Rights (CCPA)</h3>
            <p>
              If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):
            </p>
            <ul>
              <li>Right to know what personal information is collected, used, shared, or sold</li>
              <li>Right to delete personal information (with certain exceptions)</li>
              <li>Right to opt-out of the sale of personal information (we do not sell personal information)</li>
              <li>Right to non-discrimination for exercising your privacy rights</li>
            </ul>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">6.2 European Privacy Rights (GDPR)</h3>
            <p>
              If you are located in the European Economic Area (EEA), you have additional rights under the General Data Protection Regulation (GDPR), including the right to lodge a complaint with your local data protection authority.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Children's Privacy</h2>
            <p>
              Our Service is intended for use by teams and organizations, which may include students under the age of 18. We comply with applicable laws regarding children&apos;s privacy, including the Children&apos;s Online Privacy Protection Act (COPPA) where applicable. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to provide our Service and fulfill the purposes outlined in this Privacy Policy. Specific retention periods:
            </p>
            <ul>
              <li><strong>Account data:</strong> Retained while your account is active and for 30 days after deletion</li>
              <li><strong>Team content:</strong> Retained while the team exists and for 90 days after team deletion</li>
              <li><strong>Financial records:</strong> Retained for 7 years as required by law</li>
              <li><strong>Test data:</strong> Retained according to team settings, typically until team deletion</li>
              <li><strong>Log files:</strong> Retained for 90 days for security and troubleshooting</li>
            </ul>
            <p className="mt-4">
              When you delete your account, we will delete or anonymize your personal information within 30 days, subject to certain exceptions for legal compliance, dispute resolution, or enforcement of our{' '}
              <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                Terms of Service
              </Link>
              . Some information may remain in backups for up to 90 days.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that differ from those in your country. By using our Service, you consent to the transfer of your information to these countries.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or our privacy practices, please contact us at:
            </p>
            <p className="mt-4">
              <strong>Email:</strong> privacy@teamy.app<br />
              <strong>Address:</strong> [Your Contact Address]
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

