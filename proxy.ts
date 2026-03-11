import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

// Debug flag - set to false in production
const DEBUG = process.env.NODE_ENV === "development";

export async function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = request.nextUrl;

  DEBUG && console.log(`\n🔍 [Middleware] Path: ${pathname}`);

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) =>
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        ),
    },
  });

  // 🔐 Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  DEBUG && console.log("👤 Auth User:", user?.id || "No user");
  DEBUG && authError && console.error("❌ Auth Error:", authError.message);

  const isProtectedRoute = pathname.startsWith("/home");
  const isAdminRoute = pathname.startsWith("/home/admin");

  DEBUG && console.log("🔒 Protected:", isProtectedRoute, "| Admin:", isAdminRoute);

  // 🚫 Not logged in → redirect
  if (isProtectedRoute && !user) {
    DEBUG && console.log("🚫 Redirect: No user on protected route");
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If no admin route, skip role checks (performance boost)
  if (!isAdminRoute) {
    DEBUG && console.log("✅ Pass: Not admin route");
    return response;
  }

  // 👤 Get internal user record
  DEBUG && console.log("🔍 Looking up user with auth_id:", user?.id);

  const { data: dbUser, error: userError } = await supabase
    .from("users")
    .select("user_id")
    .eq("auth_user_id", user?.id)
    .single();

  DEBUG && console.log("📋 DB User:", dbUser?.user_id || "Not found");
  DEBUG && userError && console.error("❌ User Lookup Error:", userError.message);

  if (userError || !dbUser) {
    DEBUG && console.log("🚫 Redirect: User not found in DB");
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 🎖 Get role assignment
  DEBUG && console.log("🔍 Looking up assignment for user_id:", dbUser.user_id);

  const { data: assignment, error: roleError } = await supabase
    .from("user_assignments")
    .select("role_id")
    .eq("user_id", dbUser.user_id)
    .single();

  DEBUG && console.log("🎖 Assignment:", assignment || "Not found");
  DEBUG && roleError && console.error("❌ Role Error:", roleError.message);

  if (roleError || !assignment) {
    DEBUG && console.log("🚫 Redirect: No role assignment");
    return NextResponse.redirect(new URL("/home/user", request.url));
  }

  // 🔐 Admin role check
  const ADMIN_ROLE_IDs = [1, 2];
  const isAdmin = ADMIN_ROLE_IDs.includes(assignment.role_id);

  DEBUG && console.log(`🔐 Role Check: ${assignment.role_id} === ${ADMIN_ROLE_IDs} ? ${isAdmin}`);

  if (!isAdmin) {
    DEBUG && console.log("🚫 Redirect: Not admin");
    return NextResponse.redirect(new URL("/home/user", request.url));
  }

  DEBUG && console.log("✅ Pass: Admin access granted");
  return response;
}

export const config = {
  matcher: ["/home/:path*"],
};