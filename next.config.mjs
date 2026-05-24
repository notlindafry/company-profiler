/** @type {import('next').NextConfig} */
const nextConfig = {
  // Belt-and-suspenders noindex: send the header on every response, not just
  // the HTML pages (covers anything a crawler might fetch).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;
