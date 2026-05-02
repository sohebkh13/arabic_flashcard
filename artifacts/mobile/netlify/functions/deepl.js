const DEEPL_API_ROOT = "https://api-free.deepl.com/v2";

function buildHeaders(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  };

  if (event.headers?.authorization) {
    headers.Authorization = event.headers.authorization;
  }

  return headers;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: buildHeaders(event),
      body: "",
    };
  }

  let path = event.path || "/";
  path = path.replace(/^\/?\.netlify\/functions\/deepl/, "").replace(/^\/api\/deepl/, "") || "/";
  const upstreamUrl = `${DEEPL_API_ROOT}${path.startsWith("/") ? "" : "/"}${path}${event.rawQuery ? `?${event.rawQuery}` : ""}`;

  const response = await fetch(upstreamUrl, {
    method: event.httpMethod,
    headers: {
      Authorization: event.headers?.authorization || event.headers?.Authorization || "",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: event.httpMethod === "GET" || event.httpMethod === "HEAD" ? undefined : event.body,
  });

  const body = await response.text();
  return {
    statusCode: response.status,
    headers: {
      ...buildHeaders(event),
      "Content-Type": response.headers.get("content-type") || "application/json",
    },
    body,
  };
};