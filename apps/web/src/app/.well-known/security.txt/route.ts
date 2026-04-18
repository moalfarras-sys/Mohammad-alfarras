export async function GET() {
  const body = [
    "Contact: mailto:mohammad.alfarras@gmail.com",
    "Expires: 2027-12-31T23:59:59.000Z",
    "Preferred-Languages: ar, en",
    "Canonical: https://moalfarras.space/.well-known/security.txt",
    "",
  ].join("\n");

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

