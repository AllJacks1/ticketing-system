import NavigationWrapper from "@/app/home/NavigationWrapper";

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationWrapper>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </NavigationWrapper>
    </div>
  );
}
