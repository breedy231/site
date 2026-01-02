import React from "react"
import Layout from "../components/layout"

export const Head = () => {
  return (
    <>
      <title>Responsive Test - Brendan Reed</title>
      <html lang="en" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#032740" />
    </>
  )
}

/**
 * Responsive Testing Page
 *
 * Access with ?debug to see viewport info
 * Examples:
 * - http://localhost:8000/responsive-test?debug
 * - http://YOUR_IP:8000/responsive-test?debug (from iPhone)
 */
export default function ResponsiveTest() {
  return (
    <Layout>
      <div className="p-6 text-gray-900 dark:text-white">
        <h1 className="mb-6 text-4xl font-bold">📱 Responsive Design Test</h1>

        <div className="space-y-8">
          {/* Viewport Info */}
          <section className="rounded border border-gray-300 p-4 dark:border-gray-600">
            <h2 className="mb-3 text-2xl font-bold text-red-600">
              Viewport Meta Tag
            </h2>
            <p className="mb-2">
              ✅ This page includes:{" "}
              <code className="rounded bg-gray-200 px-2 py-1 dark:bg-gray-700">
                width=device-width, initial-scale=1.0
              </code>
            </p>
            <p className="text-sm">
              Without this, iPhone renders at ~980px desktop width
            </p>
          </section>

          {/* Breakpoint Tests */}
          <section className="rounded border border-gray-300 p-4 dark:border-gray-600">
            <h2 className="mb-3 text-2xl font-bold text-red-600">
              Tailwind Breakpoint Tests
            </h2>

            <div className="space-y-3">
              <div className="rounded bg-blue-500 p-3 text-white md:bg-green-500 lg:bg-purple-500">
                <strong>Color Test:</strong>
                <ul className="mt-1 ml-4 list-disc text-sm">
                  <li>
                    Mobile (&lt;768px): <strong>Blue</strong>
                  </li>
                  <li>
                    Tablet (768px-1023px): <strong>Green</strong>
                  </li>
                  <li>
                    Desktop (≥1024px): <strong>Purple</strong>
                  </li>
                </ul>
              </div>

              <div className="text-base md:text-2xl lg:text-4xl">
                <strong>Font Size Test:</strong> This text should be{" "}
                <span className="text-red-600">16px</span> on mobile,{" "}
                <span className="text-red-600">24px</span> on tablet, and{" "}
                <span className="text-red-600">36px</span> on desktop.
              </div>

              <div className="flex flex-col md:flex-row md:gap-4">
                <div className="rounded bg-red-100 p-2 dark:bg-red-900">
                  Box 1
                </div>
                <div className="rounded bg-green-100 p-2 dark:bg-green-900">
                  Box 2
                </div>
                <div className="rounded bg-blue-100 p-2 dark:bg-blue-900">
                  Box 3
                </div>
              </div>
              <p className="text-sm">
                ↑ Boxes should <strong>stack vertically</strong> on mobile,{" "}
                <strong>horizontal row</strong> on tablet/desktop
              </p>
            </div>
          </section>

          {/* Custom Breakpoints (react-media) */}
          <section className="rounded border border-gray-300 p-4 dark:border-gray-600">
            <h2 className="mb-3 text-2xl font-bold text-red-600">
              Custom Breakpoints (react-media)
            </h2>
            <p className="mb-2">
              Your site uses custom breakpoints via react-media:
            </p>
            <ul className="ml-6 list-disc space-y-1">
              <li>
                <strong>Small:</strong> &lt;600px (mobile)
              </li>
              <li>
                <strong>Medium:</strong> 600px - 1199px (tablet)
              </li>
              <li>
                <strong>Large:</strong> ≥1200px (desktop)
              </li>
            </ul>
            <p className="mt-3 rounded bg-yellow-100 p-2 text-sm dark:bg-yellow-900">
              ⚠️ These are DIFFERENT from Tailwind&apos;s default breakpoints!
            </p>
          </section>

          {/* Touch Target Test */}
          <section className="rounded border border-gray-300 p-4 dark:border-gray-600">
            <h2 className="mb-3 text-2xl font-bold text-red-600">
              Touch Target Test
            </h2>
            <p className="mb-3 text-sm">
              iOS guidelines: minimum 44x44px touch targets
            </p>

            <div className="space-y-2">
              <button className="h-11 rounded bg-blue-500 px-4 text-white hover:bg-blue-600">
                ✅ Good Button (44px tall)
              </button>

              <button className="h-6 rounded bg-red-500 px-2 text-xs text-white hover:bg-red-600">
                ❌ Bad Button (24px tall - too small!)
              </button>
            </div>
          </section>

          {/* Dark Mode Test */}
          <section className="rounded border border-gray-300 p-4 dark:border-gray-600">
            <h2 className="mb-3 text-2xl font-bold text-red-600">
              Dark Mode Test
            </h2>
            <div className="space-y-2">
              <div className="rounded bg-white p-3 text-gray-900 dark:bg-gray-800 dark:text-white">
                This box should have white background in light mode, dark
                background in dark mode
              </div>
              <p className="text-sm">
                Check the theme toggle in header. No flash should occur when
                loading pages.
              </p>
            </div>
          </section>

          {/* Horizontal Scroll Test */}
          <section className="rounded border border-gray-300 p-4 dark:border-gray-600">
            <h2 className="mb-3 text-2xl font-bold text-red-600">
              Horizontal Scroll Test
            </h2>
            <div className="overflow-x-auto">
              <div className="min-w-max">
                <p className="whitespace-nowrap">
                  This text is very long and should scroll horizontally within
                  its container: Lorem ipsum dolor sit amet, consectetur
                  adipiscing elit, sed do eiusmod tempor incididunt ut labore et
                  dolore magna aliqua.
                </p>
              </div>
            </div>
            <p className="mt-2 text-sm">
              ✅ Scrolling should be contained to the box, NOT the full page
            </p>
          </section>

          {/* Image Scaling Test */}
          <section className="rounded border border-gray-300 p-4 dark:border-gray-600">
            <h2 className="mb-3 text-2xl font-bold text-red-600">
              Image Scaling Test
            </h2>
            <div className="max-w-full">
              <div className="aspect-video w-full rounded bg-gradient-to-r from-blue-500 to-purple-500"></div>
            </div>
            <p className="mt-2 text-sm">
              ↑ This gradient box should scale to screen width, maintaining 16:9
              aspect ratio
            </p>
          </section>

          {/* Instructions */}
          <section className="rounded border-2 border-yellow-500 bg-yellow-50 p-4 dark:bg-yellow-900/20">
            <h2 className="mb-3 text-xl font-bold">📋 Testing Instructions</h2>
            <ol className="ml-6 list-decimal space-y-2">
              <li>
                <strong>Enable debug mode:</strong> Add <code>?debug</code> to
                URL
                <br />
                <span className="text-sm">
                  Example: http://localhost:8000/responsive-test?debug
                </span>
              </li>
              <li>
                <strong>Check viewport:</strong> Red banner should show your
                device width
                <br />
                <span className="text-sm">
                  iPhone 15 Pro Max = 430px wide in portrait
                </span>
              </li>
              <li>
                <strong>Verify breakpoints:</strong> Check which breakpoint is
                active (SMALL/MEDIUM/LARGE)
              </li>
              <li>
                <strong>Test dark mode:</strong> Toggle theme and reload page -
                no flash should occur
              </li>
              <li>
                <strong>Safari inspector:</strong> Connect iPhone via USB and
                use Safari&apos;s Web Inspector (see MOBILE_TESTING.md)
              </li>
            </ol>
          </section>

          {/* Device Info */}
          <section className="rounded border border-gray-300 p-4 dark:border-gray-600">
            <h2 className="mb-3 text-2xl font-bold text-red-600">
              Expected iPhone 15 Pro Max Values
            </h2>
            <ul className="ml-6 list-disc space-y-1 text-sm">
              <li>
                <strong>Screen width:</strong> 430px (portrait) / 932px
                (landscape)
              </li>
              <li>
                <strong>Device pixel ratio:</strong> 3x
              </li>
              <li>
                <strong>Expected breakpoint:</strong> SMALL (&lt;600px) in
                portrait
              </li>
              <li>
                <strong>Expected color test:</strong> Blue background
              </li>
              <li>
                <strong>Expected layout:</strong> Boxes stacked vertically
              </li>
            </ul>
          </section>
        </div>

        {/* Back Link */}
        <div className="mt-8">
          <a
            href="/"
            className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400"
          >
            ← Back to home
          </a>
        </div>
      </div>
    </Layout>
  )
}
