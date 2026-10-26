"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

/**
 * Logo splash: the ball lobs in from the left, bounces off the floor of the
 * frame, then flies up into its socket while the swoosh paints in behind it
 * as its trail. Ends on the exact final logo, holds, then fades away.
 *
 * Drop-in for Next.js (App Router) / React 18+. No dependencies.
 *
 *   // app/layout.tsx
 *   <body>
 *     <SplashScreen />
 *     {children}
 *   </body>
 */

export type SplashControls = {
  /** Restart the animation from the beginning. */
  replay: () => void;
  /** Freeze on a given moment (ms, at speed 1). Handy for tweaking. */
  seek: (ms: number) => void;
  /** Total length in ms at speed 1, including hold and fade-out. */
  duration: number;
};

export type SplashScreenProps = {
  /** Called once the splash has faded out and unmounted. */
  onFinish?: () => void;
  /** Overlay background. */
  background?: string;
  /** CSS width of the logo. */
  size?: string;
  /** 1 = default timing, 1.5 = 50% faster, 0.5 = slow motion. */
  speed?: number;
  /** How long to hold the finished logo before fading out (ms). */
  hold?: number;
  /** Fade the overlay out at the end. Set false to keep the final logo on screen. */
  exit?: boolean;
  /** Only play once per browser session (sessionStorage). */
  oncePerSession?: boolean;
  /** Receives replay/seek controls. */
  onReady?: (controls: SplashControls) => void;
};

const COLORS = { purple: "#BB9AD0", black: "#050505", yellow: "#E0DE29" };

