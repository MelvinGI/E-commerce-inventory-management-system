import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName, companyName } = await request.json()

    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    })

    // Create the auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: "supplier",
        full_name: fullName,
      },
    })

    if (authError) throw authError

    // Create the profile
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .insert([
        {
          id: authData.user.id,
          email,
          full_name: fullName,
          company_name: companyName,
          role: "supplier",
        },
      ])
      .select()
      .single()

    if (profileError) throw profileError

    return NextResponse.json({ 
      success: true, 
      userId: authData.user.id,
      supplier: profileData 
    })
  } catch (error) {
    console.error("Error creating supplier:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create supplier",
      },
      { status: 400 },
    )
  }
}
