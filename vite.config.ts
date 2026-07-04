import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

function googleSiteVerificationPlugin(token: string): Plugin {
  return {
    name: "google-site-verification",
    transformIndexHtml(html) {
      const verificationToken = token.trim();

      if (!verificationToken) {
        return html;
      }

      const escapedToken = verificationToken.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
      return html.replace(
        "</head>",
        `    <meta name="google-site-verification" content="${escapedToken}" />\n  </head>`,
      );
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    base: "/",
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("/node_modules/")) {
              return undefined;
            }

            if (id.includes("/node_modules/@supabase/")) {
              return "supabase";
            }

            return "vendor";
          },
        },
      },
    },
    plugins: [react(), googleSiteVerificationPlugin(env.VITE_GOOGLE_SITE_VERIFICATION ?? "")],
  };
});
