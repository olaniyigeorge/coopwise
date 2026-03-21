import { NextResponse } from 'next/server';



const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://coopwise.onrender.com"


export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        return NextResponse.json(
          { error: 'Authorization header is required' },
          { status: 401 }
        );
      }
    
    const payload = await req.json();

    console.log(`\n Submitting to Contrib data to backend: ${JSON.stringify(payload)} \n`)


    const backendRes = await fetch(`${API_URL}/api/v1/contributions/contribute/`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
    });

    if (!backendRes.ok) {
      const error = await backendRes.json();
      return NextResponse.json(error, { status: backendRes.status });
    }

    const data = await backendRes.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
