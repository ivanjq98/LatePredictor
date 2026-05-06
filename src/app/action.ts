// app/actions.ts
"use server";

export async function proxyApiCall(payload: any) {
  console.log("This will appear in your VS Code Terminal!");
  // ... fetch logic here
}

export async function postToApi(payload: any) {
    const res = await fetch(process.env.API_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  }