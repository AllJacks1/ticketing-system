"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/supabase/client";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

function Authentication() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    const supabase = createClient(remember);

    try {
      // 1️⃣ Start a single loading toast
      const toastId = toast.loading("Signing in...");

      // Sign in
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({ email, password });

      if (authError) {
        toast.error(`Login failed: ${authError.message}`, { id: toastId });
        return;
      }

      const userId = authData.user?.id;
      if (!userId) {
        toast.error("User ID not found after login", { id: toastId });
        return;
      }

      toast.success("Signed in successfully!", { id: toastId });

      // 2️⃣ Fetch profile
      toast.loading("Fetching profile...", { id: toastId });
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("auth_user_id", userId)
        .single();

      if (profileError) {
        toast.error(`Error fetching profile: ${profileError.message}`, {
          id: toastId,
        });
        return;
      }
      toast.success("Profile loaded", { id: toastId });

      // 3️⃣ Fetch assignment info
      toast.loading("Fetching assignment info...", { id: toastId });
      const { data: assignment, error: assignmentError } = await supabase
        .from("user_assignments")
        .select(
          `
        designation_id,
        role_id,
        designation:designations(name),
        role:roles(name)
      `,
        )
        .eq("user_id", profile.user_id)
        .single();

      if (assignmentError) {
        toast.error(`Error fetching assignment: ${assignmentError.message}`, {
          id: toastId,
        });
        return;
      }
      toast.success("Assignment info loaded", { id: toastId });

      // 4️⃣ Combine profile + assignment
      const userData = { ...profile, assignment };

      // 5️⃣ Cache it
      localStorage.setItem("userProfile", JSON.stringify(userData));

      toast.success("Login complete! Redirecting...", { id: toastId });

      // 6️⃣ Redirect
      router.push("/home");
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred during login");
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
      <Card className="w-full max-w-105 bg-white border border-gray-200 shadow-sm rounded-xl">
        <div className="p-8 space-y-6">
          {/* Logo & Brand */}
          <div className="flex flex-col items-center space-y-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
              <svg
                className="w-7 h-7 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
                IssueLane
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Sign in to your workspace
              </p>
            </div>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSignIn}>
            {/* Email Field */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-gray-700 block"
              >
                Email
              </label>
              <input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your Email..."
                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-700 block"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password..."
                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
              />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer"
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors">
                  Remember me
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 active:scale-[0.98]"
            >
              Sign in
            </button>
          </form>
        </div>
      </Card>
    </div>
  );
}

export default Authentication;