// Logo geometry, traced from the supplied artwork (viewBox units).
const LOGO = {
  // purple frame
  outer: "M145.82 21A23.5 23.5 0 0 1 159.83 16.36L264.11 16.36A23.5 23.5 0 0 1 287.61 39.86L287.61 240.32A23.5 23.5 0 0 1 264.11 263.82L38.86 263.82A23.5 23.5 0 0 1 15.36 240.32L15.36 129.71A23.5 23.5 0 0 1 24.85 110.84Z",
  // black panel
  inner: "M156.29 35.09A5.95 5.95 0 0 1 159.83 33.91L264.11 33.91A5.95 5.95 0 0 1 270.06 39.86L270.06 240.32A5.95 5.95 0 0 1 264.11 246.27L38.86 246.27A5.95 5.95 0 0 1 32.91 240.32L32.91 129.71A5.95 5.95 0 0 1 35.31 124.93Z",
  // yellow field with the empty socket (the starting state)
  field: "M257.97 142.92L257.94 142.35L257.89 141.98L257.82 141.6L257.72 141.24L257.53 140.7L257.37 140.35L257.19 140.02L256.99 139.69L256.77 139.39L256.53 139.09L256.27 138.81L255.99 138.55L255.54 138.2L255.23 137.99L254.9 137.8L254.56 137.63L254.03 137.42L253.48 137.26L253.11 137.19L252.54 137.13L252.16 137.11L244.57 137.11L244.21 137.13L243.85 137.19L243.5 137.28L243.16 137.4L242.94 137.51L241.79 138.13L240.93 138.57L240.06 139L238.89 139.54L237.71 140.06L236.51 140.55L235.61 140.89L234.39 141.33L232.55 141.92L231.62 142.2L230.37 142.53L229.12 142.84L228.17 143.05L227.22 143.24L225.95 143.47L225 143.62L223.72 143.79L222.43 143.94L221.47 144.02L220.5 144.09L219.22 144.15L217.92 144.18L216.96 144.19L215.67 144.16L214.7 144.13L213.73 144.07L212.45 143.97L211.16 143.83L209.88 143.67L208.92 143.52L207.65 143.3L205.75 142.91L203.87 142.45L202.01 141.92L201.09 141.63L199.86 141.22L198.05 140.55L196.26 139.81L194.5 139L193.63 138.57L192.48 137.98L190.79 137.03L189.69 136.37L188.87 135.85L187.26 134.78L185.69 133.64L184.66 132.86L183.91 132.25L182.44 130.99L181.01 129.68L180.09 128.78L179.41 128.09L178.09 126.67L176.83 125.21L176.01 124.2L175.42 123.44L174.28 121.88L173.19 120.27L172.16 118.63L171.2 116.95L170.3 115.24L169.46 113.49L168.68 111.72L168.2 110.52L167.86 109.61L167.23 107.78L166.67 105.93L166.18 104.06L165.75 102.17L165.51 100.9L165.35 99.95L165.12 98.35L164.97 97.07L164.85 95.78L164.76 94.49L164.71 93.2L164.68 91.59L164.7 90.3L164.74 89.01L164.82 87.72L164.97 86.11L165.12 84.83L165.3 83.55L165.51 82.28L165.75 81.01L166.03 79.75L166.42 78.18L166.67 77.25L167.04 76.01L167.44 74.78L167.86 73.57L168.2 72.66L168.68 71.46L169.19 70.27L169.59 69.39L170.3 67.94L170.89 66.79L171.67 65.38L172.33 64.27L173.01 63.18L173.72 62.1L174.65 60.78L175.56 59.55L175.83 59.14L176.08 58.71L176.4 58.04L176.57 57.57L176.71 57.09L176.83 56.61L176.91 56.12L176.96 55.38L176.96 54.88L176.93 54.38L176.81 53.65L176.7 53.16L176.55 52.69L176.38 52.23L176.17 51.77L175.93 51.34L175.67 50.92L175.37 50.51L175.06 50.13L174.71 49.77L174.35 49.44L173.76 48.98L173.35 48.7L172.92 48.46L172.24 48.15L171.77 47.97L171.3 47.83L170.81 47.73L170.32 47.65L169.58 47.6L169.08 47.6L168.58 47.64L168.09 47.71L167.61 47.81L167.13 47.95L166.66 48.11L166.2 48.31L165.76 48.53L165.33 48.78L164.92 49.07L43.61 138.34L43.1 138.75L42.78 139.06L42.48 139.38L42.08 139.9L41.84 140.27L41.52 140.85L41.26 141.46L41.12 141.87L41.01 142.3L40.89 142.95L40.85 143.39L40.84 143.83L40.84 225.07L40.86 225.73L40.88 226.05L40.97 226.7L41.03 227.02L41.1 227.33L41.26 227.96L41.47 228.58L41.59 228.88L41.86 229.48L42.17 230.05L42.51 230.6L42.89 231.13L43.31 231.64L43.75 232.11L43.98 232.34L44.47 232.77L44.99 233.16L45.53 233.52L45.81 233.69L46.39 234L46.98 234.27L47.59 234.5L47.9 234.6L48.53 234.76L49.17 234.89L49.81 234.98L50.46 235.02L248.02 235.02L248.67 235L249 234.98L249.64 234.89L249.96 234.83L250.28 234.76L250.91 234.6L251.22 234.5L251.83 234.27L252.42 234L252.99 233.69L253.55 233.35L254.08 232.97L254.33 232.77L254.82 232.34L255.28 231.88L255.71 231.39L256.11 230.87L256.47 230.33L256.8 229.77L257.08 229.18L257.33 228.58L257.44 228.27L257.63 227.65L257.78 227.02L257.88 226.37L257.95 225.73L257.97 225.07Z",
  // the swoosh, split into the stroke painted on the way down (A) and on the way up (B)
  swooshA: "M36.6 174.78L38.48 174.78L40.83 175.35L40.84 177.89L40.87 177.5L40.94 177.25L41.04 177.02L41.24 176.69L41.5 176.4L41.81 176.17L42.04 176.05L42.28 175.97L42.66 175.9L42.92 175.89L43.18 175.92L44.35 176.2L45.54 176.53L46.66 176.93L47.65 177.35L48.74 177.87L49.81 178.44L50.86 179.06L51.92 179.71L52.94 180.38L57 183.14L62.08 186.51L64.07 187.88L66.01 189.29L66.96 190.02L67.89 190.76L68.81 191.52L69.7 192.3L70.58 193.1L71.45 193.92L72.3 194.75L73.98 196.47L74.81 197.35L76.45 199.16L78.07 201.03L79.66 202.95L81.21 204.91L81.96 205.89L83.39 207.87L84.08 208.85L84.74 209.84L85.36 210.82L85.96 211.79L87.1 213.75L90.52 219.91L91.83 222.18L93.26 224.57L93.94 225.78L94.56 226.99L95.05 228.1L95.46 229.34L95.67 230.38L95.69 230.62L95.7 231.25L95.69 231.49L95.65 231.72L95.55 232.17L95.47 232.45L95.35 232.71L95.14 233.08L94.98 233.32L94.89 233.43L94.2 234.1L93.41 234.7L93.18 234.83L92.95 234.92L92.7 234.99L92.44 235.02L87.2 235.02L92.96 235.03L89.4 237.71L89.4 239.5L128.91 239.5L128.91 238.25L125.51 235.04L125.52 235.02L126.29 235.02L126.04 235.01L125.79 234.96L125.55 234.88L125.32 234.78L125.01 234.56L124.55 234.13L123.96 233.43L123.81 233.23L123.69 233.01L123.39 232.38L123.29 232.03L123.14 231.31L123.13 231.03L123.13 230.21L123.16 229.99L123.33 229.02L123.72 227.77L124.16 226.66L124.74 225.46L125.38 224.25L126.13 222.94L106.19 196.35L106.19 196.32L105.98 196.3L105.23 196.09L105.07 196.02L104.96 195.94L104.27 195.35L104.15 195.22L103.48 194.26L102.23 192L101.62 190.93L100.38 188.87L99.09 186.84L97.77 184.83L96.4 182.83L94.99 180.85L94.27 179.87L92.81 177.92L92.07 176.96L90.55 175.05L89 173.17L87.42 171.33L85.8 169.52L84.97 168.62L83.29 166.88L81.57 165.17L80.69 164.34L78.89 162.71L77.05 161.13L75.16 159.6L73.24 158.1L71.29 156.65L69.32 155.23L67.32 153.84L65.3 152.49L63.25 151.2L62.21 150.58L61.16 149.97L60.09 149.39L59.02 148.83L57.93 148.29L56.83 147.77L55.71 147.28L51.22 145.39L50.11 144.9L49.01 144.39L47.94 143.86L46.81 143.26L45.77 142.64L44.83 142.02L43.92 141.4L43.62 141.14L43.38 140.84L43.25 140.61L43.12 140.24L43.06 139.85L43.07 139.59L43.14 139.2L43.28 138.84L43.42 138.61L43.68 138.31L43.88 138.14L48.13 135.01L43.61 138.34L43.27 138.61L42.94 138.9L42.63 139.22L42.34 139.55L41.98 140.05L39.05 138.03L36.6 138.03Z",
  swooshB: "M91.74 222.01L93.26 224.57L93.94 225.78L94.56 226.99L95.05 228.1L95.46 229.34L95.67 230.38L95.69 230.62L95.7 231.25L95.69 231.49L95.55 232.17L95.47 232.45L95.35 232.71L95.14 233.08L94.98 233.32L94.89 233.43L94.2 234.1L93.41 234.7L93.18 234.83L92.95 234.92L92.7 234.99L92.44 235.02L87.2 235.02L92.96 235.03L89.4 237.71L89.4 239.5L128.91 239.5L128.91 238.25L125.51 235.04L125.52 235.02L126.29 235.02L126.04 235.01L125.79 234.96L125.55 234.88L125.32 234.78L125.01 234.56L124.55 234.13L123.96 233.43L123.81 233.23L123.69 233.01L123.39 232.38L123.29 232.03L123.14 231.31L123.13 231.03L123.13 230.21L123.16 229.99L123.33 229.02L123.72 227.77L124.16 226.66L124.74 225.46L125.38 224.25L127.38 220.73L127.99 219.61L129.12 217.44L131.21 213.31L132.26 211.29L133.37 209.27L133.96 208.24L135.21 206.18L136.52 204.1L138.57 200.99L140.65 197.92L142.72 194.93L144.78 192L146.18 190.08L147.6 188.17L149.07 186.28L150.57 184.4L152.12 182.52L153.7 180.67L155.3 178.83L156.92 177.01L158.56 175.23L160.21 173.46L162.71 170.86L164.4 169.15L166.97 166.61L168.72 164.93L170.49 163.27L172.29 161.63L174.12 160.04L175.97 158.48L176.91 157.72L177.85 156.98L179.76 155.52L184.58 151.95L186.51 150.48L188.42 148.96L191.27 146.61L192.24 145.86L193.18 145.16L194.17 144.48L195.18 143.86L196.23 143.31L197.3 142.83L198.61 142.38L199.74 142.11L201.13 141.85L201.28 141.84L201.58 141.84L201.73 141.86L202.02 141.93L201.55 141.77L206.56 140.8L205 118L168.99 99.01L166.15 103.91L166.14 103.9L165.96 103.1L166 103.39L165.99 103.84L165.94 104.13L165.78 104.55L165.48 105.08L164.85 106.12L164.2 107.12L163.52 108.11L162.82 109.08L161.35 110.97L159.84 112.84L156.76 116.56L154.52 119.39L152.31 122.25L148.68 127.05L144.29 132.79L142.11 135.67L140.67 137.61L139.26 139.56L137.17 142.5L135.13 145.48L133.79 147.48L132.47 149.49L130.53 152.54L128.61 155.6L126.72 158.68L124.24 162.8L122.4 165.9L121.2 167.98L119.42 171.12L118.27 173.24L117.14 175.38L116.04 177.53L114.97 179.69L113.41 182.95L112.41 185.12L110.96 188.39L110.03 190.58L108.62 194.11L108.08 195.11L107.97 195.27L107.37 195.88L107.26 195.97L107.09 196.06L106.39 196.29L106.19 196.32L106.19 196.35Z",
  // resting position of the ball
  ball: {"cx": 217.19, "cy": 86.41, "r": 43.69},
  // ball seam, relative to the ball center
  seam: "M-18.58-47.39C-18.68-46.4-18.78-45.41-18.88-44.42C-18.98-43.42-19.08-42.43-19.17-41.44C-19.27-40.45-19.37-39.46-19.47-38.46C-19.57-37.47-19.64-36.47-19.77-35.49C-19.9-34.5-20.07-33.53-20.26-32.55C-20.45-31.58-20.75-30.62-20.89-29.63C-21.03-28.65-21.11-27.65-21.12-26.65C-21.14-25.66-21.09-24.66-20.98-23.67C-20.87-22.68-20.7-21.69-20.48-20.72C-20.25-19.76-19.96-18.8-19.61-17.86C-19.26-16.93-18.85-16.02-18.39-15.14C-17.92-14.26-17.4-13.4-16.83-12.59C-16.25-11.78-15.62-11-14.96-10.26C-14.29-9.52-13.57-8.83-12.83-8.16C-12.09-7.49-11.32-6.86-10.53-6.25C-9.74-5.64-8.93-5.07-8.1-4.51C-7.28-3.95-6.44-3.41-5.59-2.89C-4.74-2.37-3.88-1.86-3-1.38C-2.13-0.9-1.24-0.44-0.35-0.01C0.55 0.42 1.46 0.84 2.38 1.22C3.3 1.61 4.23 1.96 5.16 2.31C6.09 2.66 7.04 2.98 7.97 3.33C8.9 3.68 9.84 4.02 10.75 4.44C11.66 4.85 12.57 5.28 13.41 5.81C14.25 6.33 15.06 6.93 15.79 7.6C16.52 8.27 17.17 9.05 17.79 9.82C18.41 10.6 18.96 11.44 19.52 12.26C20.07 13.09 20.59 13.94 21.15 14.77C21.7 15.6 22.26 16.42 22.83 17.24C23.41 18.05 24.02 18.84 24.59 19.65C25.17 20.47 25.77 21.27 26.3 22.11C26.83 22.95 27.35 23.81 27.78 24.7C28.21 25.6 28.52 26.55 28.86 27.49C29.2 28.43 29.5 29.38 29.81 30.32C30.13 31.27 30.45 32.21 30.77 33.16C31.09 34.1 31.41 35.05 31.73 35.99",
  seamW: 7.94,
  bump: [19.88, 20.98, 4.54],
  dots: [[-3.41, 36.6], [-26.38, 12.18], [-31.77, -9.21]],
  dotR: 4.65,
  // ball path A: lob in from the left, down the short arm to the bounce
  pathA: "M-230 138C-228.16 137.18-226.33 136.35-224.48 135.55C-222.63 134.75-220.77 133.97-218.91 133.21C-217.04 132.45-215.17 131.71-213.29 130.99C-211.41 130.27-209.52 129.58-207.62 128.9C-205.72 128.22-203.82 127.56-201.91 126.92C-200 126.28-198.08 125.68-196.16 125.08C-194.23 124.49-192.3 123.92-190.36 123.37C-188.43 122.82-186.48 122.29-184.53 121.79C-182.58 121.28-180.63 120.8-178.66 120.34C-176.7 119.89-174.74 119.44-172.77 119.03C-170.8 118.62-168.82 118.23-166.84 117.86C-164.86 117.5-162.88 117.14-160.89 116.82C-158.9 116.5-156.91 116.21-154.91 115.93C-152.92 115.66-150.92 115.41-148.92 115.18C-146.92 114.95-144.91 114.74-142.91 114.56C-140.9 114.38-138.89 114.23-136.88 114.09C-134.88 113.96-132.86 113.84-130.85 113.75C-128.84 113.66-126.83 113.6-124.81 113.56C-122.8 113.52-120.79 113.5-118.77 113.5C-116.76 113.5-114.75 113.53-112.73 113.58C-110.72 113.63-108.71 113.7-106.69 113.8C-104.68 113.89-102.67 114-100.66 114.14C-98.65 114.28-96.65 114.45-94.64 114.63C-92.63 114.81-90.63 115.01-88.63 115.23C-86.63 115.46-84.63 115.71-82.63 115.97C-80.64 116.24-78.64 116.53-76.65 116.83C-74.66 117.14-72.67 117.46-70.69 117.81C-68.71 118.16-66.73 118.53-64.75 118.92C-62.78 119.31-60.8 119.71-58.83 120.14C-56.87 120.56-54.9 121-52.94 121.47C-50.98 121.93-49.03 122.42-47.07 122.92C-45.12 123.42-43.18 123.93-41.24 124.47C-39.29 125-37.35 125.55-35.42 126.12C-33.49 126.68-31.57 127.28-29.64 127.88C-27.72 128.48-25.81 129.1-23.9 129.74C-21.98 130.37-20.08 131.02-18.18 131.68C-16.28 132.35-14.38 133.03-12.49 133.73C-10.6 134.43-8.72 135.14-6.84 135.87C-4.96 136.59-3.09 137.33-1.22 138.09C0.65 138.84 2.51 139.61 4.36 140.39C6.22 141.17 8.07 141.97 9.91 142.78C11.76 143.59 13.6 144.41 15.43 145.25C17.26 146.08 19.09 146.94 20.91 147.79C22.73 148.65 24.54 149.52 26.36 150.39C28.18 151.26 29.99 152.13 31.81 153C33.63 153.88 35.44 154.75 37.26 155.62C39.07 156.49 40.89 157.36 42.71 158.23C44.52 159.1 46.34 159.96 48.16 160.84C49.97 161.72 51.79 162.57 53.57 163.52C55.34 164.47 57.1 165.46 58.81 166.52C60.53 167.57 62.2 168.7 63.85 169.85C65.51 171 67.13 172.19 68.72 173.42C70.31 174.66 71.88 175.92 73.4 177.25C74.91 178.57 76.39 179.95 77.81 181.37C79.24 182.79 80.61 184.27 81.94 185.78C83.28 187.29 84.56 188.84 85.82 190.42C87.07 191.99 88.27 193.61 89.47 195.22C90.68 196.84 91.87 198.46 93.06 200.09C94.24 201.72 95.48 203.31 96.6 204.98C97.73 206.65 98.8 208.36 99.81 210.1C100.81 211.85 101.73 213.64 102.62 215.45C103.5 217.25 104.3 219.1 105.12 220.94C105.94 222.78 106.72 224.64 107.53 226.49C108.34 228.33 109.18 230.16 110 232",
  // ball path B: from the bounce up the long arm into the socket
  pathB: "M110 232C110.47 230.42 110.96 228.84 111.41 227.25C111.86 225.66 112.27 224.06 112.7 222.47C113.13 220.88 113.53 219.27 113.99 217.69C114.45 216.1 114.91 214.51 115.45 212.95C115.99 211.39 116.58 209.85 117.24 208.33C117.9 206.82 118.62 205.33 119.39 203.87C120.16 202.41 121.04 201.01 121.85 199.58C122.67 198.14 123.47 196.7 124.28 195.26C125.09 193.82 125.88 192.37 126.7 190.93C127.51 189.5 128.34 188.06 129.18 186.64C130.02 185.22 130.87 183.81 131.74 182.41C132.62 181.01 133.5 179.61 134.4 178.23C135.31 176.84 136.22 175.47 137.15 174.11C138.08 172.74 139.03 171.39 139.99 170.04C140.94 168.7 141.91 167.36 142.9 166.03C143.88 164.71 144.87 163.39 145.88 162.08C146.89 160.77 147.91 159.48 148.94 158.19C149.98 156.9 151.02 155.62 152.08 154.36C153.14 153.09 154.21 151.83 155.3 150.58C156.38 149.34 157.47 148.1 158.57 146.87C159.67 145.64 160.79 144.42 161.91 143.21C163.03 142 164.16 140.79 165.31 139.61C166.46 138.42 167.62 137.25 168.78 136.08C169.95 134.9 171.13 133.75 172.3 132.58C173.46 131.41 174.63 130.24 175.77 129.05C176.91 127.86 178.02 126.64 179.16 125.43C180.29 124.23 181.43 123.04 182.57 121.84C183.7 120.64 184.85 119.45 185.99 118.26C187.13 117.07 188.28 115.88 189.43 114.69C190.58 113.51 191.73 112.32 192.88 111.14C194.03 109.96 195.19 108.78 196.34 107.6C197.5 106.42 198.66 105.24 199.81 104.06C200.97 102.89 202.13 101.71 203.29 100.54C204.45 99.36 205.61 98.19 206.77 97.01C207.93 95.84 209.09 94.66 210.25 93.48C211.41 92.31 212.57 91.13 213.73 89.95C214.88 88.77 216.03 87.59 217.19 86.41",
  // inner bottom edge of the frame (where the ball bounces)
  floor: 246.27,
  // trail half-width along A / B: [fraction of path, units]
  hwA: [[0, 16.26], [0.75, 16.26], [0.906, 12.31], [1, 12.31]],
  hwB: [[0, 12.31], [0.1, 14.71], [0.703, 23.69]],
  // fraction of B where the ball starts growing to full size
  growFrom: 0.703,
} as const;

