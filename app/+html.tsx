import { ScrollViewStyleReset } from 'expo-router/html';

export default function RootLayoutHTML({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        
        <style dangerouslySetInnerHTML={{ __html: `
          * {
            box-sizing: border-box;
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          }

          html, body {
            height: 100%;
            margin: 0;
            padding: 0;
            background-color: #070a0f !important;
            color: #f1f5f9;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden;
          }

          /* Centered Mobile Phone Shell Container for Desktop Browsers */
          #root {
            width: 100%;
            max-width: 440px;
            height: 100vh;
            max-height: 900px;
            margin: 0 auto;
            background-color: #0c1017;
            position: relative;
            box-shadow: 0px 20px 60px rgba(0, 0, 0, 0.85), 0px 0px 0px 12px #182232, 0px 0px 0px 14px #0c1017;
            border-radius: 40px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }

          @media (max-width: 500px) {
            #root {
              max-width: 100%;
              max-height: 100vh;
              border-radius: 0;
              box-shadow: none;
            }
          }

          /* Neumorphic Soft UI Outset Raised Cards & Buttons */
          .neu-outset {
            background: linear-gradient(145deg, #131b26, #0e141d) !important;
            box-shadow: 8px 8px 20px #06080d, -6px -6px 16px #1a2433 !important;
            border-radius: 20px !important;
            border: 1px solid rgba(255, 255, 255, 0.05) !important;
          }

          .neu-outset-pill {
            background: linear-gradient(145deg, #141c28, #0e141e) !important;
            box-shadow: 5px 5px 12px #07090e, -4px -4px 10px #1a2534 !important;
            border-radius: 30px !important;
            border: 1px solid rgba(255, 255, 255, 0.06) !important;
          }

          .neu-button-emerald {
            background: linear-gradient(145deg, #10b981, #059669) !important;
            box-shadow: 6px 6px 16px #05070a, -3px -3px 10px rgba(16, 185, 129, 0.4) !important;
            border-radius: 16px !important;
            border: none !important;
            transition: all 0.2s ease !important;
          }

          /* Neumorphic Inset Sunken Fields */
          .neu-inset {
            background: #090d14 !important;
            box-shadow: inset 4px 4px 10px #040609, inset -3px -3px 8px #131a25 !important;
            border-radius: 14px !important;
            border: 1px solid rgba(255, 255, 255, 0.03) !important;
          }
        ` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
