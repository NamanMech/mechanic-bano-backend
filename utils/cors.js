const allowedOrigins = [
  "https://mechanic-bano-admin.netlify.app",
  "http://localhost:3000",
  "http://localhost:5173"
];

export function setCorsHeaders(req, res) {
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  } else {
    // CORS restrict for unknown origins instead of '*'
    res.setHeader("Access-Control-Allow-Origin", "null");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return true; // indicate that response has ended
  }

  return false; // continue normal flow for other request methods
}