// Timeline in ms at speed 1.
const T = {
  intro: 320, // logo (empty socket) fades/scales in
  ballStart: 220, // ball launches from the left
  descent: 660, // lob in + run down the short arm of the swoosh
  squash: 70, // contact with the floor
  ascent: 560, // fly up the long arm into the socket
  settle: 420, // land + springy settle
  exit: 420, // overlay fade-out
};

const R0: number = LOGO.ball.r;
const TRAIL_FIT = 1.1; // ball (with outline) a touch wider than the trail, so the trail's leading edge stays hidden under it
const RING = 0.2; // black outline around the flying ball, as a fraction of its radius
const RING_LANDING = 0.12; // outline at touchdown (fits inside the socket)
const TRAIL_A_W = 46; // width of the painting stroke on the way down (covers the short arm)
const TRAIL_B_W = 58; // ...and on the way up (the long arm widens toward the ball)
const LOGO_CX = 151.4;
const LOGO_CY = 140;

const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

function keyed(keys: readonly (readonly [number, number])[], u: number) {
  if (u <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [u1, v1] = keys[i];
    if (u <= u1) {
      const [u0, v0] = keys[i - 1];
      return lerp(v0, v1, smooth((u - u0) / (u1 - u0)));
    }
  }
  return keys[keys.length - 1][1];
}

