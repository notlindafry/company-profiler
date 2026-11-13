// ESLint 9 flat config. (Next.js 16 removed `next lint` and the legacy
// .eslintrc format; eslint-config-next now ships flat configs.)
import coreWebVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...coreWebVitals,
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts"] },
];

export default config;
