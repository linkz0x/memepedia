import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isAdminRoute = request.nextUrl.pathname.startsWith("/council-of-elders");
  const isLoginPage = request.nextUrl.pathname === "/council-of-elders/login";

  if (isAdminRoute && !isLoginPage) {
    if (!session || session.user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.redirect(
        new URL("/council-of-elders/login", request.url)
      );
    }
  }

  if (isLoginPage && session?.user.email === process.env.ADMIN_EMAIL) {
    return NextResponse.redirect(
      new URL("/council-of-elders", request.url)
    );
  }

  return response;
}

export const config = {
  matcher: ["/council-of-elders/:path*"],
};