const STORAGE_KEY = "splash-played";
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function SplashScreen({
  onFinish,
  background = "#000000",
  size = "min(96px, 19.2vw)",
  speed = 1,
  hold = 450,
  exit = true,
  oncePerSession = false,
  onReady,
}: SplashScreenProps) {
  const [done, setDone] = useState(false);
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const maskA = `splash-trail-a-${uid}`;
  const maskB = `splash-trail-b-${uid}`;
  const clipId = `splash-ball-${uid}`;

  const overlayRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<SVGGElement>(null);
  const swooshARef = useRef<SVGPathElement>(null);
  const swooshBRef = useRef<SVGPathElement>(null);
  const trailARef = useRef<SVGPathElement>(null);
  const trailBRef = useRef<SVGPathElement>(null);
  const floorARef = useRef<SVGCircleElement>(null); // fills in the trail under the bounce
  const floorBRef = useRef<SVGCircleElement>(null);
  const ballRef = useRef<SVGGElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const pathARef = useRef<SVGPathElement>(null);
  const pathBRef = useRef<SVGPathElement>(null);
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;
  const readyRef = useRef(onReady);
  readyRef.current = onReady;

  useIsoLayoutEffect(() => {
    if (!oncePerSession) return;
    try {
      if (sessionStorage.getItem(STORAGE_KEY)) setDone(true);
    } catch {
      /* storage unavailable: just play */
    }
  }, [oncePerSession]);

  useEffect(() => {
    if (done) return;
    const overlay = overlayRef.current!;
    const logo = logoRef.current!;
    const swooshA = swooshARef.current!;
    const swooshB = swooshBRef.current!;
    const trailA = trailARef.current!;
    const trailB = trailBRef.current!;
    const floorA = floorARef.current!;
    const floorB = floorBRef.current!;
    const ball = ballRef.current!;
    const ring = ringRef.current!;
    const pathA = pathARef.current!;
    const pathB = pathBRef.current!;

    const LA = pathA.getTotalLength();
    const LB = pathB.getTotalLength();
    const LT = LA + LB;
    const bounce = pathA.getPointAtLength(LA);
    const lagA = TRAIL_A_W / 2 / LA;
    const lagB = TRAIL_B_W / 2 / LB;

    const tA0 = T.ballStart;
    const tA1 = tA0 + T.descent;
    const tS1 = tA1 + T.squash;
    const tB1 = tS1 + T.ascent;
    const tSet1 = tB1 + T.settle;
    const tExit0 = tSet1 + hold;
    const tEnd = exit ? tExit0 + T.exit : tSet1;

    const hwA = LOGO.hwA;
    const hwB = LOGO.hwB;
    const hwAEnd = hwA[hwA.length - 1][1];
    const hwBEnd = hwB[hwB.length - 1][1];

    const at = (path: SVGPathElement, L: number, s: number) => {
      const p = path.getPointAtLength(Math.max(0, Math.min(L, s)));
      const q = path.getPointAtLength(Math.max(0, Math.min(L, s + (s + 1 > L ? -1 : 1))));
      const dir = s + 1 > L ? Math.atan2(p.y - q.y, p.x - q.x) : Math.atan2(q.y - p.y, q.x - p.x);
      return { x: p.x, y: p.y, dir: (dir * 180) / Math.PI };
    };

    let maskOn = true;
    const render = (tt: number) => {
      // ---- logo intro / exit ----
      const ti = easeOutCubic(clamp01(tt / T.intro));
      let logoScale = lerp(0.92, 1, ti);
      let overlayOpacity = 1;

      let x: number = LOGO.ball.cx;
      let y: number = LOGO.ball.cy;
      let R = R0;
      let k = RING;
      let dir = 0;
      let stretch = 0;
      let sx = 1;
      let sy = 1;
      let ballOpacity = 1;
      let progress = 0; // distance travelled / total, drives spin
      let frontA = 0; // how much of the down-stroke of the trail is painted (0..1)
      let frontB = 0; // ...and of the up-stroke

      if (tt < tA0) {
        const p = at(pathA, LA, 0);
        x = p.x;
        y = p.y;
        ballOpacity = 0;
        R = (TRAIL_FIT * hwA[0][1]) / (1 + k);
      } else if (tt < tA1) {
        // lob in from the left, accelerating like it's falling
        const u = (tt - tA0) / T.descent;
        const f = 0.3 * u + 0.7 * u * u;
        const s = f * LA;
        const p = at(pathA, LA, s);
        x = p.x;
        y = p.y;
        dir = p.dir;
        R = (TRAIL_FIT * keyed(hwA, f)) / (1 + k);
        const v = ((0.3 + 1.4 * u) * LA) / (T.descent / 1000); // units / s
        stretch = Math.min(0.15, v * 1.1e-4);
        ballOpacity = clamp01(u / 0.12);
        progress = s / LT;
        frontA = f;
      } else if (tt < tS1) {
        // squash against the floor, bottom stays planted
        const a = Math.sin(Math.PI * ((tt - tA1) / T.squash));
        sx = 1 + 0.26 * a;
        sy = 1 - 0.32 * a;
        R = (TRAIL_FIT * hwAEnd) / (1 + k);
        x = bounce.x;
        y = LOGO.floor - R * (1 + k) * sy;
        progress = LA / LT;
        frontA = 1;
      } else if (tt < tB1) {
        // rebound up the long arm, slowing as it reaches the socket
        const u = (tt - tS1) / T.ascent;
        const f = 1 - (1 - u) ** 2.4;
        const s = f * LB;
        const p = at(pathB, LB, s);
        x = p.x;
        y = p.y;
        dir = p.dir;
        if (f > 0.85) k = lerp(RING, RING_LANDING, smooth((f - 0.85) / 0.15));
        if (f < LOGO.growFrom) {
          R = (TRAIL_FIT * keyed(hwB, f)) / (1 + RING);
        } else {
          const g = (f - LOGO.growFrom) / (1 - LOGO.growFrom);
          R = lerp((TRAIL_FIT * hwBEnd) / (1 + RING), R0, smooth(g));
        }
        const v = (2.4 * (1 - u) ** 1.4 * LB) / (T.ascent / 1000);
        stretch = Math.min(0.15, v * 1.1e-4) * (1 - f);
        progress = (LA + s) / LT;
        frontA = 1;
        frontB = f;
      } else {
        // touchdown: springy settle, outline melts into the socket
        const tau = clamp01((tt - tB1) / T.settle);
        const m = tau >= 1 ? 1 : 1 + 0.12 * Math.sin(2 * Math.PI * 1.4 * tau) * Math.exp(-5 * tau);
        R = R0 * m;
        k = lerp(RING_LANDING, 0, smooth(clamp01(tau / 0.5)));
        logoScale *= 1 + 0.022 * Math.sin(Math.PI * clamp01(tau / 0.55));
        progress = 1;
        frontA = frontB = 2; // done: show the whole swoosh unmasked
      }

      if (exit && tt > tExit0) {
        const e = easeInOut(clamp01((tt - tExit0) / T.exit));
        overlayOpacity = 1 - e;
        logoScale *= 1 + 0.05 * e;
      }

      const theta = -560 * (1 - progress);
      logo.setAttribute(
        "transform",
        `translate(${LOGO_CX} ${LOGO_CY}) scale(${logoScale}) translate(${-LOGO_CX} ${-LOGO_CY})`,
      );
      logo.style.opacity = String(ti);
      overlay.style.opacity = String(overlayOpacity);
      overlay.style.pointerEvents = overlayOpacity < 1 ? "none" : "auto";

      ball.style.opacity = String(ballOpacity);
      ball.setAttribute(
        "transform",
        `translate(${x} ${y}) rotate(${dir}) scale(${1 + stretch} ${1 / (1 + stretch)}) rotate(${-dir}) ` +
          `scale(${sx} ${sy}) rotate(${theta}) scale(${R / R0})`,
      );
      ring.setAttribute("r", String(R0 * (1 + k)));

      const masked = frontB <= 1;
      if (masked !== maskOn) {
        maskOn = masked;
        if (masked) {
          swooshA.setAttribute("mask", `url(#${maskA})`);
          swooshB.setAttribute("mask", `url(#${maskB})`);
        } else {
          swooshA.removeAttribute("mask");
          swooshB.removeAttribute("mask");
        }
      }
      if (masked) {
        // the painted stroke has a round leading edge that trails just behind the ball's center
        const la = frontA >= 1 ? 1 : frontA - lagA;
        const lb = frontB >= 1 ? 1 : frontB - lagB;
        trailA.setAttribute("visibility", la > 0 ? "visible" : "hidden");
        trailB.setAttribute("visibility", lb > 0 ? "visible" : "hidden");
        trailA.setAttribute("stroke-dashoffset", String(1000 * (1 - Math.max(0, la))));
        trailB.setAttribute("stroke-dashoffset", String(1000 * (1 - Math.max(0, lb))));
        const touched = frontA >= 1 ? "1" : "0";
        floorA.setAttribute("opacity", touched);
        floorB.setAttribute("opacity", touched);
      }
    };

    const reduceMotion =
      typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    let t0 = 0;
    let offset = 0;
    let finished = false;
    let cur = 0; // current time in the animation, for skipping

    const finish = () => {
      if (finished) return;
      finished = true;
      try {
        if (oncePerSession) sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {
        /* ignore */
      }
      document.documentElement.classList.remove("splash-on");
      if (exit) setDone(true);
      finishRef.current?.();
    };

    const tick = (now: number) => {
      if (!t0) t0 = now;
      const tt = offset + (now - t0) * speed;
      cur = tt;
      render(Math.min(tt, tEnd));
      if (tt >= tEnd) finish();
      else raf = requestAnimationFrame(tick);
    };

    const start = (from: number) => {
      cancelAnimationFrame(raf);
      finished = false;
      t0 = 0;
      offset = from;
      render(from);
      raf = requestAnimationFrame(tick);
    };

    start(reduceMotion ? tSet1 : 0);

    // Skippable (spec §4): a click or tap, Esc, Enter or Space jumps straight to the fade-out.
    // While it plays the page behind can't be scrolled or clicked.
    const skip = () => {
      if (!finished && cur < tExit0) start(Math.max(tExit0, tSet1));
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") skip();
    };
    overlay.addEventListener("click", skip);
    window.addEventListener("keydown", onKey);
    document.documentElement.classList.add("splash-on");

    readyRef.current?.({
      replay: () => start(0),
      seek: (ms: number) => {
        cancelAnimationFrame(raf);
        render(Math.max(0, Math.min(ms, tEnd)));
      },
      duration: tEnd,
    });

    return () => {
      cancelAnimationFrame(raf);
      overlay.removeEventListener("click", skip);
      window.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("splash-on");
    };
  }, [done, speed, hold, exit, oncePerSession, maskA, maskB]);

  if (done) return null;

  const b = LOGO.ball;
  return (
    <div
      ref={overlayRef}
      data-splash=""
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "grid",
        placeItems: "center",
        background,
        overflow: "hidden",
        cursor: "pointer",
      }}
    >
      <noscript>
        <style>{"[data-splash]{display:none!important}"}</style>
      </noscript>
      <svg viewBox="6 8 291 264" style={{ width: size, height: "auto", overflow: "visible" }} focusable="false">
        <defs>
          {/* the trail is painted by a stroke that follows the ball (one per stroke of the check) */}
          <mask id={maskA} maskUnits="userSpaceOnUse" x="-320" y="-80" width="700" height="440">
            <path
              ref={trailARef}
              d={LOGO.pathA}
              fill="none"
              stroke="#fff"
              strokeWidth={TRAIL_A_W}
              strokeLinecap="round"
              strokeLinejoin="round"
              visibility="hidden"
              pathLength={1000}
              strokeDasharray="1000 1000"
              strokeDashoffset={1000}
            />
            <circle ref={floorARef} cx={110} cy={238} r={18} fill="#fff" opacity={0} />
          </mask>
          <mask id={maskB} maskUnits="userSpaceOnUse" x="-320" y="-80" width="700" height="440">
            <path
              ref={trailBRef}
              d={LOGO.pathB}
              fill="none"
              stroke="#fff"
              strokeWidth={TRAIL_B_W}
              strokeLinecap="round"
              strokeLinejoin="round"
              visibility="hidden"
              pathLength={1000}
              strokeDasharray="1000 1000"
              strokeDashoffset={1000}
            />
            <circle ref={floorBRef} cx={110} cy={238} r={18} fill="#fff" opacity={0} />
          </mask>
          <clipPath id={clipId}>
            <circle r={b.r} />
          </clipPath>
        </defs>
        {/* invisible guides the ball travels along */}
        <path ref={pathARef} d={LOGO.pathA} fill="none" stroke="none" />
        <path ref={pathBRef} d={LOGO.pathB} fill="none" stroke="none" />

        <g ref={logoRef} style={{ opacity: 0 }}>
          <path d={LOGO.outer} fill={COLORS.purple} />
          <path d={LOGO.inner} fill={COLORS.black} />
          <path d={LOGO.field} fill={COLORS.yellow} />
          <path ref={swooshARef} d={LOGO.swooshA} fill={COLORS.black} mask={`url(#${maskA})`} />
          <path ref={swooshBRef} d={LOGO.swooshB} fill={COLORS.black} mask={`url(#${maskB})`} />
          <g ref={ballRef} style={{ opacity: 0 }}>
            <circle ref={ringRef} r={b.r * (1 + RING)} fill={COLORS.black} />
            <circle r={b.r} fill={COLORS.yellow} />
            <g clipPath={`url(#${clipId})`}>
              <path
                d={LOGO.seam}
                fill="none"
                stroke={COLORS.black}
                strokeWidth={LOGO.seamW}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx={LOGO.bump[0]} cy={LOGO.bump[1]} r={LOGO.bump[2]} fill={COLORS.black} />
            </g>
            {LOGO.dots.map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r={LOGO.dotR} fill={COLORS.black} />
            ))}
          </g>
        </g>
      </svg>
    </div>
  );
}
