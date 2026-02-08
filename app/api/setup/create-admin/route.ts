import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Missing Supabase configuration" }, { status: 500 })
    }

    // Create Supabase client with service role
    const supabase = createServerClient(supabaseUrl, serviceRoleKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    })

    // Check if admin already exists
    const { data: existingAdmin, error: checkError } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "admin")
      .maybeSingle()

    console.log("[v0] Existing admin check:", { existingAdmin, checkError })

    if (existingAdmin) {
      return NextResponse.json({ error: "Admin account already exists" }, { status: 400 })
    }

    const { data, error: signUpError } = await supabase.auth.admin.createUser({
      email: "nyanjomadmin1@gmail.com",
      password: "Nyanjom531723#",
      email_confirm: true,
    })

    console.log("[v0] Auth user creation:", { user: data?.user?.id, error: signUpError })

    if (signUpError || !data?.user) {
      console.error("[v0] Auth error:", signUpError)
      return NextResponse.json(
        { error: `Auth error: ${signUpError?.message || "Failed to create user"}` },
        { status: 400 },
      )
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: data.user.id,
        email: "nyanjomadmin1@gmail.com",
        full_name: "Admin User",
        role: "admin",
      })
      .select()

    console.log("[v0] Profile creation:", { profileData, error: profileError })

    if (profileError) {
      console.error("[v0] Profile error:", profileError)
      await supabase.auth.admin.deleteUser(data.user.id)
      return NextResponse.json({ error: `Profile error: ${profileError.message}` }, { status: 400 })
    }

    return NextResponse.json(
      {
        message: "Admin account created successfully",
        email: "nyanjomadmin1@gmail.com",
        userId: data.user.id,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] Setup error:", error)
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 },
    )
  }
}
